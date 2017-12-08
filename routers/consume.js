var express = require('express')
var globals = require('../include/globals.js')
var logger = require('../include/logger.js')
var rabbit = require('../include/rabbit.js')
var router = express.Router()

router.get('/consume/:systemId', function (req, res) {
  globals.systemCollection.findOne({ systemId: req.params.systemId, publishToken: req.token }, function (err, result) {
    if (err) {
      console.log(err)
      res.status(500).json({ error: err.message })
    }
    if (result) {
      rabbit.getMessage(req.params.systemId + '.outgoing', function (err, msg) {
        if (err) {
          console.log(err)
          res.status(500).json({ error: err.message })
        } else {
          if (msg) {
            console.log({ message: 'Message consumed ' + msg.properties.messageId })
            globals.redisClient.multi()
              .hset(msg.properties.messageId, 'message', msg.content.toString())
              .hset(msg.properties.messageId, 'correlationId', msg.properties.correlationId)
              .hset(msg.properties.messageId, 'queue', req.params.systemId + '.outgoing')
              .hset(msg.properties.messageId, 'consumeTime', Date.now())
              .hset(msg.properties.messageId + '_clone', 'message', msg.content.toString())
              .hset(msg.properties.messageId + '_clone', 'queue', req.params.systemId + '.outgoing')
              .hset(msg.properties.messageId + '_clone', 'correlationId', msg.properties.correlationId)
              .expire(msg.properties.messageId, process.env.EXPIRE_TIME)
              .exec(function (err, replies) {
                if (err) {
                  res.status(500).json({ error: err.message })
                } else {
                  logger.logDestinationUpdated(msg.properties.correlationId, req.params.systemId, msg.properties.messageId, 'timeConsumed', Date.now())
                  res.setHeader('Message-Id', msg.properties.messageId)
                  res.setHeader('Correlation-Id', msg.properties.correlationId)
                  res.json(JSON.parse(msg.content.toString()))
                }
              })
          } else {
            res.status(404).json({ error: 'No more messages' })
          }
        }
      })
    } else {
      res.status(401).json({ error: 'Wrong token' })
    }
  })
})

module.exports = router
