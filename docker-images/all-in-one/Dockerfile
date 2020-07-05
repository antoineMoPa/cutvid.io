# antoinemopa/cutvid.io
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

# This is a symlink to the project root
ADD . /cutvid.io
WORKDIR /cutvid.io
RUN git clean -f

COPY docker-images/all-in-one/docker-settings.json /cutvid.io/services/lattefx/settings.json

WORKDIR /cutvid.io/services/auth

RUN bundle install
RUN rake db:create
RUN rails db:migrate && \
	rails db:seed

WORKDIR /cutvid.io/services/renderer
RUN npm install

WORKDIR /cutvid.io/services/cloud

RUN pip3 install -r requirements.txt

WORKDIR /cutvid.io/services/lattefx

RUN python3 build.py

WORKDIR /cutvid.io

# Not guaranteed to work forever
RUN mkdir services/lattefx/libs/ffmpeg.js; \
          cd services/lattefx/libs/ffmpeg.js; \
          FFMPEG_DIST_URL=https://cutvid.io/app/libs/ffmpeg.js/; \
          FILES="ffmpeg-mp4.js ffmpeg-mp4.wasm ffmpeg-webm.js ffmpeg-webm.wasm ffmpeg-worker-mp4.js ffmpeg-worker-mp4.wasm ffmpeg-worker-webm.js ffmpeg-worker-webm.wasm"; \
          for i in $FILES; do wget $FFMPEG_DIST_URL/$i; done

ENTRYPOINT bash dev-server.sh && /bin/bash
