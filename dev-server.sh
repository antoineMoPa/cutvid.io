#!/bin/bash

cd src
python -m SimpleHTTPServer &
cd ..

cd services

cd converter
./start.bash &
cd ..

cd downloadables
./start.bash &
cd ..

cd auth
bundle exec rails s -p 8003 &
cd ..

