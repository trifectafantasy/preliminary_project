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
+ mongod
+ nodemon server.js

To open tunnel:
+ sign up for free ngrok account
+ follow instructions at: https://dashboard.ngrok.com/get-started

Add new sport:
+ In routes.js...
  - lines 39-64, change this_(sport)_season_started and this_(sport)_in_season to true
  - Add menu options for new year to view pug files
  - Run add_team_name.py to add team names
  - For team names with a "." in the title, substitute the "." with \\\uff0E
