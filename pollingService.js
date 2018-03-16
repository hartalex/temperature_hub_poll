require('es6-promise').polyfill()
require('isomorphic-fetch')
const logging = require('winston')

const config = require('./config')
const slackPost = require('./slack')(config.slackUrl)
const isArray = (value) => {
  return value && typeof value === 'object' && value.constructor === Array
}

module.exports = function pollForData () {
  const time = new Date()
  const timestring = time.toISOString()
  logging.log('info', 'polling for temperatures')
  try {
    fetch(config.hubUrl + '/services/list').then(function (response) {
      if (response.status >= 400) {
        throw new Error('Bad response from server at ' + config.hubUrl + '/services/list')
      }
      return response.json()
    }).then(function (services) {
      services.forEach(function (element) {
        logging.log('info', 'found service', element)
        if (element.type !== 'ws') {
          logging.log('info', 'checking service', element)
          fetch(element.url).then(function (response) {
            if (response.status >= 400) {
              throw new Error('Bad response from server at ' + element.url)
            }
            return response.json()
          }).then(function (sensorData) {
            logging.log('info', 'received sensorData', sensorData)
            if (isArray(sensorData)) {
              sensorData.forEach(function (sensor) {
                sensor.utc_timestamp = timestring
                fetch(config.hubUrl + '/data/add', {
                  method: 'POST',
                  headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(sensor)
                }).catch(function (err) {
                  logging.log('error', 'error calling /data/add', err)
                  slackPost.SlackPost(err).catch(function (error) {
                    logging.log('error', 'error calling slack', error)
                  })
                })
              })
            } else {
              logging.log('error', 'Services array not found')
              slackPost.SlackPost('array data not found').catch(function (error) {
                logging.log('error', 'error calling slack', error)
              })
            }
          }).catch(function (err) {
            logging.log('error', 'error handling sensor data', err)
            slackPost.SlackPost(err).catch(function (error) {
              logging.log('error', 'error calling slack', error)
            })
          })
        }
      })
    }).catch(function (err) {
      logging.log('error', 'error getting sensor data', err)
      slackPost.SlackPost(err).catch(function (error) {
        logging.log('error', 'error calling slack', error)
      })
    })
  } catch (e) {
    logging.log('error', 'caught unknown error', e)
  }
}
