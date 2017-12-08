const request = require('request')

module.exports.logDestinationUpdated = function (correlationId, destinationId, messageId, field, value) {
  request('http://logger:8084/destinationUpdated/' + correlationId + '/' + destinationId + '/' + messageId + '/' + field + '/' + value, (err, res, body) => {
    if (err) {
      return console.log(err)
    }
  })
}

module.exports.logNewMessage = function (newMessageUid, systemId) {
  request('http://logger:8084/new/' + newMessageUid + '/' + systemId, (err, res, body) => {
    if (err) {
      return console.log(err)
    }
  })
}

module.exports.logQueued = function (newMessageUid) {
  request('http://logger:8084/queued/' + newMessageUid + '/' + Date.now(), (err, res, body) => {
    if (err) {
      return console.log(err)
    }
  })
}
