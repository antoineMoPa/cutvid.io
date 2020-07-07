#!/bin/bash

echo "Starting servers"

docker run -d --network="host" -v $(pwd):/cutvid.io  --name cutvid.io -t cutvid.io

cd docker-images/nginx/
docker run -d --network="host" -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf --name proxy -t nginx

echo "Servers started. You can now visit http://127.0.0.1:8888"
