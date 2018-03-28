var express = require('express')
var globals = require('../include/globals.js')
var logger = require('../include/logger.js')
var router = express.Router()

router.get('/nack/:messageId/:requeue*', function (req, res) {
  globals.redisClient.hgetall(req.params.messageId, function (err, reply) {
    if (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
    if (reply) {
      globals.systemCollection.findOne({ systemId: reply.queue.replace('.outgoing', ''), publishToken: req.token }, function (err, result) {
        if (err) {
          console.error(err)
          res.status(500).json({ error: err.message })
        }
        if (result) {
          globals.redisClient.multi()
            .zadd(reply.queue, (req.params.requeue === 'noblock' ? Date.now() : reply.publishTime), req.params.messageId)
            .exec(function (err, replies) {
              if (err) {
                console.error('[REDIS publish] error ', err)
              } else {
                logger.logDestinationUpdated(reply.correlationId, reply.queue.replace('.outgoing', ''), req.params.messageId)
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
