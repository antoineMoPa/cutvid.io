#!/bin/bash

docker stop cutvid.io
docker stop proxy

docker rm cutvid.io
docker rm proxy
