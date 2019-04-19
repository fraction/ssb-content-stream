const pkg = require('./package.json')
const pull = require('pull-stream')
const pullCat = require('pull-cat')
const ssbRef = require('ssb-ref')
const pullCatch = require('pull-catch')

var MB = 1024 * 1024
var MAX_SIZE = 5 * MB

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

exports.init = (api) => (opts) => {
  const chs = api.createHistoryStream

  return pullCat([
    pull(
      chs(opts),
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
          api.blobs.get({
            hash,
            max: opts.max || MAX_SIZE
          }),
          pullCatch() // disregard blobs that don't exist or are too big
        )
      ),
      pull.flatten() // convert from pull-stream source to items
    ),
    chs(opts)
  ])
}

exports.manifest = {}
exports.name = pkg.name.replace('ssb-', '')
exports.version = pkg.version
