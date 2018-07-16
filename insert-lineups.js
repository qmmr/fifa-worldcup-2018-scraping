import puppeteer from 'puppeteer'
import { connect } from './db'
import getLineup from './get-lineup'
;(async () => {
  const { db, disconnect } = await connect()
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  // Fetch games from DB
  const games = await db
    .collection('games')
    .find()
    .toArray()

  for (let game of games) {
    console.log('game.matchURL', `${game.matchURL}#match-lineups`)
    await page.goto(`${game.matchURL}#match-lineups`)

    // Wait for selector to appear on the page
    await page.waitForSelector('.fi-players__onpitch--home > ul li .fi-p')
    // Extract the results from the page...
    const homeTeamLineup = await getLineup(page, 'home')
    const awayTeamLineup = await getLineup(page, 'away')

    console.log(`\nLineups for match:\n${URL}\n
    ${homeTeamLineup.name} vs. ${awayTeamLineup.name}
    `)
  }

  disconnect()
  await browser.close()
})()
