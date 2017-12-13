var globals = require('../include/globals.js')
var actOnRabbit = require('./actOnRabbit.js')

module.exports = function (exchange, routingKey, content, messageId, callback) {
  actOnRabbit(function () {
    globals.pubChannel.assertExchange(exchange, 'topic')
    globals.pubChannel.assertQueue(exchange)
    globals.pubChannel.bindQueue(exchange, exchange, '#', {},
      function (err, ok) {
        if (err !== null) {
          console.error('[AMQP] publish', err)
        } else {
          globals.pubChannel.publish(exchange, routingKey, Buffer.from(content), { persistent: true, correlationId: messageId },
                          function (err, ok) {
                            if (err !== null) {
                              console.error('[AMQP] publish', err)
                            } else {
                              callback()
                            }
                          })
        }
      })
  }, callback)
}
