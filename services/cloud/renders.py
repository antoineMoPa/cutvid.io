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
    render_file_path = render_folder + "video.avi"
    render_meta_file = render_folder + "lattefx_render.meta"

    if not os.path.exists(render_meta_path):
        return "error 10 no render meta found"

    render_meta = {}

    with open(render_meta_file, "r") as f:
        render_meta = json.loads(f.read())
        f.close()

    if render_meta["status"] != "purchased":
        return "error 11 video was not purchased"

    return send_file(render_file_path, as_attachment=True)


@renders.route("/render_preview/<render_id>/<token>", methods=['GET', 'OPTIONS'])
def get_render_preview(render_id, token):
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
    render_file_path = render_folder + "preview.mp4"

    if not os.path.exists(render_file_path):
        return "error 8 no render file found"

    return send_file(render_file_path)

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


def validate_order(order_id):
    url = "https://api.sandbox.paypal.com/v2/checkout/orders/" + order_id
    client_id = ""
    secret = ""

    # this, kids, is how you do a MVP
    return True

    with open(os.path.expanduser("~/.paypal.json"), "r") as f:
        paypal_settings = json.loads(f.read())
        client_id = paypal_settings["token"]

    token = client_id + ":" + secret

    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    }

    response = requests.get(url=url, headers=headers)

    # This is pretty MVP-ish.
    # We should check for date + already activated orders
    # Anyway we'll see in the logs if people start doing that

    if response.status_code == 200:
        return True
    else:
        return False
