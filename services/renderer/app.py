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

app = Flask(__name__)

settings = json.load(open('../lattefx/settings.json'))

TMP_FOLDER=os.path.expanduser("~/tmp/")

if not os.path.exists(TMP_FOLDER):
    os.mkdir(TMP_FOLDER)

USERS_FOLDER=os.path.expanduser("~/lattefx-users/")

if not os.path.exists(USERS_FOLDER):
    os.mkdir(USERS_FOLDER)

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

    folder = TMP_FOLDER + "/lattefx-cache-" + vidid

    if os.path.exists(folder):
        with open(folder + "/cache.time", "w") as cache_time_file:
          cache_time_file.write(str(timestamp))
          cache_time_file.close()


def read_token(token):
    """ Validate a jwt token with auth """

    request = requests.get(url=settings['auth'] + "/validate_jwt_token", params={
        "token": token
    });

    if request.text == "true":
        # Verification is done in auth
        return jwt.decode(token, verify=False, algorithms=['HS256'])
    else:
        return None

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

    # Thanks stack overflow:
    # https://stackoverflow.com/questions/1392413/
    root_directory = Path(user_folder)

    bytecount = sum(f.stat().st_size for f in root_directory.glob('**/*') if f.is_file())

    available_storage = 1e8

    response = {
        "bytes": bytecount,
        "available": available_storage,
        "used_percent": float(bytecount)/available_storage*100.0
    }

    return json.dumps(response)

@app.route("/list_projects", methods=['GET', 'OPTIONS'])
def list_projects():
    """
    List a user's projects
    """

    if request.method == 'OPTIONS':
        return ""

    token = read_token(request.headers['Authorization'].replace("Bearer ", ""))

    if token is None:
        return "error 1 bad token"

    user_id = int(token['user_id'])

    project_meta_files = glob.glob(USERS_FOLDER + "user-" + str(user_id) + "/project-*/lattefx_project.meta")

    project_metas = []

    for project_meta_file in project_meta_files:
        # Extract project id
        project_id = int(project_meta_file.split("/")[-2].split("-")[1])

        with open(project_meta_file, "r") as f:
            project_meta = json.loads(f.read())
            project_meta["id"] = project_id
            project_metas.append(project_meta)

    return json.dumps(project_metas)

@app.route("/delete_project/<project_id>", methods=['DELETE', 'OPTIONS'])
def delete_project(project_id):
    """
    Delete a project
    """

    if request.method == 'OPTIONS':
        return ""

    token = read_token(request.headers['Authorization'].replace("Bearer ", ""))

    if token is None:
        return "error 1 bad token"

    project_id = int(project_id)
    user_id = int(token['user_id'])

    user_folder = USERS_FOLDER + "user-" + str(user_id) + "/"
    project_folder = user_folder + "project-" + str(project_id) + "/"

    if not os.path.exists(project_folder):
        return "error 8 no project folder found"

    try:
        shutil.rmtree(project_folder)
    except:
        return "error removing project " + str(project_id) + " of user " + str(user_id)

    return "success"


@app.route("/rename_project/<project_id>", methods=['POST', 'OPTIONS'])
def rename_project(project_id):
    """
    Rename a project

    """

    if request.method == 'OPTIONS':
        return ""

    token = read_token(request.headers['Authorization'].replace("Bearer ", ""))

    if token is None:
        return "error 1 bad token"

    project_id = int(project_id)
    user_id = int(token['user_id'])
    new_name = request.form['name']

    user_folder = USERS_FOLDER + "user-" + str(user_id) + "/"
    project_folder = user_folder + "project-" + str(project_id) + "/"

    project_meta_path = project_folder + "lattefx_project.meta"

    if not os.path.exists(project_meta_path):
        return "error 7 no project meta found"

    project_meta = None

    with open(project_meta_path, "r") as f:
        project_meta = json.loads(f.read())

    project_meta['name'] = new_name

    print(new_name)

    with open(project_meta_path, "w") as f:
        f.write(json.dumps(project_meta))

    return "success"


@app.route("/upload_project/<project_id>", methods=['POST', 'OPTIONS'])
def upload_project(project_id):
    """
    This could be optimized by using nginx direct uploading
    """

    if request.method == 'OPTIONS':
        return ""

    token = read_token(request.headers['Authorization'].replace("Bearer ", ""))

    if token is None:
        return "error 1 bad token"

    project_file = request.form['lattefx_file.lattefx']
    project_id = int(project_id)
    user_id = int(token['user_id'])

    user_folder = USERS_FOLDER + "user-" + str(user_id) + "/"
    os.makedirs(user_folder, exist_ok=True)

    project_folder = user_folder + "project-" + str(project_id) + "/"
    os.makedirs(project_folder, exist_ok=True)

    project_meta = json.dumps({"name": "Untitled Project"})

    project_file_path = project_folder + "lattefx_file.lattefx"
    project_meta_path = project_folder + "lattefx_project.meta"

    with open(project_file_path, "w") as f:
        f.write(project_file)

    with open(project_meta_path, "w") as f:
        f.write(project_meta)

    return "success"

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

        if not os.path.exists(media_file):
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
