#! /usr/bin/env node
import puppeteer from 'puppeteer'
import { connect } from './db'
import getLineup from './get-lineup'

const createGroupData = async (page, tableSelector) => {
  const groupData = await page.evaluate(selector => {
    const nodes = Array.from(document.querySelectorAll(selector))

    return nodes.map(node => ({
      _typeName: 'Group',
      groupID: node.id,
      name: node.querySelector('.fi-table__caption .fi-table__caption__title').textContent,
      columns: Array.from(node.querySelectorAll('thead tr th span abbr')).map(n => ({
        title: n.getAttribute('title'),
        abbr: n.innerHtml,
      })),
      teams: Array.from(node.querySelectorAll('tbody tr'))
        .filter(n => n.dataset.teamId !== undefined)
        .map(n => ({
          teamID: n.dataset.teamId,
          flag: n.querySelector('.fi-t__i img').getAttribute('src'),
          name: n.querySelector('.fi-t__nText').textContent,
          shortName: n.querySelector('.fi-t__nTri').textContent,
          matchPlayed: n.querySelector('.fi-table__matchplayed .text').textContent,
          wins: n.querySelector('.fi-table__win .text').textContent,
          draws: n.querySelector('.fi-table__draw .text').textContent,
          loses: n.querySelector('.fi-table__lost .text').textContent,
          goalFor: n.querySelector('.fi-table__goalfor .text').textContent,
          goalAgainst: n.querySelector('.fi-table__goalagainst .text').textContent,
          diffGoal: n.querySelector('.fi-table__diffgoal .text').textContent,
          points: n.querySelector('.fi-table__pts .text').textContent,
        })),
    }))
  }, tableSelector)

  return groupData
}
;(async () => {
  const { db, disconnect } = await connect()
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  const URL = 'https://www.fifa.com/worldcup/groups/'
  await page.goto(URL)

  // Fetch games from DB
  const games = await db
    .collection('games')
    .find({ stage: 'GROUP_STAGE' })
    .toArray()
  // fetch teams from DB
  const teams = await db
    .collection('teams')
    .find({})
    .toArray()

  // Wait for selector to appear on the page
  const tableSelector = '.fi-standings-list .fi-table'
  await page.waitForSelector(tableSelector)

  // Create groupData from information found in '.fi-standings-list table'
  const groupData = await createGroupData(page, tableSelector)
  // TODO: Add team id to fixtures/team.json
  // TODO: Associate games with teams in groups
  console.log('====================================')
  groupData.forEach(group => {
    // console.log(JSON.stringify(group, null, 2))
  })
  // groupData.forEach(group => console.log(JSON.stringify(group, null, 2)))
  console.log('====================================')

  // FIXME: Prevent inserting duplicates
  // Insert group data
  const groups = await db.collection('groups').insertMany(groupData)
  console.log(`Succuesfully inserted groups 👍`)

  disconnect()
  await browser.close()
})()
