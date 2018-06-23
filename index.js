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

const asyncRequest = (url, options, ...args) =>
  new Promise((resolve, reject) => {
    request(url, (err, response, html) => {
      if (!err && response.statusCode === 200) {
        resolve({ response, html })
      } else {
        reject(err)
      }
    })
  })

const createMatchData = $match => {
  const matchURI = $match.attr('href')
  const $status = $match.find('.fi-mu__status .fi-s__status .post_match')
  const status = $status.text().trim()
  const finished = !$status.hasClass('hidden')
  const $teamHome = $match.find('.fi-mu__m .home')
  const teamHomeId = $teamHome.data('team-id')
  const $teamAway = $match.find('.fi-mu__m .away')
  const awayTeamId = $teamAway.data('team-id')
  const matchData = {
    status,
    matchURI,
    finished,
    datetime: $match.find('.fi-mu__info__datetime').data('utcdate'),
    matchURI: $match.attr('href'),
    stadium: $match.find('.fi__info__stadium').text(),
    venue: $match.find('.fi__info__venue').text(),
    homeTeam: {
      name: $teamHome.find('.fi-t__nText').text(),
      iso2: $teamHome.find('.fi-t__nTri').text(),
      image: $teamHome.find('img').attr('src'),
    },
    score: $match
      .find('.fi-s__score .fi-s__scoreText')
      .text()
      .trim(),
    awayTeam: {
      name: $teamAway.find('.fi-t__nText').text(),
      iso2: $teamAway.find('.fi-t__nTri').text(),
      image: $teamAway.find('img').attr('src'),
    },
  }

  return matchData
}

MongoClient.connect(
  `mongodb://${HOST}:${PORT}/${DB}`,
  async (err, database) => {
    if (err) throw err

    const db = database.db(DB)
    console.log(`You're connected to: mongodb://${HOST}:${PORT}/${DB}\n`)
    const matches = []

    try {
      const { response, html } = await asyncRequest(URL)
      const $ = cheerio.load(html)
      $('.fi-mu__link').each((idx, match) => {
        const matchData = createMatchData($(match))
        if (matchData.finished) {
          console.log(`${++idx}. ${matchData.homeTeam.name} ${matchData.score} ${matchData.awayTeam.name}`)
          matches.push(matchData)
        }
      })

      // After parsing all games from html we can insert them to the DB
      if (matches.length) {
        console.log('Found new games, inserting into DB...\n')
        db.collection(COLLECTION).insertMany(matches, (err, doc) => {
          if (err) throw err
          console.log('Successfully inserted: ', JSON.stringify(doc))
        })
      }
    } catch (error) {
      console.error(error)
    } finally {
      console.info('\nClosing connection to the DB\nBye!\n')
      database.close()
    }

    //   console.log('Number of matches: ', matches.length)
    //   const newMatches = await findMatches(matches)
  }
)
