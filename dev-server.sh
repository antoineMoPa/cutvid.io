#!/bin/bash

cd services

cd renderer
python3 serve.py &
cd ..

cd downloadables
./start.bash &
cd ..

cd auth
bundle exec rails s -p 8000 &
cd ..
