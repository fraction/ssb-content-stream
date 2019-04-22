const ssbServer = require('ssb-server')
const ssbConfig = require('ssb-config')
const pull = require('pull-stream')
const test = require('tape')

ssbServer
  .use(require('ssb-server/plugins/master'))
  .use(require('ssb-blobs'))
  .use(require('./'))

const ssb = ssbServer(ssbConfig)

const streamOpts = Object.assign(
  {},
  ssb.whoami(),
  { limit: 10 }
)

const collect = (t) => pull.collect((err, msgs) => {
  t.error(err, 'collect messages without error')
  t.equal(Array.isArray(msgs), true, 'messages is an array')
})

test('createSource(opts) + createBlobHandler()', (t) => {
  t.plan(2)

  pull(
    ssb.contentStream.createSource(streamOpts),
    ssb.contentStream.createBlobHandler(),
    collect(t)
  )
})

test('createSource(opts) + createBlobHandler(cb)', (t) => {
  t.plan(4)

  pull(
    ssb.contentStream.createSource(streamOpts),
    ssb.contentStream.createBlobHandler((err, blobNum) => {
      t.error(err, 'successful blob handler')
      t.equal(typeof blobNum, 'number')
    }),
    collect(t)
  )
})

test('createBlobHandlerSource(opts, cb)', (t) => {
  t.plan(2)

  pull(
    ssb.contentStream.createBlobHandlerSource(streamOpts),
    collect(t)
  )
})

test('createBlobHandlerSource(opts)', (t) => {
  t.plan(4)

  pull(
    ssb.contentStream.createBlobHandlerSource(streamOpts, (err, blobNum) => {
      t.error(err, 'successful blob handler')
      t.equal(typeof blobNum, 'number')
    }),
    collect(t)
  )
})

test.onFinish(ssb.close)

