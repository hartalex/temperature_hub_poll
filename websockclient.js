const WebSocket = require('ws')
const logging = require('winston')
require('isomorphic-fetch')
const config = require('./config')
const slackPost = require('./slack')(config.slackUrl)
var ws

const close = function () {
  logging.log('info', 'WebSocket Closed')
  tryreconnect()
}

const errorfunc = function (error) {
  logging.log('error', 'WebSocket Issue', error)
  tryreconnect()
}

const incomming = function (message) {
  var obj = JSON.parse(message)
  logging.log('debug', 'WebSocket Receive Message: ', obj)
  const time = new Date()
  const timestring = time.toISOString()
  obj.utc_timestamp = timestring
  fetch(config.hubUrl + '/data/add', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(obj)
  }).catch(function (err) {
    slackPost.SlackPost(err).catch(function (error) {
      console.log(error)
    })
  })
}

const reconnect = () => {
  logging.log('info', 'Connect to Websocket')
  try {
    ws = new WebSocket('ws://home.hartcode.com:8844')
    ws.on('message', incomming)
    ws.on('close', close)
    ws.on('error', errorfunc)
  } catch (error) {
    logging.log('error', 'WebSocket Connection Error: ', error)
    tryreconnect()
    logging.log('error', 'WebSocket Connection Error: ', ws)
  }
}

const tryreconnect = () => {
  setTimeout(reconnect, 30000) // 30 seconds
}

reconnect()
