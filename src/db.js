#! /usr/bin/env node
import dotenv from 'dotenv'
import mongodb from 'mongodb'

dotenv.config()

// TODO: Check env variables and print error when not provided
const DB_USER = process.env.DB_USER || 'admin'
const DB_PASSWORD = process.env.DB_PASSWORD || 'password'
const DB_HOST = process.env.DB_HOST || 'db'
const DB_PORT = process.env.DB_PORT || '27017'
const DB_NAME = process.env.DB_NAME || 'fifa-worldcup-2018'
const URL = process.env.URL || 'https://www.fifa.com/worldcup/matches/#groupphase'

export const connect = async () => {
  try {
    const database = await mongodb.MongoClient.connect(`mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`)
    const db = database.db(DB_NAME)
    console.log(`Connection to mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}\n has been established! 🎉\n`)

    return {
      db,
      disconnect: () => {
        console.info('\nClosing connection to the DB\nBye! 👋\n')
        database.close()
      },
    }
  } catch (error) {
    throw error
  }
}
