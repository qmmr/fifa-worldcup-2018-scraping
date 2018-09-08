# FIFA Worldcup 2018 data scraping

### Requirements:
- [Node.js >= 10.0](https://nodejs.org/)
- [Docker](https://www.docker.com)

### Usage:
- `git clone git@github.com:qmmr/fifa-worldcup-2018-scraping.git`
- `cd fifa-worldcup-2018-scraping`
- create `.env` file to set env variables needed to connect to your chosen MongoDB server
  - [dotenv](https://www.npmjs.com/package/dotenv)
  - If you want to use your local development server you can use these.
    ```
    DB_USER=admin
    DB_PASSWORD=password
    DB_HOST=127.0.0.1
    DB_PORT=27017
    DB_NAME=fifa-worldcup-2018
    ```
- run `npm run setup`

1. Insert teams populates your DB with teams data from `teams.json`.
1. Insert games scrapes the [https://www.fifa.com/worldcup/matches/](https://www.fifa.com/worldcup/matches/) and populates your DB with games data.
1. Update teams associates the games with teams (in order to fetch teams games).
1. Insert lineups scrapes the match lineups from fifa.com/worldcup/matches/match ([example match](https://www.fifa.com/worldcup/matches/match/300331503/#match-lineups))
1. Insert groups insert information about groups and results of games

Have fun! 👋
