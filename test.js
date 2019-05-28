const ssbServer = require('ssb-server')
const { generate } = require('ssb-keys')
const pull = require('pull-stream')
const test = require('tape')
const lodash = require('lodash')

ssbServer.use(require('./'))

let newK = generate()
const ssb = ssbServer({
  temp: 'content-stream-tests',
  keys: newK
})

const count = 12
const limit = 10

const streamOpts = Object.assign(
  {},
  { id: newK.id },
  { limit }
)

const collect = (t) => pull.collect((err, msgs) => {
  t.error(err, 'collect messages without error')
  t.equal(Array.isArray(msgs), true, 'messages is an array')
  t.equal(msgs.length, limit, 'number of messages')
  t.equal(msgs[0].value.author, newK.id, 'author')
})

test.onFinish(ssb.close)

test('publish', (t) => {
  t.plan(3 * count)

  lodash.times(count, () => {
    let sent = {
      type: 'test',
      randomNumber: Math.random()
    }

    // Publish it as off-chain content!
    ssb.publish(sent, (err, received) => {
      t.error(err, 'publish() success')

      // Make sure we retain the original content with `{ private: true }`
      ssb.get({ id: received.key, private: true }, (err, mapped) => {
        t.error(err, 'get() success')
        t.deepEqual(mapped.content, sent, 'content same as original')
      })
    })
  })
})

test('createSource(opts) + createHandler()', (t) => {
  t.plan(4)

  pull(
    ssb.contentStream.createSource(streamOpts),
    ssb.contentStream.createHandler(),
    collect(t)
  )
})

test('getContentStream(opts, cb)', (t) => {
  t.plan(4)

  pull(
    ssb.contentStream.getContentStream(streamOpts),
    collect(t)
  )
})

test('getContentStream(opts)', (t) => {
  t.plan(4)

  pull(
    ssb.contentStream.getContentStream(streamOpts),
    collect(t)
  )
})
