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

@media.route("/media/<project_id>/<media_id>/<token>", methods=['GET', 'OPTIONS'])
def get_media(project_id, media_id, token):
    """
    Read a project's media
    """

    if request.method == 'OPTIONS':
        return ""

    token = read_token(token)

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
