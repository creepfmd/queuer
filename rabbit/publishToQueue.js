var globals = require('../include/globals.js')
var actOnRabbit = require('./actOnRabbit.js')

module.exports = function (queue, content, messageId, correlationId, callback) {
  actOnRabbit(function () {
    globals.pubChannel.sendToQueue(queue, Buffer.from(content), { persistent: true, messageId: messageId, correlationId: correlationId },
                      function (err, ok) {
                        if (err !== null) {
                          console.error('[AMQP] publish', err)
                        } else {
                          callback()
                        }
                      })
  }, callback)
}
