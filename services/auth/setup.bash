#!/bin/bash

su -c 'apt-get install ruby-dev';
su -c 'apt-get install nodejs'
su -c 'gem install bundler';

echo "CREATE USER 'auth_development'@'localhost' IDENTIFIED BY 'auth_dev_password';" |  mariadb;
echo "GRANT ALL PRIVILEGES ON auth_development.* TO 'auth_development'@'localhost';" |  mariadb;
echo "GRANT ALL PRIVILEGES ON auth_test.* TO 'auth_development'@'localhost';" |  mariadb;

bundle exec rake db:create
bundle exec rails server

