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

renders = Blueprint('renders', __name__)

@renders.route("/list_renders", methods=['GET', 'OPTIONS'])
def list_renders():
    """
    List a user's renders
    """

    if request.method == 'OPTIONS':
        return ""

    token = read_token(request.headers['Authorization'].replace("Bearer ", ""))

    if token is None:
        return "error 1 bad token"

    user_id = int(token['user_id'])

    user_folder = USERS_FOLDER + "user-" + str(user_id) + "/"
    render_meta_files = glob.glob(user_folder + "/render-*/lattefx_render.meta")

    render_meta_files = sorted(render_meta_files, key=os.path.getctime, reverse=True)

    render_metas = []

    for render_meta_file in render_meta_files:
        # Extract render id
        render_id = render_meta_path_to_render_id(render_meta_file)

        with open(render_meta_file, "r") as f:
            render_meta = json.loads(f.read())

        # Populate render info with id and size
        render_meta["id"] = render_id
        render_folder = user_folder + "render-" + str(render_id) + "/"
        render_meta["bytecount"] = folder_size(render_folder)

        render_metas.append(render_meta)

    return json.dumps(render_metas)

@renders.route("/render/<render_id>", methods=['GET', 'OPTIONS'])
def get_render(render_id):
    """
    Read a render
    """

    if request.method == 'OPTIONS':
        return ""

    token = read_token(request.headers['Authorization'].replace("Bearer ", ""))

    if token is None:
        return "error 1 bad token"

    render_id = validate_and_sanitize_id(render_id)
    user_id = int(token['user_id'])

    user_folder = USERS_FOLDER + "user-" + str(user_id) + "/"
    render_folder = user_folder + "render-" + str(render_id) + "/"
    render_file_path = render_folder + "video.avi"

    if not os.path.exists(render_file_path):
        return "error 8 no render file found"

    extract_media(render_folder)

    return send_file(render_file_path)

@renders.route("/delete_render/<render_id>", methods=['DELETE', 'OPTIONS'])
def delete_render(render_id):
    """
    Delete a render
    """

    if request.method == 'OPTIONS':
        return ""

    token = read_token(request.headers['Authorization'].replace("Bearer ", ""))

    if token is None:
        return "error 1 bad token"

    render_id = int(render_id)
    user_id = int(token['user_id'])

    user_folder = USERS_FOLDER + "user-" + str(user_id) + "/"
    render_folder = user_folder + "render-" + str(render_id) + "/"

    if not os.path.exists(render_folder):
        return "error 8 no render folder found"

    try:
        shutil.rmtree(render_folder)
    except:
        return "error removing render " + str(render_id) + " of user " + str(user_id)

    return "success"


@renders.route("/rename_render/<render_id>", methods=['POST', 'OPTIONS'])
def rename_render(render_id):
    """
    Rename a render

    """

    if request.method == 'OPTIONS':
        return ""

    token = read_token(request.headers['Authorization'].replace("Bearer ", ""))

    if token is None:
        return "error 1 bad token"

    render_id = int(render_id)
    user_id = int(token['user_id'])
    new_name = request.form['name']

    user_folder = USERS_FOLDER + "user-" + str(user_id) + "/"
    render_folder = user_folder + "render-" + str(render_id) + "/"

    render_meta_path = render_folder + "lattefx_render.meta"

    if not os.path.exists(render_meta_path):
        return "error 7 no render meta found"

    render_meta = None

    with open(render_meta_path, "r") as f:
        render_meta = json.loads(f.read())

    render_meta['name'] = new_name

    print(new_name)

    with open(render_meta_path, "w") as f:
        f.write(json.dumps(render_meta))

    return "success"
