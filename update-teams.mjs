#!/usr/bin/env node --experimental-modules
// @flow
import mongodb from 'mongodb'
// TODO: flow-typed
// import type { database } from 'mongodb'

// const URL = process.env.URL || 'https://www.fifa.com/worldcup/matches/'
const HOST = process.env.HOST || '127.0.0.1'
const PORT = process.env.PORT || '27017'
const DB = process.env.DB || 'world-cup-2018'

mongodb.MongoClient.connect(`mongodb://${HOST}:${PORT}/${DB}`).then(async database => {
  const db = database.db(DB)
  console.log(`You're connected to: mongodb://${HOST}:${PORT}/${DB}\n`)
  const query = {}

  // TODO: Update games collection with new data that is linked to new teams
  const games = await db
    .collection('games')
    .find({})
    .toArray()
  const gamePromises = games.map(async (game, idx) => {
    console.log(`game#: ${++idx}:
    _id: ${game._id}
    homeTeam: ${game.homeTeam}
    awayTeam: ${game.awayTeam}
    `)
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const homeTeam = await db
            .collection('teams')
            .findOneAndUpdate({ _id: mongodb.ObjectID(game.homeTeam) }, { $addToSet: { games: game._id } })
          const awayTeam = await db
            .collection('teams')
            .findOneAndUpdate({ _id: mongodb.ObjectID(game.awayTeam) }, { $addToSet: { games: game._id } })
          console.log('homeTeam', homeTeam.shortName, homeTeam.games)
          console.log('awayTeam', awayTeam.shortName, awayTeam.games)
          resolve(game)
        } catch (error) {
          reject(error)
        }
      }, 10)
    })
  })
  const updateGames = await Promise.all(gamePromises)
  // console.log(updateGames)
  console.log(`Closing the connection, goodbye! 👋`)
  database.close()
})
