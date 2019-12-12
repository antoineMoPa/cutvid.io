#!/bin/bash

cd services

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
