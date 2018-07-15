import puppeteer from 'puppeteer'
import getLineupForTeam from './getLineupForTeam'

const URL = `https://www.fifa.com/worldcup/matches/match/300331537/#match-lineups`
;(async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  await page.goto(URL)

  // Wait for selector to appear on the page
  await page.waitForSelector('.fi-players__onpitch--home > ul li .fi-p')

  // Extract the results from the page...
  const homeTeamLineup = await getLineupForTeam(page, 'home')
  const awayTeamLineup = await getLineupForTeam(page, 'away')

  console.log(`\nLineups for match:\n${URL}\n
${homeTeamLineup.name} vs. ${awayTeamLineup.name}
	`)

  await browser.close()
})()
