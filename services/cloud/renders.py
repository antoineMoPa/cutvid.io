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

settings = json.load(open('../lattefx/settings.json'))

@renders.after_request
def apply_cors_headers(response):
    app_domain = settings['app'].replace("/app/","")

    response.headers['Access-Control-Allow-Origin'] = app_domain
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Methods'] = 'POST, DELETE'
    response.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Encoding'
    return response

def delete_old_renders():
    """

    This takes care of deleting old renders for every users

    """
    render_folders = glob.glob(USERS_FOLDER + "/*/render-*/")

    keep_for_seconds = 3600 * 24 * 3.5 # Keep for 3 days with
                                       # half a day grace period

    for render_folder in render_folders:
        stat = os.stat(render_folder)
        diff = time.time() - stat.st_mtime

        if diff > keep_for_seconds:
            shutil.rmtree(render_folder)


@renders.route("/list_renders", methods=['GET', 'OPTIONS'])
def list_renders():
    """
    List a user's renders
    """

    if request.method == 'OPTIONS':
        return ""

    # Poor man's cron to delete old renders
    delete_old_renders()

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

@renders.route("/render/<render_id>/<token>", methods=['GET', 'OPTIONS'])
def get_render(render_id, token):
    """
    Read a render
    """

    if request.method == 'OPTIONS':
        return ""

    token = read_token(token)

    if token is None:
        return "error 1 bad token"

    render_id = validate_and_sanitize_id(render_id)
    user_id = int(token['user_id'])

    user_folder = USERS_FOLDER + "user-" + str(user_id) + "/"
    render_folder = user_folder + "render-" + str(render_id) + "/"
    render_file_path = render_folder + "video.mp4"

    return send_file(render_file_path, as_attachment=True)

@renders.route("/delete_render/<render_id>/<token>", methods=['DELETE', 'OPTIONS'])
def delete_render(render_id, token):
    """
    Delete a render
    """

    if request.method == 'OPTIONS':
        return ""

    token = read_token(token)

    if token is None:
        return "error 1 bad token"

    render_id = validate_and_sanitize_id(render_id)
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

@renders.route("/complete_purchase/<render_id>/<order_id>", methods=['GET'])
def complete_purchase(render_id, order_id):

    token = read_token(request.headers['Authorization'].replace("Bearer ", ""))

    if token is None:
        return "error 1 bad token"

    render_id = validate_and_sanitize_id(render_id)
    user_id = int(token['user_id'])

    user_folder = USERS_FOLDER + "user-" + str(user_id) + "/"
    render_folder = user_folder + "render-" + str(render_id) + "/"
    render_meta_file = render_folder + "lattefx_render.meta"

    if not os.path.exists(render_meta_file):
        return "error 8 no render meta file found"

    if not validate_order(order_id):
        return "error 9 payment validation failed"

    render_meta = {}

    with open(render_meta_file, "r") as f:
        render_meta = json.loads(f.read())
        f.close()

    render_meta["status"] = "purchased"

    with open(render_meta_file, "w") as f:
        f.write(json.dumps(render_meta))

    return "success"
