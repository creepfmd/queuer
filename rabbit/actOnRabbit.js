var globals = require('../include/globals.js')

module.exports = function (callbackSuccess, callbackError) {
  try {
    if (!globals.pubChannel) {
      globals.amqpConn.createConfirmChannel(function (err, ch) {
        if (err) {
          console.error('[AMQP]', err.message)
          return setTimeout(globals.startFunction, 500)
        }
        ch.on('error', function (err) {
          console.error('[AMQP] channel error', err.message)
        })
        ch.on('close', function () {
          console.log('[AMQP] channel closed')
          globals.pubChannel = null
          return setTimeout(globals.startFunction, 500)
        })
        globals.pubChannel = ch
        callbackSuccess()
      })
    } else {
      callbackSuccess()
    }
  } catch (e) {
    console.error('[AMQP] ', e.message)
    callbackError()
  }
}
