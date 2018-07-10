#! /usr/bin/env node
import dotenv from 'dotenv'
import mongodb from 'mongodb'
import request from 'request'
import cheerio from 'cheerio'
import differenceBy from 'lodash/differenceBy'
import asyncRequest from './async-request'

dotenv.config()

// TODO: Check env variables and print error when not provided
const DB_USER = process.env.DB_USER || 'admin'
const DB_PASSWORD = process.env.DB_PASSWORD || 'password'
const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = process.env.DB_PORT || '27017'
const DB_NAME = process.env.DB_NAME || 'fifa-worldcup-2018'
const URL = process.env.URL || 'https://www.fifa.com/worldcup/matches/#groupphase'

const getStage = matchUTCDate => {
  const matchDate = new Date(matchUTCDate)
  const roundOf16Start = new Date('2018-06-30')
  const quaterfinalsStart = new Date('2018-07-06')
  const semifinalsStart = new Date('2018-07-10')
  const thirdPlaceGame = new Date('2018-07-14')
  const finalsGame = new Date('2018-07-15')

  if (matchDate < roundOf16Start) {
    return 'GROUP_STAGE'
  } else if (matchDate < quaterfinalsStart) {
    return 'ROUND_OF_16'
  } else if (matchDate < semifinalsStart) {
    return 'QUATER_FINALS'
  } else if (matchDate < thirdPlaceGame) {
    return 'SEMI_FINALS'
  } else if (matchDate < finalsGame) {
    return 'THIRD_PLACE_MATCH'
  } else {
    return 'FINAL_MATCH'
  }

  return 'GROUP_STAGE'
}

const createMatchData = ($match, teams) => {
  const matchURL = `http://fifa.com/${$match.attr('href')}`
  const $status = $match.find('.fi-mu__status .fi-s__status .post_match')
  const status = $status.text().trim()
  const finished = !$status.hasClass('hidden')
  const $homeTeam = $match.find('.fi-mu__m .home')
  const $awayTeam = $match.find('.fi-mu__m .away')
  const score = $match
    .find('.fi-s__score .fi-s__scoreText')
    .text()
    .trim()
  const overtime = /penalties/.test($match.find('.fi-mu__reasonwin-text') || '')
  const overtimeScore = '' // TODO: Add proper find if there is a match that ends with overtime
  const penalties = /penalties/.test($match.find('.fi-mu__reasonwin-text') || '')
  const penaltiesScore = $match
    .find('.fi-mu__penaltyscore-wrap')
    .text()
    .trim()
  const homeTeamISO2 = $homeTeam.find('.fi-t__nTri').text()
  const awayTeamISO2 = $awayTeam.find('.fi-t__nTri').text()
  // const teamHomeId = $homeTeam.data('team-id') // TODO: Use this to get more info about the team
  // const awayTeamId = $awayTeam.data('team-id')
  // Find teams from DB teams
  const homeTeam = teams.filter(team => team.shortName === homeTeamISO2)[0]
  const awayTeam = teams.filter(team => team.shortName === awayTeamISO2)[0]
  const matchUTCDate = $match.find('.fi-mu__info__datetime').data('utcdate')
  const stage = getStage(matchUTCDate)
  // TODO: Search the match URL and find out players who scored and attach that info somehow 🤔

  return {
    _typeName: 'Game', // GraphQL type
    awayTeam: awayTeam._id,
    datetime: matchUTCDate,
    finished,
    homeTeam: homeTeam._id,
    matchURL,
    overtime,
    overtimeScore,
    penalties,
    penaltiesScore,
    score,
    stadium: $match.find('.fi__info__stadium').text(),
    stage,
    status,
    venue: $match.find('.fi__info__venue').text(),
  }
}

mongodb.MongoClient.connect(`mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`).then(
  async database => {
    const db = database.db(DB_NAME)
    console.log(
      `Connection as user "${DB_USER}" to mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}\n has been established! 🎉\n`
    )
    const matcheDataList = []

    // fetch teams from DB
    const teams = await db
      .collection('teams')
      .find({})
      .toArray()
    // fetch games from DB
    const gamesInDB = await db
      .collection('games')
      .find({})
      .toArray()

    // fetch data from URL and parse it using cheerio
    const { response, html } = await asyncRequest(URL)
    const $ = cheerio.load(html)

    // Create matchData from information found in '.fi-mu__link'
    $('.fi-mu__link').each((idx, match) => {
      const matchData = createMatchData($(match), teams)

      if (matchData.finished) {
        matcheDataList.push(matchData)
      }
    })
    // Find which games are not in DB yet
    const gamesNotInDB = differenceBy(matcheDataList, gamesInDB, 'matchURL')

    // Check if there are new games by comparing the 'matchURL'
    if (matcheDataList.length && gamesNotInDB.length) {
      console.log(`\n
      Number of games in the DB: ${gamesInDB.length}
      Found ${matcheDataList.length} new games, inserting into DB...
    `)

      db.collection('games').insertMany(gamesNotInDB, (err, docs) => {
        if (err) throw err
        console.log(`\nSuccessfully inserted ${docs.insertedCount} documents 👍\n`)
      })
    } else {
      console.log(`\nSorry, no new matches found 😭\n`)
    }

    // FIXME: Currently not possible with this setup, as the additional information is loaded with JS
    // matcheDataList.forEach(collectMatchDetails)

    // TODO: Not used right now, but might be needed later to update the teams with players
    // teams.forEach(async (team, idx) => {
    //   console.log(`#${++idx}: ${team.name}`)
    // })

    console.info('\nClosing connection to the DB\nBye! 👋\n')
    database.close()
  }
)
