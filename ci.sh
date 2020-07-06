#!/bin/bash

cd services

#
#                             Unit tests
#


# Rails auth
cd auth
bundle exec rails test
cd ..

# JS renderer
cd renderer
npm run test
cd ..

# Python cloud
cd cloud/test
python3 -m pytest
cd ../..

cd .. # Back to project root

#
#                             Integration tests
#

# Run cutvid.io
./start.sh

cd services/cypress-qa
npm install
node_modules/.bin/cypress run
cd ../..

./stop.sh
