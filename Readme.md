<p align="center">
    <a href="https://cutvid.io"><img width="400px" src="https://cutvid.io/images/logo.svg"/></a>
</p>

# About

cutvid.io is an Open Source video sequencer that runs in your browser.

# Licence

The code is licensed under GNU AGPL V3: https://www.gnu.org/licenses/agpl-3.0.en.html

# Coding Style

From now on:

1. Indent in JS is 2 spaces.
2. Variable & function names are in snake_case.
3. Creating value is more important than arguing about code style.

# Running with Docker:

Clone repo and run this inside repo:

    docker build -t cutvid.io -f docker-images/all-in-one/Dockerfile .
    docker run --network="host" -v $(pwd):/cutvid.io -it cutvid.io

You can then visit http://127.0.0.1:8000/app/, make videos, user accounts and renders.
