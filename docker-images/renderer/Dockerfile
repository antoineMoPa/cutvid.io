# antoinemopa/lattefx-renderer
#
# VERSION               0.1

FROM buildpack-deps:buster

RUN apt-get update
RUN apt-get install -y git ffmpeg mediainfo

# Install node
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install -y nodejs

# Install headless-gl
RUN apt-get install -y xvfb build-essential libxi-dev libglu1-mesa-dev libglew-dev pkg-config
RUN git clone https://github.com/stackgl/headless-gl.git /root/bin/headless-gl
WORKDIR /root/bin/headless-gl
RUN git submodule init
RUN git submodule update

RUN git clone https://gitlab.com/antoineMoPa/lattefx.git /lattefx && \
	cd /lattefx && \
	git checkout 3f2d77179e000d8d9950512854eb21cf20b7d5c1

WORKDIR /lattefx/services/renderer
RUN npm install

WORKDIR /project

ENTRYPOINT xvfb-run node /lattefx/services/renderer/render.js lattefx_file.lattefx
