# FIFA Worldcup 2018 data scraping

### Requirements:
- node.js >= 10.0
- mongodb database

### Usage:
- clone the [git@github.com:qmmr/fifa-worldcup-2018-scraping.git](git@github.com:qmmr/fifa-worldcup-2018-scraping.git)
- `cd fifa-worldcup-2018-scraping`
- `.env` file to set env variables needed to connect to your chosen MongoDB server -> [dotenv](https://www.npmjs.com/package/dotenv)
- make the files executable `chmod u+x ./insert-teams.mjs ./insert-games.mjs ./update-teams.mjs`
- run the commands in this order:
  1. `node -r esm insert-teams.js`
  1. `node -r esm insert-games.js`
  1. `node -r esm update-teams.js`
  1. `node -r esm insert-lineups.js`
  1. `node -r esm insert-groups.js`

1. Insert teams populates your DB with teams data from `teams.json`.
1. Insert games scrapes the [https://www.fifa.com/worldcup/matches/](https://www.fifa.com/worldcup/matches/) and populates your DB with games data.
1. Update teams associates the games with teams (in order to fetch teams games).
1. Insert lineups scrapes the match lineups from fifa.com/worldcup/matches/match ([example match](https://www.fifa.com/worldcup/matches/match/300331503/#match-lineups))
1. Insert groups insert information about groups and results of games

Have fun! 👋
