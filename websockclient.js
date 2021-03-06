const WebSocket = require('ws')
const winston = require('winston')
require('isomorphic-fetch')
const config = require('./config')
const slackPost = require('./slack')(config.slackUrl)
var ws
const logging = new (winston.Logger)({
	  transports: [
		      new (winston.transports.Console)({timestamp: true})
		    ]
})


const close = (url) => {
  return () => {
    logging.log('info', 'WebSocket Closed')
    tryreconnect(url)
  }
}

const errorfunc = (url) => {
  return (error) => {
    logging.log('error', 'WebSocket Issue', error)
    tryreconnect(url)
  }
}

const incomming = (message) => {
  var obj = JSON.parse(message)
  logging.log('info', 'WebSocket Receive Message: ', obj)
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
  }).catch((err) => {
    slackPost.SlackPost(err).catch((error) => {
      log.error('Data Add error', error)
    })
  })
}

const heartbeat = () => {
  logging.log('info', 'Heartbeat');
}

const reconnect = (url) => {
  return () => {
    logging.log('info', 'Connect to Websocket')
    try {
      ws = new WebSocket(url) // 'ws://home.hartcode.com:8844'
      ws.on('message', incomming)
      ws.on('close', close(url))
      ws.on('error', errorfunc(url))
      ws.on('ping', heartbeat)
    } catch (error) {
      logging.log('error', 'WebSocket Connection Error: ', error)
      tryreconnect(url)
      logging.log('error', 'WebSocket Connection Error: ', ws)
    }
  }
}

const tryreconnect = (url) => {
  setTimeout(reconnect(url), 30000) // 30 seconds
}

fetch(config.hubUrl + '/services/list').then((response) => {
  if (response.status >= 400) {
    throw new Error('Bad response from server at ' + config.hubUrl + '/services/list')
  }
  return response.json()
}).then((services) => {
  services.forEach((element) => {
    logging.log('info', 'Found Service', element)
    if (element.type === 'ws') {
      logging.log('info', 'Connecting To Service', element)
      reconnect(element.url)()
    }
  })
}).catch((err) => {
  slackPost.SlackPost(err).catch((error) => {
     log.error('Service List error', error)
  })
})
