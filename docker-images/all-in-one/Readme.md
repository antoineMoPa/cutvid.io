# All In One

This docker image contains everything you need to get a running dev version of Latteefx:

 - Database (sqlite3)
 - FFMPEG
 - headless-gl
 - python3, rails and dependencies.

This is also a good place to look to understand how to setup an actual Lattefx development computer.

I generally don't recommend trying to code in the docker image as it is generally counter-productive.

# Building:

    docker build -t lattefx-all-in-one .

# Running:

    docker run --network="host" -it lattefx-all-in-one .

You can then visit http://127.0.0.1:8000/app/, make videos, user accounts and renders.