#! /usr/bin/env node
import express from 'express'
// const express = require('express')

const PORT = process.env.PORT || 8888

const app = express()

app.get('/', (req, res) => {
  res.send('Hello world!')
})

const server = app.listen(PORT, () => {
  console.log(`server is listening on localhost:${server.address().port}...`)
})
