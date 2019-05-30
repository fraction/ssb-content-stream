# ssb-content-stream

> Scuttlebutt stream of messages and off-chain content.

This plugin exposes a method that wraps `createHistoryStream` and returns all
off-chain content referenced by those messages. This gives us the ability to
do deletion and feed replication without using the blob system.

## Usage

```javascript
const server = require('ssb-server')
  .use(require('ssb-master'))
  .use(require('./'))

const config = Object.assign({}, require('ssb-config'), {
  keys: require('ssb-keys').generate() // Random key for testing!
})

const ssb = server(config)

ssb.contentStream.publish({ type: 'test', randomNumber: 42 }, (err, msg) => {
  if (err) throw err
  console.log(msg.value.content)
})
```

```javascript
{ type: 'content',
  href:
   'ssb:content:sha256:rWqRaMb0dfFmss2xan936taWQFfJ_1GGOeckZrFUit8=',
  mediaType: 'text/json' }
```

## API

### createSource(opts)

Wrapper for [`createHistoryStream()`][0] that prepends all off-chain content to the
stream. Since `createHistoryStream()` only returns public and unencrypted messages
this function will only return public messages and its content.

### createHandler(cb)

Creates a through-stream that filters content out of the stream, adds them to the
content store, and only passes the original metadata message through the stream.

### `getContent(msg, cb)`

Takes a full message (`{ key, value: { previous, sequence, ... } }`) and
returns the extracted content from that message in `msg.value.content` as if
it wasn't a message with off-chain content.

### `getContent(opts)

Passes `createSource()` through `createHandler()` and `getContent()`.

### publish(content, cb)

Wraps `ssb.publish()` to publish off-chain messages that can be accessed with
content streams. Message schema is:

```json
{
  "href": "ssb:content:sha256:rWqRaMb0dfFmss2xan936taWQFfJ_1GGOeckZrFUit8=",
  "mediaType": "text/json",
  "type": "content"
}
```

## Installation

With [npm](https://npmjs.org/):

```shell
npm install ssb-content-stream
```

With [yarn](https://yarnpkg.com/en/):

```shell
yarn add ssb-content-stream
```

## See Also

- [Scuttlebutt Protocol Guide](https://ssbc.github.io/scuttlebutt-protocol-guide/)
- [ssb-db](https://github.com/ssbc/ssb-db)
- [ssb-blob-content](https://gitlab.com/christianbundy/ssb-blob-content)

## License

ISC

[0]: https://github.com/ssbc/ssb-db#ssbdbcreatehistorystream-id-feedid-seq-int-live-bool-limit-int-keys-bool-values-bool---pullsource
