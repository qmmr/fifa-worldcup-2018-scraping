#!/usr/bin/env node
import dotenv from 'dotenv'
import mongodb from 'mongodb'
import rawTeams from './fixtures/teams.json'
import { connect } from './db'

dotenv.config()
;(async () => {
  const { db, disconnect } = await connect()
  const teamsCount = await db
    .collection('teams')
    .find({})
    .count()

  if (teamsCount !== 32) {
    console.log(`Inserting teams into db.teams collection...\n`)
    db.collection('teams').insertMany(rawTeams, (err, doc) => {
      console.log(`Insertion complete!\n
			Number of teams inserted: ${doc.insertedCount}
			`)
      disconnect()
    })
  } else {
    console.log(`Found ${teamsCount} teams in the DB, you are all set 👍`)
    disconnect()
  }
})()
