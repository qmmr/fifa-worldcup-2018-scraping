#!/usr/bin/env node --experimental-modules
import dotenv from 'dotenv'
import mongodb from 'mongodb'
import rawTeams from './teams.json'

dotenv.config()

// TODO: Check env variables and print error when not provided
const DB_USER = process.env.DB_USER || 'admin'
const DB_PASSWORD = process.env.DB_PASSWORD || 'password'
const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = process.env.DB_PORT || '27017'
const DB_NAME = process.env.DB_NAME || 'fifa-worldcup-2018'

// INFO: mongodb://<dbuser>:<dbpassword>@ds131601.mlab.com:31601/fifa-worldcup-2018
mongodb.MongoClient.connect(`mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`).then(database => {
  const db = database.db(DB_NAME)
  console.log(`You're connected to: mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}\n`)

  console.log(`Inserting teams into db.teams collection...\n`)
  db.collection('teams').insertMany(rawTeams, (err, doc) => {
    console.log(`Insertion complete!\n
    Number of teams inserted: ${doc.insertedCount}
    `)
    // Unique IDs: ${Object.values(doc.insertedIds)}
    console.log(`Closing the connection, goodbye! 👋`)
    database.close()
  })
})
