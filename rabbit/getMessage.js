var globals = require('../include/globals.js')
var actOnRabbit = require('./actOnRabbit.js')

module.exports = function (queue, callback) {
  actOnRabbit(function () {
    globals.pubChannel.get(queue, {noAck: true}, callback)
  }, callback)
}
