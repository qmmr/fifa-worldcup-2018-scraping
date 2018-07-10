#!/usr/bin/env node
import dotenv from 'dotenv'
import mongodb from 'mongodb'
// TODO: flow-typed
// import type { database } from 'mongodb'

dotenv.config()

// TODO: Check env variables and print error when not provided
// const URL = process.env.URL || 'https://www.fifa.com/worldcup/matches/'
const DB_USER = process.env.DB_USER || 'admin'
const DB_PASSWORD = process.env.DB_PASSWORD || 'password'
const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = process.env.DB_PORT || '27017'
const DB_NAME = process.env.DB_NAME || 'fifa-worldcup-2018'
mongodb.MongoClient.connect(`mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`).then(
  async database => {
    const db = database.db(DB_NAME)
    console.log(
      `Connection as user "${DB_USER}" to mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}\n has been established! 🎉\n`
    )
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
            console.log(`homeTeam ${homeTeam.value.shortName} played ${homeTeam.value.games.length} games`)
            console.log(`awayTeam ${awayTeam.value.shortName} played ${awayTeam.value.games.length} games`)
            resolve(game)
          } catch (error) {
            reject(error)
          }
        }, 10)
      })
    })
    const updateGames = await Promise.all(gamePromises)
    // console.log(updateGames)
    console.log(`\nClosing the connection, goodbye! 👋`)
    database.close()
  }
)
