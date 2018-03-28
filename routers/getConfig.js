var express = require('express')
var globals = require('../include/globals.js')
var router = express.Router()

router.get('/config/:systemId', function (req, res) {
  globals.systemCollection.findOne({ systemId: req.params.systemId, publishToken: req.token }, function (err, result) {
    if (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
    if (result) {
      var response = []
      result.objectTypes.forEach(function (objectType, i, arr) {
        response.push(objectType.objectId)
      })
      res.json(response)
    } else {
      res.status(401).json({ error: 'Wrong token' })
    }
  })
})

module.exports = router
