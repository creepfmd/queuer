var express = require('express')
var globals = require('../include/globals.js')
var logger = require('../include/logger.js')
var rabbit = require('../include/rabbit.js')
const uuidv4 = require('uuid/v1')
var router = express.Router()

router.post('/publish/:systemId/:key', function (req, res) {
  globals.systemCollection.findOne({ systemId: req.params.systemId, publishToken: req.token }, function (err, result) {
    if (err) {
      res.status(500).json({ error: err.message })
    }
    if (result) {
      const newMessageUid = uuidv4()
      logger.logNewMessage(newMessageUid, req.params.systemId)
      rabbit.publish(req.params.systemId, req.params.key, req.text, newMessageUid, function () {
        logger.logQueued(newMessageUid)
        res.json({ messageId: newMessageUid })
      })
    } else {
      res.status(401).json({ error: 'Wrong token' })
    }
  })
})

module.exports = router
