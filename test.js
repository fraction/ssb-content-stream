const ssbServer = require('ssb-server')
const ssbConfig = require('ssb-config')
const pull = require('pull-stream')

ssbServer
  .use(require('ssb-server/plugins/master'))
  .use(require('ssb-blobs'))
  .use(require('./'))

const ssb = ssbServer(ssbConfig)

const streamOpts = Object.assign(
  {},
  ssb.whoami()
)

const count = {
  messages: 0,
  blobs: 0
}

pull(
  ssb.contentStream.createSource(streamOpts),
  ssb.contentStream.createBlobHandler((err, blobNum) => {
    if (err) throw err
    count.blobs = blobNum
  }),
  pull.collect((err, msgs) => {
    if (err) throw err
    count.messages = msgs.length

    ssb.close(() => console.log(count))
  })
)
