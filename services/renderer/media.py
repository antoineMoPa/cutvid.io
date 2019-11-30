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
import io

from utils import *

media = Blueprint('media', __name__)

@media.route("/media/<project_id>", methods=['GET', 'OPTIONS'])
def list_media():
    """
    List a user's project media
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
    project_file_path = project_folder + "lattefx_file.lattefx"

    if not os.path.exists(project_file_path):
        return "error 8 no project file found"

    project_media_files = glob.glob(project_folder + "/media/*")

    return json.dumps(project_media_files)

@media.route("/upload_media/<project_id>", methods=['POST', 'OPTIONS'])
def upload_media(project_id):
    """
    returns media id
    """

    if request.method == 'OPTIONS':
        return ""

    token = read_token(request.headers['Authorization'].replace("Bearer ", ""))

    if token is None:
        return "error 1 bad token"

    project_id = int(project_id)
    user_id = int(token['user_id'])

    user_folder = USERS_FOLDER + "user-" + str(user_id) + "/"
    os.makedirs(user_folder, exist_ok=True)

    project_folder = user_folder + "project-" + str(project_id) + "/"
    os.makedirs(project_folder, exist_ok=True)

    project_media_folder = project_folder + "media/"
    os.makedirs(project_media_folder, exist_ok=True)

    media_name = id_generator()
    media_path = project_media_folder + media_name
    media_file = request.files['media']
    media_file.save(media_path)

    return media_name


@media.route("/media/<project_id>/<media_id>", methods=['GET', 'OPTIONS'])
def get_media(project_id, media_id):
    """
    Read a project's media
    """

    if request.method == 'OPTIONS':
        return ""

    token = read_token(request.headers['Authorization'].replace("Bearer ", ""))

    if token is None:
        return "error 1 bad token"

    project_id = int(project_id)
    user_id = int(token['user_id'])
    media_id = validate_and_sanitize_id(media_id)

    user_folder = USERS_FOLDER + "user-" + str(user_id) + "/"
    project_folder = user_folder + "project-" + str(project_id) + "/"
    media_path = project_folder + "media/"+ media_id

    if not os.path.exists(media_path):
        return "error 8 no media file found"

    with open(media_path, "rb") as f:
        data = io.BytesIO(f.read())
        return send_file(data,
                         attachment_filename="media.media",
                         mimetype="application/octet-stream")
