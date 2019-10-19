from flask import Flask, request, send_file
import os
import re
import json
import subprocess
import datetime
import glob
import shutil

app = Flask(__name__)

settings = json.load(open('../lattefx/settings.json'))

def mark_cache(vidid):
    """ hit the cache so a video is not deleted now """

    vidid = re.sub(r"[^0-9a-zA-Z]", "", vidid)
    timestamp = datetime.datetime.now().timestamp()
    folder = "/tmp/lattefx-cache-" + vidid

    if os.path.exists(folder):
        with open(folder + "/cache.time", "w") as cache_time_file:
          cache_time_file.write(str(timestamp))
          cache_time_file.close()


def clean_old_cache():
    """ call this to delete old files in cache """

    folders = glob.glob("/tmp/lattefx-cache-*")

    now = datetime.datetime.now()
    limit = now - datetime.timedelta(hours=1)

    for folder in folders:
        with open(folder + "/cache.time", "r") as cache_time_file:
            timestamp = cache_time_file.read()
            cache_time_file.close()
            date_modified = datetime.datetime.fromtimestamp(float(timestamp))

            if date_modified < limit:
                shutil.rmtree(folder)


@app.after_request
def apply_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = settings['app']
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

@app.route("/has_vid_in_cache/<vidid>")
def has_vid_in_cache(vidid):
    """
    verify if we have a cache folder for this video
    """
    vidid = re.sub(r"[^0-9a-zA-Z]", "", vidid)
    folder = "/tmp/lattefx-cache-" + vidid

    mark_cache(vidid)

    return str(os.path.exists(folder)).lower()


@app.route("/upload_video/<vidid>", methods=['POST'])
def upload_video(vidid):
    """
    This could be optimized by using nginx direct uploading
    """
    vidid = re.sub(r"[^0-9a-zA-Z]", "", vidid)

    if len(vidid) != 40:
        return "error 1 bad token"

    video_file = request.files['video.vid']
    folder = "/tmp/lattefx-cache-" + vidid

    os.makedirs(folder, exist_ok=True)

    video_path = folder + "/video.vid"

    video_file.save(folder + "/video.vid")

    mark_cache(vidid)

    # Poor man's cron: delete old files before
    # Make sure to put somewhere else if you delete this
    clean_old_cache()

    return "success"

@app.route("/get_video_frame/<vidid>/<fps>/<frame_time>")
def get_video_frame(vidid, fps, frame_time):
    """
    Render frames between a certain range at a certain fps
    if not already rendered.

    Then return selected frame

    """
    vidid = re.sub(r"[^0-9a-zA-Z]", "", vidid)

    if len(vidid) != 40:
        return "error 1 bad token"

    # Sorted is used for clamping here
    # I think it is really beautiful
    fps = sorted([0, int(fps), 100])[1]
    frame_time = sorted([0.0, float(frame_time), 1e6])[1]

    folder = "/tmp/lattefx-cache-" + vidid

    if not os.path.exists(folder):
        return "error 2 cache video does not exist"

    video_path = folder + "/video.vid"

    # delete old zip if exists
    if os.path.exists(folder + "/images.zip"):
        os.remove(folder + "/images.zip")

    if not os.path.exists(folder + "/images"):
        os.mkdir(folder + "/images")

    # Convert video
    extract_frames = subprocess.Popen(
        ["ffmpeg", "-i", "video.vid",
         "-nostdin",
         "-y",
         "-r", str(fps),
         "-ss", str(frame_time),
         "-frames:v",  str(30), # limit to 30
         "images/image-%06d.png"
        ], cwd=folder)
    extract_frames.wait()

    return send_file(folder + "/images/image-000001.png")
