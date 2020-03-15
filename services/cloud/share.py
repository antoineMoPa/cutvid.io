from flask import Blueprint

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
from base64 import b64decode

from utils import *

share = Blueprint('share', __name__)

@share.route("/share/<user_id>/<shared_video_id>", methods=['GET', 'OPTIONS'])
def get_shared_video(user_id, shared_video_id):
    """
    Read a shared_video
    """
    if request.method == 'OPTIONS':
        return ""

    shared_video_id = str(shared_video_id)
    user_id = int(user_id)

    user_folder = USERS_FOLDER + "user-" + str(user_id) + "/"
    shared_video_folder = user_folder + "shared_video-" + shared_video_id + "/"
    shared_video_file_path = shared_video_folder + "video.video"

    if not os.path.exists(shared_video_file_path):
        return "error 8 no shared_video file found"

    return send_file(shared_video_file_path)

@share.route("/upload_shared_video/", methods=['POST', 'OPTIONS'])
def upload_shared_video():
    """
    This could be optimized by using nginx direct uploading
    """

    if request.method == 'OPTIONS':
        return ""

    token = read_token(request.headers['Authorization'].replace("Bearer ", ""))

    if token is None:
        return json.dumps({"success": False, "message": "error 1 bad token"})

    shared_video_file = request.files['video.video']
    shared_video_id = id_generator(20)
    user_id = int(token['user_id'])

    user_folder = USERS_FOLDER + "user-" + str(user_id) + "/"
    os.makedirs(user_folder, exist_ok=True)

    shared_video_folder = user_folder + "shared_video-" + str(shared_video_id) + "/"
    os.makedirs(shared_video_folder, exist_ok=True)

    shared_video_file_path = shared_video_folder + "video.video"
    shared_video_file.save(shared_video_file_path)

    return json.dumps({"success":True,"video_id": shared_video_id, "user_id": user_id})
