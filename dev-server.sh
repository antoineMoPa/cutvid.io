#!/bin/bash

cd services

cd cloud
python3 serve.py &
cd ..

cd auth
bundle exec rails s -p 8000 -b 0.0.0.0 -P /dev/null &
cd ..

cd lattefx
python3 dev-build.py &
cd ..
