import puppeteer from 'puppeteer'
import { connect } from './db'
import getLineup from './helpers/get-lineup'
;(async () => {
  const { db, disconnect } = await connect()
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  // Fetch games from DB
  const games = await db
    .collection('games')
    .find()
    .toArray()

  // Loop over the games and update it with the scraped lineups
  for (let game of games) {
    await page.goto(`${game.matchURL}#match-lineups`)

    // Wait for selector to appear on the page
    await page.waitForSelector('.fi-players__onpitch--home > ul li .fi-p')
    // Scrape the lineups from the fifa.com page...
    const homeTeamLineup = await getLineup(page, 'home')
    const awayTeamLineup = await getLineup(page, 'away')

    console.log(`
Lineups for match:
${game.matchURL}

---

_id: ${game._id}
homeTeam: ${game.homeTeam}
awayTeam: ${game.awayTeam}
${homeTeamLineup.name} vs. ${awayTeamLineup.name}
`)
    // Update the game
    const updatedGame = await db
      .collection('games')
      .findOneAndUpdate({ _id: game._id }, { $set: { awayTeamLineup, homeTeamLineup } })
    console.log(`Succuesfully updated game: ${updatedGame.value._id} 👍`)
  }

  disconnect()
  await browser.close()
})()
