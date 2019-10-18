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
    limit = datetime.timedelta(minutes=1)

    for folder in folders:
        with open(folder + "/cache.time", "r") as cache_time_file:
            timestamp = cache_time_file.read()
            cache_time_file.close()
            date_modified = datetime.datetime.fromtimestamp(float(timestamp))

            if date_modified < limit:
                shutil.rmtree(folder)
                print("remove this print if it works deleted video folder " + folder)


@app.after_request
def apply_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = settings['app']
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
    clean_old_cache()

    return "success"

@app.route("/get_video_frames/<vidid>/<fps>/<fromtime>/<totime>")
def get_video_frames(vidid, fps, fromtime, totime):
    """
    Get frames between a certain range at a certain fps

    Uses current version of video (vidid)

    This could be optimized by using nginx direct uploading
    """
    vidid = re.sub(r"[^0-9a-zA-Z]", "", vidid)

    if len(vidid) != 40:
        return "error 1 bad token"

    # Sorted is used for clamping here
    # I think it is really beautiful
    fps = sorted([0, int(fps), 100])[1]
    fromtime = sorted([0, float(fromtime), 1e6])[1]
    totime = sorted([0, float(totime), 1e6])[1]

    folder = "/tmp/lattefx-cache-" + vidid

    if not os.path.exists(folder):
        return "error 2 cache video does not exist"

    video_path = folder + "/video.vid"

    # delete old zip if exists
    if os.path.exists(folder + "/images.zip"):
        os.remove(folder + "/images.zip")

    # Lets make the "/images folder work as a mutex
    if os.path.exists(folder + "/images"):
        return "error 3 another request already working on that same file"

    os.mkdir(folder + "/images")

    # Convert video
    extract_frames = subprocess.Popen(
        ["ffmpeg", "-i", "video.vid",
         "-nostdin",
         "-y",
         "-r", str(fps),
         "-ss", str(fromtime),
         "-to", str(totime),
         "images/image-%06d.png"
        ], cwd=folder)
    extract_frames.wait()

    # Make a zip
    make_zip = subprocess.Popen([
        "zip",
        "-Z", "store", # no compression as png is already compressed
        "-r", "images.zip",
        "images"
    ], cwd=folder)
    make_zip.wait()

    # Delete folder
    shutil.rmtree(folder + "/images")

    return send_file(folder + "/images.zip")
