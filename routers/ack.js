var express = require('express')
var globals = require('../include/globals.js')
var logger = require('../include/logger.js')
var router = express.Router()

router.get('/ack/:messageId', function (req, res) {
  globals.redisClient.hgetall(req.params.messageId, function (err, reply) {
    if (err) {
      console.log(err)
      res.status(500).json({ error: err.message })
    }
    if (reply) {
      globals.systemCollection.findOne({ systemId: reply.queue.replace('.outgoing', ''), publishToken: req.token }, function (err, result) {
        if (err) {
          console.log(err)
          res.status(500).json({ error: err.message })
        }
        if (result) {
          console.log({ message: 'Message acked ' + req.params.messageId })
          globals.redisClient.multi()
            .hdel(req.params.messageId, 'message')
            .hdel(req.params.messageId, 'queue')
            .hdel(req.params.messageId, 'correlationId')
            .hdel(req.params.messageId, 'consumeTime')
            .hdel(req.params.messageId + '_clone', 'message')
            .hdel(req.params.messageId + '_clone', 'queue')
            .hdel(req.params.messageId + '_clone', 'correlationId')
            .exec(function (err, replies) {
              if (err) {
                res.status(500).json({ error: err.message })
              } else {
                logger.logDestinationUpdated(reply.correlationId, reply.queue.replace('.outgoing', ''), req.params.messageId, 'timeAcked', Date.now())
                res.json({ status: 'OK' })
              }
            })
        } else {
          res.status(401).json({ error: 'Wrong token' })
        }
      })
    } else {
      res.status(404).json({ error: 'No such message' })
    }
  })
})

module.exports = router
