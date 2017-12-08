var express = require('express')
var globals = require('./include/globals.js')
var publishRouter = require('./routers/publish.js')
var consumeRouter = require('./routers/consume.js')
var ackRouter = require('./routers/ack.js')
var nackRouter = require('./routers/nack.js')
const bearerToken = require('express-bearer-token')
var mongoose = require('mongoose')
var amqp = require('amqplib/callback_api')
var getRawBody = require('raw-body')
var redis = require('redis')

var app = express()

app.use(bearerToken())
app.use(function (req, res, next) {
  getRawBody(req, {
    length: req.headers['content-length'],
    limit: '1mb',
    encoding: 'utf-8'
  }, function (err, string) {
    if (err) return next(err)
    req.text = string
    next()
  })
})

app.get('/', function (req, res) {
  res.json({ status: 'OK' })
})

app.use(publishRouter)
app.use(consumeRouter)
app.use(ackRouter)
app.use(nackRouter)

globals.startFunction = function () {
  globals.amqpConn = null
  globals.pubChannel = null
  globals.redisClient = null

  amqp.connect(process.env.AMQP_URL + '?heartbeat=60', function (err, conn) {
    if (err) {
      console.error('[AMQP]', err.message)
      return setTimeout(globals.startFunction, 500)
    }
    conn.on('error', function (err) {
      if (err.message !== 'Connection closing') {
        console.error('[AMQP] conn error', err.message)
        console.log(err)
      }
    })
    conn.on('close', function () {
      console.error('[AMQP] reconnecting')
      return setTimeout(globals.startFunction, 500)
    })
    console.log('[AMQP] connected')
    globals.amqpConn = conn
    globals.redisClient = redis.createClient('redis://redis')
    globals.redisClient.on('error', function (err) {
      console.log('[REDIS] ' + err)
    })

    mongoose.connect('mongodb://mongo:27017/local', function (err) {
      if (err) {
        console.error('[mongo]', err.message)
      }

      globals.systemCollection = mongoose.connection.db.collection('systems')
    })
    if (globals.server == null) {
      globals.server = app.listen(80, function () {
        console.log('queuer listening on port 80!')
      })
    }
  })
}

globals.startFunction()
