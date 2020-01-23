# Lattefx Server-Side Renderer

Dependencies include:

 - FFMPEG
 - node
 - headless-gl

# Building:

    docker build -t lattefx-renderer .

# Rendering a project

    docker run -it -v /path/to/project:/project lattefx-renderer