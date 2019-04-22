const pkg = require('./package.json')
const pull = require('pull-stream')
const pullCat = require('pull-cat')
const ssbRef = require('ssb-ref')
const pullCatch = require('pull-catch')
const pullTee = require('pull-tee')

const MB = 1024 * 1024
const MAX_SIZE = 5 * MB
const noop = () => {}

// https://github.com/ssbc/ssb-backlinks/blob/master/emit-links.js#L47-L55
function walk (obj, fn) {
  if (obj && typeof obj === 'object') {
    for (var k in obj) {
      walk(obj[k], fn)
    }
  } else {
    fn(obj)
  }
}

exports.init = (ssb) => {
  const contentStream = {
    createSource: (opts) => pullCat([
      pull(
        ssb.createHistoryStream(opts),
        pull.map(msg => {
          // get blobs referenced by message
          // TODO: use ssb-backlinks or something to cache
          const blobs = []
          walk(msg, (val) => {
            if (ssbRef.isBlob(val)) {
              blobs.push(val)
            }
          })

          return blobs
        }),
        pull.flatten(), // items of arrays of strings => items of strings
        pull.unique(), // don't get the same blob twice
        pull.map((hash) =>
          pull(
            ssb.blobs.get({
              hash,
              max: opts.max || MAX_SIZE
            }),
            pullCatch() // disregard blobs that don't exist or are too big
          )
        ),
        pull.flatten() // convert from pull-stream source to items
      ),
      ssb.createHistoryStream(opts)
    ]),
    createBlobHandler: (cb = noop) => {
      let count = 0
      const errors = []

      return pull(
        pullTee(
          pull(
            pull.filter(Buffer.isBuffer),
            pull.drain((blob) => {
              pull(
                pull.values([blob]),
                ssb.blobs.add((err) => {
                  if (err) errors.push(err)
                  count += 1
                })
              )
            }, (err) => {
              if (err || errors.length) {
                const errConcat = [err, errors]
                return cb(errConcat, count)
              } else {
                cb(null, count)
              }
            })
          )
        ),
        pull.filterNot(Buffer.isBuffer)
      )
    }
  }
  return contentStream
}

exports.manifest = {
  createSource: 'source',
  createBlobHandler: 'source'
}

exports.permissions = [ 'createSource' ]
exports.name = pkg.name.replace('ssb-', '')
exports.version = pkg.version
