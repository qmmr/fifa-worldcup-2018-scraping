const getLineupForTeam = async (page, side) => {
  const lineupSelector = `.fi-players__onpitch--${side} > ul li .fi-p`
  const subsSelector = `.fi-players__onpitch--${side} > .fi-players__substitutes ul li .fi-p`
  const coachSelector = `.fi-match__lineups .fi-players__onpitch--${side} .fi-players__coaches .fi-p`
  const teamSelector = `.fi-match__lineups .fi-players__onpitch--${side}`

  const lineup = await page.evaluate(selector => {
    const nodes = Array.from(document.querySelectorAll(selector))

    return nodes.map(node => ({
      ...node.dataset,
      photoURL: node.querySelector('.fi-p__photo img').getAttribute('src'),
      jerseyNum: node.querySelector('.fi-p__jerseyNum span').textContent,
      playerURL:
        'https://www.fifa.com/worldcup/matches' + node.querySelector('.fi-p__info .fi-p__n a').getAttribute('href'),
    }))
  }, lineupSelector)

  const substitutes = await page.evaluate(selector => {
    const nodes = Array.from(document.querySelectorAll(selector))

    return nodes.map(node => ({
      ...node.dataset,
      photoURL: node.querySelector('.fi-p__photo img').getAttribute('src'),
      jerseyNum: node.querySelector('.fi-p__jerseyNum span').textContent,
      playerURL:
        'https://www.fifa.com/worldcup/matches' + node.querySelector('.fi-p__info .fi-p__n a').getAttribute('href'),
    }))
  }, subsSelector)

  const coach = await page.evaluate(selector => {
    const coachNode = document.querySelector(selector)

    return {
      name: coachNode.querySelector('.fi-p__info .fi-p__n a').getAttribute('title'),
      photo: coachNode.querySelector('.fi-p__photo img').getAttribute('src'),
      personalURL:
        'https://www.fifa.com/worldcup/matches' +
        coachNode.querySelector('.fi-p__info .fi-p__n a').getAttribute('href'),
    }
  }, coachSelector)

  const teamData = await page.evaluate(selector => {
    const teamNode = document.querySelector(selector)

    return {
      teamId: teamNode.querySelector(`.fi-players__teamname .fi-t`).dataset.teamId,
      name: teamNode.querySelector(`.fi-players__teamname .fi-t .fi-t__nText`).textContent.trim(),
      shortName: teamNode.querySelector(`.fi-players__teamname .fi-t .fi-t__nTri`).textContent.trim(),
      flag: teamNode.querySelector(`.fi-players__teamname img`).getAttribute('src'),
    }
  }, teamSelector)

  return {
    lineup,
    substitutes,
    coach,
    ...teamData,
  }
}

export default getLineupForTeam
