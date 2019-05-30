const crypto = require('crypto')

const safe64 = (s) => {
  return s.replace('+', '-').replace('/', '_')
}

exports.isContentMessage = (msg) => {
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

exports.getContentHref = (msg) =>
  exports.isContentMessage(msg) ? msg.value.content.href : null

exports.createHref = (str) => {
  const hash = crypto.createHash('sha256').update(str)
  const digest = safe64(hash.digest('base64'))
  return `ssb:content:sha256:${digest}`
}
