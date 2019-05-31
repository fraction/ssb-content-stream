const pkg = require('./package.json')
const pull = require('pull-stream')
const pullCat = require('pull-cat')
const crypto = require('crypto')
const level = require('level')
const path = require('path')
const lodash = require('lodash')

const safe64 = (s) => {
  return s.replace('+', '-').replace('/', '_')
}

const isContentMessage = (msg) => {
  // Make sure `content` is an object.
  if (typeof msg.value.content !== 'object') {
    return false
  }

  // Make sure this is a content message.
  if (msg.value.content.type !== 'content') {
    return false
  }

  if (msg.value.content.href.startsWith('ssb:content:sha256') === false) {
    return false
  }
}

const getContentHref = (msg) =>
  isContentMessage(msg) ? msg.value.content.href : null

const createHref = (str) => {
  const hash = crypto.createHash('sha256').update(str)
  const digest = safe64(hash.digest('base64'))
  return `ssb:content:sha256:${digest}`
}

exports.init = (ssb, config) => {
  var db = level(path.join(config.path, 'content'))

  const contentStream = {
    // Returns `createHistoryStream()` with off-chain content added inline.
    //
    // Each message is searched for the follwing pattern:
    //
    // ```javascript
    // {
    //   type: 'content',
    //   href: `ssb:content:sha256:${hash}`
    // }
    // ```
    //
    // Items that pass the pattern are pulled from the database and prepended
    // to the stream so that they don't bottleneck the indexing process.
    createSource: (opts) => pullCat([
      pull(
        ssb.createHistoryStream(opts),
        pull.map(getContentHref),
        pull.filter(),
        pull.unique(),
        pull.asyncMap(db.get)
      ),
      ssb.createHistoryStream(opts)
    ]),

    // Consumes the output of `createSource()` by receiving messages + content
    // and adding them to the database for indexing. This method can tell the
    // difference between messages and content because messages are objects
    // and content is a JSON string.
    //
    // This is a slightly funky implementation because any part of the process
    // could throw an error, so we keep an `errors` array that helps us keep
    // track of all of the moving parts that could crash and burn.
    createHandler: () => {
      const contentMap = {}

      return pull(
        pull.map(val => {
          // If the item is a content string we add it to the `contentMap`
          // object for processing later.
          if (typeof val === 'string') {
            const href = createHref(val)
            contentMap[href] = val
            return null
          }

          return val
        }),
        pull.filter(),
        pull.through((msg) => {
          // Now we take each message and check whether it's in `contentMap`.
          const href = getContentHref(msg)

          if (href == null) {
            return
          }

          if (contentMap[href] == null) {
            throw new Error('messages from content stream must contain content')
          }

          db.put(href, contentMap[href], (err) => {
            if (err) throw err
          })
        })
      )
    },
    // Convenience function for taking a Scuttlebutt message and squeezing out
    // the off-chain content for consumption by applications. This is used
    // with `ssb.addMap()` so that views see content by default, but it may
    // become useful in other contexts.
    getContent: (msg, cb) => {
      if (isContentMessage(msg) === false) {
        return cb(null, msg)
      }

      db.get(msg.value.content.href, (err, val) => {
        if (err) return cb(err, msg)

        lodash.set(msg, 'value.meta.original.content', msg.value.content)
        msg.value.content = JSON.parse(val)
        cb(null, msg)
      })
    },
    // Same API as calling `createHistoryStream()` except that it returns the
    // off-chain content instead of just the metadata.
    getContentStream: (opts) => pull(
      contentStream.createSource(opts),
      contentStream.createHandler(),
      pull.asyncMap(contentStream.getContent)
    ),
    // Takes message value and posts it to your feed as off-chain content.
    publish: (content, cb) => {
      const str = JSON.stringify(content)
      const href = createHref(str)
      const msg = {
        href,
        mediaType: 'text/json',
        type: 'content'
      }
      db.put(href, str, (err) => {
        if (err) return cb(err)
        originalPublish(msg, cb)
      })
    }
  }

  // XXX: is this a bad idea? we want to keep clients from publishing inline content
  const originalPublish = ssb.publish
  // ssb.publish = contentStream.publish

  // This only works when queries are started when `{ private: true }`
  ssb.addMap(contentStream.getContent)

  return contentStream
}

exports.manifest = {
  createSource: 'source',
  createBlobHandler: 'source'
}

exports.permissions = [ 'createSource' ]
exports.name = pkg.name.replace('ssb-', '')
exports.version = pkg.version
