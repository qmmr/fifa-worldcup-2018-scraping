#! /usr/bin/env node
import request from 'request'
import cheerio from 'cheerio'
import differenceBy from 'lodash/differenceBy'
import asyncRequest from './async-request'
import { connect } from './db'

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
  const matchURL = `http://fifa.com${$match.attr('href')}`
  const matchID = $match.find('.fi-mu.result').data('id')
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
    matchID,
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
;(async () => {
  const { db, disconnect } = await connect()
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
  const URL = 'https://www.fifa.com/worldcup/matches/'
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

  // TODO: Not used right now, but might be needed later to update the teams with players
  // teams.forEach(async (team, idx) => {
  //   console.log(`#${++idx}: ${team.name}`)
  // })

  disconnect()
})()
