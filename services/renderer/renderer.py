from flask import Flask, request, send_file
from pathlib import Path
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
import requests
import jwt
from utils import *

from projects import projects

app = Flask(__name__)

app.register_blueprint(projects)

settings = json.load(open('../lattefx/settings.json'))

TMP_FOLDER=os.path.expanduser("~/tmp/")

if not os.path.exists(TMP_FOLDER):
    os.mkdir(TMP_FOLDER)

USERS_FOLDER=os.path.expanduser("~/lattefx-users/")

if not os.path.exists(USERS_FOLDER):
    os.mkdir(USERS_FOLDER)


@app.route("/get_storage_info", methods=['GET', 'OPTIONS'])
def get_storage_info():
    """
    Get quota and used storage info
    """

    if request.method == 'OPTIONS':
        return ""

    token = read_token(request.headers['Authorization'].replace("Bearer ", ""))

    if token is None:
        return "error 1 bad token"

    user_id = int(token['user_id'])

    user_folder = USERS_FOLDER + "user-" + str(user_id) + "/"

    bytecount = folder_size(user_folder)

    available_storage = 100 * 1e6

    response = {
        "used_bytes": bytecount,
        "available_bytes": available_storage,
        "used_percent": float(bytecount)/available_storage*100.0
    }

    return json.dumps(response)

@app.route("/get_a_new_project_id", methods=['GET', 'OPTIONS'])
def get_a_new_project_id():
    """
    Get a project id that has not been used yet
    """

    if request.method == 'OPTIONS':
        return ""

    token = read_token(request.headers['Authorization'].replace("Bearer ", ""))

    if token is None:
        return "error 1 bad token"

    user_id = int(token['user_id'])

    user_folder = USERS_FOLDER + "user-" + str(user_id) + "/"
    project_meta_files = glob.glob(user_folder + "/project-*/lattefx_project.meta")

    project_metas = []

    id_getter = project_meta_path_to_project_id

    ids = [id_getter(f) for f in project_meta_files]

    if len(ids) == 0:
        return str(1)
    else:
        return str(sorted(ids)[-1] + 1)


def clean_old_cache():
    """ call this to delete old files in cache """

    folders = glob.glob(TMP_FOLDER + "/lattefx-cache-*")

    now = datetime.datetime.now()
    limit = now - datetime.timedelta(hours=1)

    for folder in folders:
        with open(folder + "/cache.time", "r") as cache_time_file:
            timestamp = cache_time_file.read()
            cache_time_file.close()
            date_modified = datetime.datetime.fromtimestamp(float(timestamp))

            if date_modified < limit:
                shutil.rmtree(folder)

def validate_and_sanitize_vidid(vidid):
    vidid = re.sub(r"[^0-9a-zA-Z]", "", vidid)

    if len(vidid) != 40:
        return None

    return vidid

@app.after_request
def apply_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = settings['app']
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Methods'] = 'POST, DELETE'
    response.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Encoding'
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
    folder = TMP_FOLDER + "/lattefx-cache-" + vidid

    mark_cache(vidid)

    return str(os.path.exists(folder)).lower()

@app.route("/upload_video/<vidid>", methods=['POST'])
def upload_video(vidid):
    """
    This could be optimized by using nginx direct uploading
    """
    vidid = validate_and_sanitize_vidid(vidid)

    if vidid is None:
        return "error 1 bad id"

    video_file = request.files['video.vid']
    folder = TMP_FOLDER + "/lattefx-cache-" + vidid

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
    vidid = validate_and_sanitize_vidid(vidid)

    if vidid is None:
        return "error 1 bad id"

    frame = int(frame)

    image_file = request.files['frame.png']
    folder = TMP_FOLDER + "/lattefx-cache-" + vidid

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
    vidid = validate_and_sanitize_vidid(vidid)

    if vidid is None:
        return "error 1 bad id"

    # Sorted is used for clamping here
    # I think it is really beautiful
    fps = sorted([0, int(fps), 100])[1]
    frame_time = sorted([0.0, float(frame_time), 1e6])[1]

    folder = TMP_FOLDER + "/lattefx-cache-" + vidid

    if not os.path.exists(folder):
        return "error 2 cache video does not exist"

    video_path = folder + "/video.vid"

    frame_num = int(frame_time * fps + 1)

    file_path = folder + "/images/image-%06d.png" % frame_num

    if not os.path.exists(file_path):
        os.makedirs(folder + "/images", exist_ok=True)
        # Convert video
        extract_frames = subprocess.Popen(
            ["ffmpeg",
             "-ss", str(frame_time),
             "-i", "video.vid",
             "-nostdin",
             "-y",
             "-start_number", str(frame_num), # Start at this frame
             "-frames:v", "30", # No more than 30 frames per GET
             "-r", str(fps),
             "-compression_level", str(100),
             "images/image-%06d.png"
            ], cwd=folder)
        extract_frames.wait()


    if os.path.exists(file_path):
        return send_file(file_path)

    if not os.path.exists(folder + "/images/image-000001.png"):
        return "error 6 no frames found"

    return send_file(folder + "/images/image-000001.png")

