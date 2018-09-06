#!/usr/bin/env node
import mongodb from 'mongodb'
import { connect } from './db'
;(async () => {
  const { db, disconnect } = await connect()
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

  disconnect()
})()
