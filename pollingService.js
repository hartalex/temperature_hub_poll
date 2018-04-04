require('isomorphic-fetch')
const winston = require('winston')
const fetchTimeoutMs = 15000

const logging = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({timestamp: true})
  ]
})

const config = require('./config')
const slackPost = require('./slack')(config.slackUrl)
const isArray = (value) => {
  return value && typeof value === 'object' && value.constructor === Array
}

const handleFetchError = (url) => {
  return (response) => {
    if (!response.ok) {
      throw new Error('Bad response from server at ' + url)
    }
    return response.json()
  }
}

const logError = (message, err) => {
  logging.log('error', message, err)
  slackPost.SlackPost(err, message).catch(function (error) {
    logging.log('error', 'error calling slack', error)
  })
}

const logErrorString = (message) => {
  logging.log('error', message)
  slackPost.SlackPost(message).catch(function (error) {
    logging.log('error', 'error calling slack', error)
  })
}

const processSensorData = (timestring) => {
  return (sensor) => {
    sensor.utc_timestamp = timestring
    fetch(config.hubUrl + '/data/add', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: fetchTimeoutMs,
      body: JSON.stringify(sensor)
    })
      .then(() => logging.log('info', 'saved sensor data', sensor))
      .catch(function (err) {
        logError('error calling /data/add', err)
      })
  }
}

const processService = (timestring) => {
  return (service) => {
    logging.log('info', 'start processing service', service)
    fetch(service.url, {timeout: fetchTimeoutMs})
      .then(handleFetchError(service.url))
      .then(function (sensorData) {
        logging.log('info', 'received sensorData', sensorData)
        if (isArray(sensorData)) {
          sensorData.forEach(processSensorData(timestring))
        } else {
          logErrorString('Sensor data array not found')
        }
      })
      .catch(function (err) {
        logError('error handling sensor data', err)
      })
    logging.log('info', 'finish processing service', service)
  }
}

module.exports = function pollForData () {
  const time = new Date()
  const timestring = time.toISOString()
  logging.log('info', 'polling for temperatures')
  try {
    const serviceUrl = config.hubUrl + '/services/list'
    fetch(serviceUrl, {timeout: fetchTimeoutMs})
      .then(handleFetchError(serviceUrl))
      .then(function (services) {
        if (isArray(services)) {
          logging.log('info', 'found services', services)
          services.forEach(processService(timestring))
        } else {
          logErrorString('Services data array not found')
        }
      })
      .catch(function (err) {
        logError('error getting sensor data', err)
      })
  } catch (e) {
    logError('caught unknown error', e)
  }
  logging.log('info', 'Finished Polling')
}
