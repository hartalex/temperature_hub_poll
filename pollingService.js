require('es6-promise').polyfill()
require('isomorphic-fetch')

var config = require('./config')

function pollForData () {
  const time = new Date()
  const timestring = time.toISOString()
  console.log('polling for temperatures')
  fetch(config.hubUrl + '/services/list').then(function (response) {
    if (response.status >= 400) {
      throw new Error('Bad response from server')
    }
    return response.json()
  }).then(function (services) {
    services.forEach(function (element) {
      fetch(element.url).then(function (response) {
        if (response.status >= 400) {
          throw new Error('Bad response from server')
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
          })
        })
      }).catch(function (err) {
        console.log(err)
      })
    })
  }).catch(function (err) {
    console.log(err)
  })
}

pollForData()
