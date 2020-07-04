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

# Dependencies

Some dependencies are not included within the repo and must be installed with your package manager :

    ruby
    python3
    avconv/ffmpeg
    mediainfo
    rbenv ruby-build
    node
    npm

ffmpeg.js is too large to include in the repo and my build is quite experimental. You can try getting it straight from the server:

    mkdir services/lattefx/libs/ffmpeg.js
    cd services/lattefx/libs/ffmpeg.js
    FFMPEG_DIST_URL=https://cutvid.io/app/libs/ffmpeg.js/
    FILES="ffmpeg-mp4.js ffmpeg-mp4.wasm ffmpeg-webm.js ffmpeg-webm.wasm ffmpeg-worker-mp4.js ffmpeg-worker-mp4.wasm ffmpeg-worker-webm.js ffmpeg-worker-webm.wasm"
    for i in $FILES; do echo wget $FFMPEG_DIST_URL/$i; done
   
# Dev Dependencies

```
pip3 install watchdog
```

