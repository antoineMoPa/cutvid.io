#!/bin/bash

cd services

cd cloud
python3 serve.py &
cd ..

cd auth
bundle exec rails s -p 8000 &
cd ..
