# ssb-content-stream

> Scuttlebutt stream of both messages and blobs

This plugin exposes a method that wraps `createHistoryStream` and returns all
blobs that are mentioned by the messages. This is meant to reduce the number
of ad-hoc blob requests and round trips necessary to sync messages and blobs.

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Install

```sh
npm install ssb-content-stream
```

## Usage

```js
const ssbServer = require('ssb-server')
const ssbConfig = require('ssb-config')
const pull = require('pull-stream')

ssbServer
  .use(require('ssb-server/plugins/master'))
  .use(require('ssb-blobs'))
  .use(require('./'))

const ssb = ssbServer(ssbConfig)

const streamOpts = Object.assign({}, ssb.whoami())

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
```

## API


### `contentStream.createSource(opts?)`

Wrapper for [`createHistoryStream`][0] that prepends all referenced blobs to the
stream. Since `createHistoryStream` only returns public and unencrypted messages
this function will only return public and unencrypted blobs.

### `contentStream.createBlobHandler(cb?)`

Creates a through-stream that filters blobs out of the stream, adds them to the
blob store with `ssb.blobs.add`, and only passes messages through the stream.

An optional callback provides `(err, blobNum)` which returns the number of blobs
that were added by the handler.

## Maintainers

[@fraction](https://github.com/fraction)

## Contributing

PRs accepted.

## License

ISC © 2019 Fraction LLC

[0]: https://github.com/ssbc/ssb-db#ssbdbcreatehistorystream-id-feedid-seq-int-live-bool-limit-int-keys-bool-values-bool---pullsource
