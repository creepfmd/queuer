var getMessage = require('../rabbit/getMessage.js')
var publishToQueue = require('../rabbit/publishToQueue.js')
var publish = require('../rabbit/publish.js')

module.exports.getMessage = getMessage
module.exports.publishToQueue = publishToQueue
module.exports.publish = publish
