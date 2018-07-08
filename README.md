# FIFA Worldcup 2018 data scraping

### Requirements:
- node.js >= 10.0
- mongodb database

### Usage:
- clone the [git@github.com:qmmr/fifa-worldcup-2018-scraping.git](git@github.com:qmmr/fifa-worldcup-2018-scraping.git)
- `cd fifa-worldcup-2018-scraping`
- `.env` file to set env variables needed to connect to your chosen MongoDB server -> [dotenv](https://www.npmjs.com/package/dotenv)
- make the files executable `chmod u+x ./insert-teams.mjs ./insert-games.mjs ./update-teams.mjs`
- run the files in this order:
  1. run it from the terminal `./insert-teams.mjs`
  1. run it from the terminal `./insert-games.mjs`
  1. run it from the terminal `./update-teams.mjs`

Insert teams populates your DB with teams data from `teams.json`.
Insert games scrapes the [https://www.fifa.com/worldcup/matches/](https://www.fifa.com/worldcup/matches/) and populates your DB with games data.
Update teams associates the games with teams (in order to fetch teams games).

Have fun! 👋
