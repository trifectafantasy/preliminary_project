# preliminary_project
Uses node to webscrape, python to process, and mongodb as database.

To install:
+ sudo apt install git
+ git clone https://github.com/trifectafantasy/preliminary_project.git
+ sudo apt install nodejs-legacy
+ sudo apt install npm
+ install mongodb following: https://docs.mongodb.com/v2.6/tutorial/install-mongodb-on-ubuntu/
  - sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
  - echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list
  - sudo apt-get update
  - sudo apt-get install -y mongodb-org
  - (sudo mkdir /data/db?)
+ npm install
+ sudo npm install -g nodemon
+ sudo apt install python-pip
+ python -m pip install pymongo

To dump and restore mongodb espn database following: https://docs.mongodb.com/manual/tutorial/backup-and-restore-tools/
  with mongod instance running...
  - to restore: mongorestore /path/to/directory/of/dumped/backup/data
  - to dump: mongodump --out /path/to/directory/where/to/dump
  
To run:
In different terminal windows in preliminary_project directory:
+ mongod
+ nodemon server.js
