var express = require('express')
var globals = require('../include/globals.js')
var logger = require('../include/logger.js')
var router = express.Router()

router.get('/consume/:systemId', function (req, res) {
  globals.systemCollection.findOne({ systemId: req.params.systemId, publishToken: req.token }, function (err, result) {
    if (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
    if (result) {
      const args1 = [ req.params.systemId + '.outgoing', '-inf', '+inf', 'LIMIT', 0, 1 ]
      const args2 = [ req.params.systemId + '.outgoing', 0, 0 ]
      globals.redisClient.multi()
        .zrangebyscore(args1)
        .zremrangebyrank(args2)
        .exec(function (err, zrangeReplies) {
          if (err) {
            res.status(500).json({ error: err.message })
          } else {
            if (zrangeReplies[0]) {
              if (zrangeReplies[0].length > 0) {
                var newMessageUid = zrangeReplies[0][0]
                globals.redisClient.hgetall(newMessageUid, function (err, reply) {
                  if (err) {
                    console.error('[REDIS client] ' + err)
                  }
                  if (reply) {
                    globals.redisClient.multi()
                      .hmset(newMessageUid + '_clone',
                        'message', reply.message,
                        'correlationId', reply.correlationId,
                        'queue', req.params.systemId + '.outgoing',
                        'publishTime', reply.publishTime)
                      .expire(newMessageUid, process.env.EXPIRE_TIME)
                      .exec(function (err, replies) {
                        if (err) {
                          res.status(500).json({ error: err.message })
                        } else {
                          logger.logDestinationUpdated(reply.correlationId, req.params.systemId, newMessageUid, 'timeConsumed', Date.now())
                          res.setHeader('Message-Id', newMessageUid)
                          res.setHeader('Correlation-Id', reply.correlationId)
                          res.json(JSON.parse(reply.message))
                        }
                      })
                  } else {
                    res.status(500).json({ error: 'Server error' })
                  }
                })
              } else {
                res.status(404).json({ error: 'No more messages' })
              }
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
