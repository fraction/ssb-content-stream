const ssbServer = require('ssb-server')
const ssbConfig = require('ssb-config')
const pull = require('pull-stream')
const pullTee = require('pull-tee')

ssbServer
  .use(require('ssb-server/plugins/master'))
  .use(require('ssb-blobs'))
  .use(require('./'))

const api = ssbServer(ssbConfig)

const streamOpts = Object.assign(
  {},
  api.whoami()
)

pull(
  api.createContentStream(streamOpts),
  pullTee(
    pull(
      pull.filter(Buffer.isBuffer),
      pull.collect(function (err, blobs) {
        if (err) throw err
        console.log('blobs: ' + blobs.length)
      })
    )
  ),
  pull.filter(item => !Buffer.isBuffer(item)),
  pull.collect((err, msgs) => {
    if (err) throw err
    console.log('messages: ' + msgs.length)
    api.close()
  })
)
