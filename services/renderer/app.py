from flask import Flask, request, send_file
import os
import re
import json
import subprocess
import datetime
import glob
import shutil
import string
import random
import time

app = Flask(__name__)

settings = json.load(open('../lattefx/settings.json'))

def id_generator(size=40):
    """
    video id generator
    """
    chars = string.ascii_uppercase
    chars += string.ascii_lowercase
    chars += string.digits

    return ''.join(random.choice(chars) for _ in range(size))

def mark_cache(vidid,  keep_delta=None):
    """ hit the cache so a video is not deleted now """

    vidid = re.sub(r"[^0-9a-zA-Z]", "", vidid)

    if keep_delta is None:
        timestamp = datetime.datetime.now().timestamp()
    else:
        timestamp = (datetime.datetime.now() + keep_delta).timestamp()

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

@app.route("/")
def slash():
    """
    api home
    useful to test that the api is up
    """
    return "lattefx renderer home"

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

    video_file.save(video_path)

    mark_cache(vidid)

    # Poor man's cron: delete old files before
    # Make sure to put somewhere else if you delete this
    clean_old_cache()

    return "success"

@app.route("/upload_frame/<vidid>/<frame>", methods=['POST'])
def upload_frame(vidid, frame):
    """
    This could be optimized by using nginx direct uploading
    """

    vidid = re.sub(r"[^0-9a-zA-Z]", "", vidid)

    if len(vidid) != 40:
        return "error 1 bad token"

    frame = int(frame)

    image_file = request.files['frame.png']
    folder = "/tmp/lattefx-cache-" + vidid

    os.makedirs(folder, exist_ok=True)

    image_path = folder + "/image-%06d.png" % frame
    image_file.save(image_path)

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
             "images/image-%06d.png"
            ], cwd=folder)
        extract_frames.wait()

    available_files = sorted([
        int(f[-10:].replace(".png", ""))
        for f in
        glob.glob(folder + "/images/image-*.png")
    ])

    frame_num = int(frame_time * fps + 1)

    # Does the frame exist in folder
    if frame_num not in available_files:
        # Then use last frame
        frame_num = len(available_files) - 1

    return send_file(folder + "/images/image-%06d.png" % frame_num)


@app.route("/render_video/<vidid>/<fps>", methods=['POST'])
def render_video(vidid, fps):
    """
    Render a video from the frames we have

    Put audio at places indicated by sequence.lattefx

    returns generated video id
    """
    vidid = re.sub(r"[^0-9a-zA-Z]", "", vidid)

    if len(vidid) != 40:
        return "error 1 bad token"

    fps = sorted([0, int(fps), 100])[1]

    sequence = request.form['sequence.lattefx']
    folder = "/tmp/lattefx-cache-" + vidid

    with open(folder + "/sequence.lattefx", "w") as file:
        file.write(sequence)

    os.makedirs(folder, exist_ok=True)

    mark_cache(vidid)

    # Poor man's cron: delete old files before
    # Make sure to put somewhere else if you delete this
    clean_old_cache()

    vid_format = "avi"

    render_vid = subprocess.Popen(
        ["ffmpeg", "-i", "image-%06d.png",
         "-nostdin",
         "-y",
         "-r", str(fps),
         "-vb", "20M", # HQ
         "video." + vid_format
    ], cwd=folder)
    render_vid.wait()

    downloadable_id = id_generator()
    downloadable_folder = "/tmp/lattefx-cache-" + downloadable_id
    os.mkdir(downloadable_folder)
    mark_cache(downloadable_id, datetime.timedelta(days=1))

    filename = "lattefx-hq-video." + vid_format
    move_vid = subprocess.Popen(
        ["mv", "video." + vid_format,
         downloadable_folder + "/" + filename
    ], cwd=folder)
    move_vid.wait()

    return downloadable_id

@app.route("/rendered_video/<vidid>/<desired_filename>", methods=['GET'])
def rendered_video(vidid, desired_filename):
    """
    Get a rendered video from cache

    Desired filename is arbitray and not used here
    """
    vidid = re.sub(r"[^0-9a-zA-Z]", "", vidid)

    if len(vidid) != 40:
        return "error 1 bad token"

    folder = "/tmp/lattefx-cache-" + vidid

    if not os.path.exists(folder):
        # prevent ddos
        time.sleep(1.0)
        return "error 3 no file for this id"

    vid_format = "avi"
    filename = "lattefx-hq-video." + vid_format

    return send_file(folder + "/" + filename, as_attachment=True, attachment_filename=filename)
