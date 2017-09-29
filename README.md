# preliminary_project
Uses node to webscrape, python to process, and mongodb as database.

To install:
+ sudo apt install git
+ git clone https://github.com/trifectafantasy/preliminary_project.git
cd to preliminary_project directory...
+ sudo apt install nodejs-legacy
+ sudo apt install npm
+ install mongodb following: https://docs.mongodb.com/v2.6/tutorial/install-mongodb-on-ubuntu/
  - sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
  - echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list
  - sudo apt-get update
  - sudo apt-get install -y mongodb-org
  - sudo mkdir /data
  - sudo mkdir /data/db
  - sudo chown -R \<ubuntu username\> /data/db
+ npm install
+ sudo npm install -g nodemon
+ sudo apt install python-pip
+ python -m pip install pymongo

To dump and restore mongodb espn database following: https://docs.mongodb.com/manual/tutorial/backup-and-restore-tools/
+ mongod
  - to restore: mongorestore /backup_mongo/\<folder where dumped mongodb data is\>
  - to dump: mongodump --out /backup_mongo/\<folder to dump mondogb data\>
  
To run:
In different terminal windows in preliminary_project directory:
+ nohup mongod &
+ nohup nodemon server.js &
+ nohup ngrok http -bind-tls=true -auth="chips:markers" 8081

To open tunnel:
+ sign up for free ngrok account
+ follow instructions at: https://dashboard.ngrok.com/get-started
+ change remote_addr in configuration file to 0.0.0.0:8091
+ access dashboard at AWS hostname port 8091

Start football ahead sport:
+ In routes.js...
  - fooball_ahead = true, football_ahead_current_year to current year and update football_ahead_completed_matchups appropriately

Start new Trifecta Season (after baseball ends, football in season):
+ In routes.js...
  - change current_year1 and current_year2 to correct years
  - set all this_basketball_... and this_baseball_... variables to false and 0
  - set football_ahead = false
  - set this_football_season_stated to true and football_completed_matchups appropriately
+ In mixins.pug...
  - add new sports in mixins.pug, acquisition_home_page.pug, owner_matchup_page_home.pug, stats_home_page.pug

Start new sport:
+ In routes.js...
  - lines 35-71, change this_<sport>_season_started, this_<sport>_in_season (basketball, baseball) to true and reset <sport>_completed_matchups to 0
  - Run add_team_name.py to add team names
  - For team names with a "." in the title, substitute the "." with \\\uff0E

Stop sports:
Stop scraping roto regular season standings (basketball and baseball):
+ In routes.js...
  - this_<sport>_in_season = false

Start scraping playoff results:
+ In routes.js...
  - this_<sport>_completed_season = true

Once all stats have been scraped (roster stats, acquisition stats, origin stats, trade analysis, owner matchups, popular players, football coach)
+ In routes.js...
  - increase completed_<sport>_season to just finished season number (ie NO MORE SCRAPING)

To form draft boards:
+ When just creating list of future round draft picks to trade, no order yet, use: draft_pick_distribution.py
  - When making future round draft pick trades, use: trade_future_draft_picks.py
+ When creating the full draft board with draft order, use: draft_board_creation.py
  - When making set, specific draft pick trades, use: trade_draft_picks.py
  - To display set, specific draft board with order, in routes.js, line 73, set_board_sport = <sport>