def make_audio_media(vidid):
    """
    Exctracts audio for a given media
    """

    video_files = glob.glob(TMP_FOLDER + "/lattefx-cache-" + vidid + "/video.*")

    if len(video_files) == 0:
        return None

    folder = os.path.dirname(video_files[0])

    render_audio = subprocess.Popen(
        ["ffmpeg", "-i", video_files[0],
         "-nostdin",
         "-y",
         "-vn",
         "-acodec", "copy",
         folder + "/audio.mp4"
    ], cwd=folder)
    render_audio.wait()

    return folder + "/audio.mp4"

@app.route("/render_video/<vidid>/<fps>", methods=['POST'])
def render_video(vidid, fps):
    """
    Render a video from the frames we have

    Put audio at places indicated by sequence.lattefx

    returns generated video id
    """
    vidid = validate_and_sanitize_vidid(vidid)

    if vidid is None:
        return "error 1 bad id"

    fps = sorted([0, int(fps), 100])[1]

    audio_sequences = request.form['audio-sequences']
    folder = TMP_FOLDER + "/lattefx-cache-" + vidid

    audio_sequences = json.loads(audio_sequences)

    audio_args = []
    audio_map_args = []

    audio_index = 1

    for sequence in audio_sequences:
        time_from = float(sequence['from'])
        time_to = float(sequence['to'])
        trim_before = float(sequence['trimBefore'])
        file_digest = validate_and_sanitize_vidid(sequence['digest'])

        if time_from < 0:
            # Trim part before 0
            trim_before -= time_from
            time_to -= time_from
            time_from = 0

        if time_from > time_to:
            return "error 4 incoherent sequence timing"

        if file_digest is None:
            return "error 5 bad id in sub sequence"

        media_file = make_audio_media(file_digest)

        if media_file is None or not os.path.exists(media_file):
            # Some files do not have audio
            continue

        audio_args += [
            "-ss", str(trim_before),
            "-itsoffset", str(time_from),
            "-t", str(time_to),
            "-i", media_file
        ]
        audio_map_args += ["-map", str(audio_index)]
        audio_index += 1


    os.makedirs(folder, exist_ok=True)

    mark_cache(vidid)

    # Poor man's cron: delete old files before
    # Make sure to put somewhere else if you delete this
    clean_old_cache()

    vid_format = "avi"

    command_line = ["ffmpeg",
            "-r", str(fps),
            "-i", "image-%06d.png"] + audio_args + [
            "-nostdin",
            "-y",
            "-r", str(fps),
            "-vb", "20M", # HQ
            "-map", "0"
        ] + audio_map_args + [
            "video." + vid_format
        ]

    # Pro tip: debug command line with:
    # print(" ".join(command_line))

    render_vid = subprocess.Popen(
        command_line,
        cwd=folder)
    render_vid.wait()

    downloadable_id = id_generator()
    downloadable_folder = TMP_FOLDER + "/lattefx-cache-" + downloadable_id
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
    vidid = validate_and_sanitize_vidid(vidid)

    if vidid is None:
        return "error 1 bad id"

    folder = TMP_FOLDER + "/lattefx-cache-" + vidid

    if not os.path.exists(folder):
        # prevent ddos
        time.sleep(1.0)
        return "error 3 no file for this id"

    vid_format = "avi"
    filename = "lattefx-hq-video." + vid_format

    return send_file(folder + "/" + filename)


@app.route("/rendered_video_preview/<vidid>", methods=['GET'])
def rendered_video_preview(vidid):
    """
    Get a rendered video preview from cache
    """
    vidid = validate_and_sanitize_vidid(vidid)

    if vidid is None:
        return "error 1 bad id"

    folder = TMP_FOLDER + "/lattefx-cache-" + vidid

    if not os.path.exists(folder):
        # prevent ddos
        time.sleep(1.0)
        return "error 3 no file for this id"

    vid_format = "avi"
    filename = "lattefx-hq-video." + vid_format

    # Create ogv preview, because it works in most places
    render_preview = subprocess.Popen([
        "ffmpeg", "-t", "5",
        "-nostdin",
        "-y",
        "-i", filename,
        "-vb", "10M",
        "preview.ogv"
    ], cwd=folder)
    render_preview.wait()

    return send_file(folder + "/preview.ogv")
