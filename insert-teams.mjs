#!/usr/bin/env node --experimental-modules
import mongodb from 'mongodb'
import rawTeams from './teams.json'

// TODO: Check env variables and print error when not provided
const HOST = process.env.HOST || '127.0.0.1'
const PORT = process.env.PORT || '27017'
const DB = process.env.DB || 'world-cup-2018'
const COLLECTION = process.env.COLLECTION || 'teams'

mongodb.MongoClient.connect(`mongodb://${HOST}:${PORT}/${DB}`).then(database => {
  const db = database.db(DB)
  console.log(`You're connected to: mongodb://${HOST}:${PORT}/${DB}\n`)

  console.log(`Inserting teams into ${COLLECTION}...\n`)
  db.collection(COLLECTION).insertMany(rawTeams, (err, doc) => {
    console.log(`Insertion complete!\n
    Number of teams inserted: ${doc.insertedCount}
    `)
    // Unique IDs: ${Object.values(doc.insertedIds)}
    console.log(`Closing the connection, goodbye! 👋`)
    database.close()
  })
})
