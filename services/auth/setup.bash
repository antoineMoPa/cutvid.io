#!/bin/bash

# Run as root

apt-get install ruby-dev
apt-get install nodejs
gem install bundler

echo "CREATE USER 'auth_development'@'localhost' IDENTIFIED BY 'auth_dev_password';" |  mysql;
echo "GRANT ALL PRIVILEGES ON auth_development.* TO 'auth_development'@'localhost';" |  mysql;
echo "GRANT ALL PRIVILEGES ON auth_test.* TO 'auth_development'@'localhost';" |  mysql;

bundle exec rake db:create
bundle exec rake db:migrate
bundle exec rails server


