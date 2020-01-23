# antoinemopa/lattefx
#
# VERSION               0.1

FROM ruby:2.6

RUN apt-get update
RUN apt-get install -y git python3 python3-pip ffmpeg mediainfo libsqlite3-dev

# Install node
RUN curl -sL https://deb.nodesource.com/setup_11.x | bash -
RUN apt-get install -y nodejs
RUN gem install bundler:2.0.2

# Install headless-gl
RUN apt-get install -y xvfb build-essential libxi-dev libglu1-mesa-dev libglew-dev pkg-config
RUN git clone https://github.com/stackgl/headless-gl.git /root/bin/headless-gl
WORKDIR /root/bin/headless-gl
RUN git submodule init
RUN git submodule update
RUN npm install
RUN npm run rebuild

RUN git clone https://gitlab.com/antoineMoPa/lattefx.git /lattefx && \
	cd /lattefx && \
	git checkout 3f2d77179e000d8d9950512854eb21cf20b7d5c1

COPY docker-settings.json /lattefx/services/lattefx/settings.json

WORKDIR /lattefx/services/auth

RUN bundle install
RUN rake db:create
RUN rails db:migrate && \
	rails db:seed

WORKDIR /lattefx/services/renderer
RUN npm install

WORKDIR /lattefx/services/cloud

RUN pip3 install -r requirements.txt

WORKDIR /lattefx/services/lattefx

RUN python3 build.py

WORKDIR /lattefx

ENTRYPOINT bash dev-server.sh && /bin/bash
