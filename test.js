var ssbServer = require('ssb-server')

ssbServer
  .use(require('ssb-server/plugins/master'))
  .use(require('./'))

