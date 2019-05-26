#!/bin/bash

# Run as root

sudo apt-get install ruby-dev nodejs mysql-server mysql-client
sudo gem install bundler

bundle install --path vendor/bundle

echo "CREATE USER 'auth_development'@'localhost' IDENTIFIED BY 'auth_dev_password';" |  sudo mysql;
echo "GRANT ALL PRIVILEGES ON auth_development.* TO 'auth_development'@'localhost';" |  sudo mysql;
echo "GRANT ALL PRIVILEGES ON auth_test.* TO 'auth_development'@'localhost';" |  sudo mysql;

bundle exec rake db:create
bundle exec rake db:migrate

