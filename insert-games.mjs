#! /usr/bin/env node --experimental-modules
import mongodb from 'mongodb'
import request from 'request'
import cheerio from 'cheerio'
import differenceBy from 'lodash/differenceBy'
import asyncRequest from './async-request'

const URL = process.env.URL || 'https://www.fifa.com/worldcup/matches/#groupphase'
const HOST = process.env.HOST || '127.0.0.1'
const PORT = process.env.PORT || '27017'
const DB = process.env.DB || 'world-cup-2018'

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

mongodb.MongoClient.connect(`mongodb://${HOST}:${PORT}/${DB}`).then(database => {
  const db = database.db(DB)
  console.log(`You're connected to: mongodb://${HOST}:${PORT}/${DB}\n`)
  const matches = []

  // fetch teams from DB
  db.collection('teams')
    .find({})
    .toArray(async (err, teams) => {
      console.log(`Found ${teams.length} teams\n`)

      try {
        const { response, html } = await asyncRequest(URL)
        const $ = cheerio.load(html)
        $('.fi-mu__link').each((idx, match) => {
          const matchData = createMatchData($(match), teams)

          if (matchData.finished) {
            matches.push(matchData)
          }
        })

        // TODO: How to avoid duplicates?
        // After parsing all games from html we can insert them to the DB
        const games = await db
          .collection('games')
          .find({})
          .toArray()
        const newGames = differenceBy(matches, games, 'matchURL')
        if (matches.length && newGames.length) {
          console.log(`Found ${matches.length} matches, inserting into DB...\n`)
          console.log('games already in db', games.length)
          console.log('newGames', newGames.length)
          db.collection('games').insertMany(newGames, (err, docs) => {
            if (err) throw err
            console.log(`Successfully inserted ${docs.insertedCount} documents 👍`)
          })
        } else {
          console.log(`Sorry, no new matches found 😭`)
        }
      } catch (error) {
        console.error(error)
      } finally {
        console.info('\nClosing connection to the DB\nBye! 👋\n')
        database.close()
      }
    })
})
