require('es6-promise').polyfill()
require('isomorphic-fetch')

const config = require('./config')
const slackPost = require('./slack')(config.slackUrl)

module.exports = function pollForData () {
  const time = new Date()
  const timestring = time.toISOString()
  console.log('polling for temperatures')
  fetch(config.hubUrl + '/services/list').then(function (response) {
    if (response.status >= 400) {
      throw new Error('Bad response from server at ' + config.hubUrl + '/services/list')
    }
    return response.json()
  }).then(function (services) {
    services.forEach(function (element) {
      console.log('found service ' + JSON.stringify(element))
      if (element.type !== 'ws') {
      console.log('checking service ' + JSON.stringify(element))
        fetch(element.url).then(function (response) {
          if (response.status >= 400) {
            throw new Error('Bad response from server at ' + element.url)
          }
          return response.json()
        }).then(function (sensorData) {
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
              slackPost.SlackPost(err).catch(function (error) {
                console.log(error)
              })
            })
          })
        }).catch(function (err) {
          slackPost.SlackPost(err).catch(function (error) {
            console.log(error)
          })
        })
      }
    })
  }).catch(function (err) {
    slackPost.SlackPost(err).catch(function (error) {
      console.log(error)
    })
  })
}
