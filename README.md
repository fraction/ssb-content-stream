# ssb-content-stream

> Scuttlebutt stream of both messages and off-chain content.

This plugin exposes a method that wraps `createHistoryStream` and returns all
off-chain content referenced by those messages. This gives us the ability to
do deletion and feed replication without using the blob system.

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
  console.log(msg)
})
```

```javascript
{ key: '%hK2+Ed0KJlJ5kR4IbvEs3GZywPJ3GWyyWjsCgsuhtO8=.sha256',
  value:
   { previous: null,
     sequence: 1,
     author: '@MJ+WR+PF/6QPnzN2ef2XyhRNSBIWsx0T45ZAffEcEPk=.ed25519',
     timestamp: 1559086953009,
     hash: 'sha256',
     content:
      { type: 'content',
        href:
         'ssb:content:sha256:rWqRaMb0dfFmss2xan936taWQFfJ_1GGOeckZrFUit8=',
        mediaType: 'text/json' },
     signature:
      'lcCJSMl1cDHr85m8u0WjhZl/DjOENOCzTsH58Jqo2RpQ0AKoGlQVoEC+nwRIStvfz58tbvCIt+ilEOyYxb2rAg==.sig.ed25519' },
  timestamp: 1559086953010 }
```
## API


### `createSource(opts)`

Wrapper for [`createHistoryStream`][0] that prepends all off-chain content to the
stream. Since `createHistoryStream` only returns public and unencrypted messages
this function will only return public messages and its content.

### `createHandler(cb)`

Creates a through-stream that filters content out of the stream, adds them to the
content store, and only passes the original metadata message through the stream.

### `getContent(msg, cb)`

Takes a full message (`{ key, value: { previous, sequence, ... } }`) and 
returns the extracted content from that message in `msg.value.content` as if
it wasn't a message with off-chain content.

### `getContent(opts)`

Passes `createSource()` through `createHandler()` and `getContent()`.

### `publish(content, cb)`

Wraps `ssb.publish` to publish off-chain messages that can be accessed with
content streams. Message schema is:

```json
{
  "href": "ssb:content:sha256:rWqRaMb0dfFmss2xan936taWQFfJ_1GGOeckZrFUit8=",
  "mediaType": "text/json",
  "type": "content"
}
```

## Maintainers

[@fraction](https://github.com/fraction)

## Contributing

PRs accepted.

## License

ISC © 2019 Fraction LLC

[0]: https://github.com/ssbc/ssb-db#ssbdbcreatehistorystream-id-feedid-seq-int-live-bool-limit-int-keys-bool-values-bool---pullsource
