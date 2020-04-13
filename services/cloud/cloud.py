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
import zmq

from utils import *

from renders import renders
from projects import projects
from share import share
from media import media

app = Flask(__name__)

app.register_blueprint(projects)
app.register_blueprint(media)
app.register_blueprint(renders)
app.register_blueprint(share)

settings = json.load(open('../lattefx/settings.json'))

TMP_FOLDER=os.path.expanduser("~/tmp/")

if not os.path.exists(TMP_FOLDER):
    os.mkdir(TMP_FOLDER)

USERS_FOLDER=os.path.expanduser("~/lattefx-users/")

if not os.path.exists(USERS_FOLDER):
    os.mkdir(USERS_FOLDER)


render_queue = None

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

    if token['premium_tier'] == 1:
        available_storage = 1.024 * 1e9

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

@app.after_request
def apply_cors_headers(response):
    app_domain = settings['app'].replace("/app/","")

    response.headers['Access-Control-Allow-Origin'] = app_domain
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, DELETE'
    response.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Encoding'
    return response

@app.route("/")
def slash():
    """
    api home
    useful to test that the api is up
    """
    return "lattefx cloud home"

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
    vidid = validate_and_sanitize_id(vidid)

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

def make_audio_media(vidid):
    """
    Exctracts audio for a given media
    """

    video_files = glob.glob(TMP_FOLDER + "/lattefx-cache-" + vidid + "/video.*")

    if len(video_files) == 0:
        return None

    folder = os.path.dirname(video_files[0])

    render_audio = subprocess.Popen([
        "cpulimit", "-l", "85", # Leave some cpu time for web server
        "ffmpeg", "-i", video_files[0],
        "-nostdin",
        "-y",
        "-vn",
        "-acodec", "copy",
        folder + "/audio.mp4"
    ], cwd=folder)
    render_audio.wait()

    return folder + "/audio.mp4"

@app.route("/render_video/", methods=['POST', 'OPTIONS'])
def render_video():
    """
    Render a video

    Put audio at places indicated by sequence.lattefx

    returns generated video id
    """

    if request.method == 'OPTIONS':
        return ""

    token = read_token(request.headers['Authorization'].replace("Bearer ", ""))

    if token is None:
        return json.dumps({"status": "error","error": "Bad authentication token"})

    project_file = request.form['lattefx_file.lattefx']
    render_id = id_generator()
    user_id = int(token['user_id'])
    cost = int(request.form['cost'])

    if consume_render_credits(user_id, cost) is False:
        return json.dumps({"status": "error","error": "No credits left"})

    user_folder = USERS_FOLDER + "user-" + str(user_id) + "/"
    render_folder = user_folder + "render-" + render_id + "/"
    project_file_path = render_folder + "lattefx_file.lattefx"

    os.makedirs(user_folder, exist_ok=True)
    os.makedirs(render_folder, exist_ok=True)

    with open(project_file_path, "w") as f:
        f.write(project_file)

    extract_media(render_folder)

    with open(project_file_path, "r") as f:
        project_file = json.loads(f.read())

    project_id = project_file["project_id"]
    project_name = ""

    if project_id is not None:
        project_id = int(project_id)
        copy_medias(user_id, project_id, render_folder + "media/")

        project_folder = user_folder + "project-" + str(project_id) + "/"
        project_meta_path = project_folder + "lattefx_project.meta"

        if os.path.exists(project_meta_path):
            with open(project_meta_path, "r") as f:
                project_meta = json.loads(f.read())
                project_name = project_meta["name"]

    render_meta_path = render_folder + "lattefx_render.meta"

    # Create render meta for new renders
    render_meta = json.dumps({
        "name": project_name,
        "status": "in queue"
    })

    with open(render_meta_path, "w") as f:
        f.write(render_meta)

    auth_port = settings['auth_port']
    auth_url = "http://127.0.0.1:" + str(auth_port)

    if settings["variant_name"] == "prod":
        auth_url += "/auth/"
    elif settings["variant_name"] == "next":
        auth_url += "/auth-next/"

    notify_url = auth_url + "notify_render/" + str(user_id) + "/" + render_id

    command = [
        "node", os.getcwd() + "/../renderer/render.js",
        "lattefx_file.lattefx",
        notify_url
    ]

    message = json.dumps({
        "command": command,
        "render_folder": render_folder
    })

    render_queue.send_string(message)

    return json.dumps({"status": "ok", "render_id": render_id})

def start_zmq_server():
    global render_queue

    context = zmq.Context()
    render_queue = context.socket(zmq.PUB)

    if settings["variant_name"] == "prod":
        ipc_channel = "ipc:///tmp/render_queue"
    elif settings["variant_name"] == "next":
        ipc_channel = "ipc:///tmp/render_queue_next"

    # When we go distributed, we can change this to tcp
    # and diligently authenticate our clients/servers
    # for the moment, we use ipc (inter-process comm.)
    render_queue.bind(ipc_channel)

start_zmq_server()
