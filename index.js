const MongoClient = require('mongodb').MongoClient
const request = require('request')
const cheerio = require('cheerio')

// emoji: { type: String, required: false },
// emojiString: { type: String, required: false },
// fifaCode: { type: String, required: false },
// flag: { type: String, required: false },
// iso2: { type: String, required: false },
// name: { type: String, required: false },
const URL = process.env.URL || 'https://www.fifa.com/worldcup/matches/'
const HOST = process.env.HOST || '127.0.0.1'
const PORT = process.env.PORT || '27017'
const DB = process.env.DB || 'world-cup-2018'
const COLLECTION = process.env.COLLECTION || 'games'

const findMatches = matches => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log('resolving...')
      resolve(matches)
    }, 1000)
  })
}

const asyncRequest = (url, options) =>
  new Promise((resolve, reject) => {
    request(url, (err, response, html) => {
      if (!err && response.statusCode === 200) {
        resolve({ response, html })
      } else {
        reject(err)
      }
    })
  })

const createMatchData = ($match, teams) => {
  const matchURI = $match.attr('href')
  const $status = $match.find('.fi-mu__status .fi-s__status .post_match')
  const status = $status.text().trim()
  const finished = !$status.hasClass('hidden')
  const $homeTeam = $match.find('.fi-mu__m .home')
  const $awayTeam = $match.find('.fi-mu__m .away')
  const homeTeamISO2 = $homeTeam.find('.fi-t__nTri').text()
  const awayTeamISO2 = $awayTeam.find('.fi-t__nTri').text()
  const teamHomeId = $homeTeam.data('team-id')
  const awayTeamId = $awayTeam.data('team-id')
  // {
  // 	name: $homeTeam.find('.fi-t__nText').text(),
  // 	iso2: $homeTeam.find('.fi-t__nTri').text(),
  // 	image: $homeTeam.find('img').attr('src'),
  // }
  // {
  // 	name: $awayTeam.find('.fi-t__nText').text(),
  // 	iso2: $awayTeam.find('.fi-t__nTri').text(),
  // 	image: $awayTeam.find('img').attr('src'),
  // }

  // Find teams from DB teams
  const homeTeam = teams.filter(team => team.fifaCode === homeTeamISO2)[0]
  const awayTeam = teams.filter(team => team.fifaCode === awayTeamISO2)[0]
  const matchData = {
    status,
    matchURI,
    finished,
    _typeName: 'Game', // GraphQL type
    datetime: $match.find('.fi-mu__info__datetime').data('utcdate'),
    matchURI: $match.attr('href'),
    stadium: $match.find('.fi__info__stadium').text(),
    venue: $match.find('.fi__info__venue').text(),
    homeTeam,
    score: $match
      .find('.fi-s__score .fi-s__scoreText')
      .text()
      .trim(),
    awayTeam,
  }

  return matchData
}

MongoClient.connect(`mongodb://${HOST}:${PORT}/${DB}`).then(database => {
  const db = database.db(DB)
  console.log(`You're connected to: mongodb://${HOST}:${PORT}/${DB}\n`)
  const matches = []
  let teams = []

  // fetch teams from DB
  db.collection('teams')
    .find({})
    .toArray(async (err, docs) => {
      teams = [...docs]
      console.log(`Found ${teams.length} teams\n`)

      try {
        const { response, html } = await asyncRequest(URL)
        const $ = cheerio.load(html)
        $('.fi-mu__link').each((idx, match) => {
          const matchData = createMatchData($(match), teams)
          if (matchData.finished) {
            console.log(`${++idx}. ${matchData.homeTeam.name} ${matchData.score} ${matchData.awayTeam.name}`)
            matches.push(matchData)
          }
        })

        // After parsing all games from html we can insert them to the DB
        if (matches.length) {
          console.log(`Found ${matches.length} matches, inserting into DB...\n`)
          db.collection(COLLECTION).insertMany(matches, (err, doc) => {
            if (err) throw err
            console.log(`Successfully inserted ${doc.insertedCount} documents 👍`)
          })
        }
      } catch (error) {
        console.error(error)
      } finally {
        console.info('\nClosing connection to the DB\nBye!\n')
        database.close()
      }
    })
})
