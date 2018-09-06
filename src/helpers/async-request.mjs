#! /usr/bin/env node --experimental-modules
/* eslint-disable */
import request from 'request'

export const asyncRequest = (url, options) =>
  new Promise((resolve, reject) => {
    request(url, (err, response, html) => {
      if (!err && response.statusCode === 200) {
        resolve({ response, html })
      } else {
        reject(err)
      }
    })
  })

export default asyncRequest
