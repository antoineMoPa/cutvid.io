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

from base64 import b64decode

from utils import *

projects = Blueprint('projects', __name__)

@projects.route("/list_projects", methods=['GET', 'OPTIONS'])
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

    user_folder = USERS_FOLDER + "user-" + str(user_id) + "/"
    project_meta_files = glob.glob(user_folder + "/project-*/lattefx_project.meta")

    project_metas = []

    for project_meta_file in sorted(project_meta_files, key=os.path.getatime, reverse=True):
        # Extract project id
        project_id = project_meta_path_to_project_id(project_meta_file)

        with open(project_meta_file, "r") as f:
            project_meta = json.loads(f.read())

        # Populate project info with id and size
        project_meta["id"] = project_id
        project_folder = user_folder + "project-" + str(project_id) + "/"
        project_meta["bytecount"] = folder_size(project_folder)

        project_metas.append(project_meta)

    return json.dumps(project_metas)

@projects.route("/project/<project_id>", methods=['GET', 'OPTIONS'])
def get_project(project_id):
    """
    Read a project
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

    extract_media(project_folder)

    with open(project_file_path, "r") as f:
        return f.read()

@projects.route("/project/<project_id>/file/<file_name>/<token>", methods=['GET', 'OPTIONS'])
def get_file(project_id, file_name, token):
    """
    Read a project's file
    """

    if request.method == 'OPTIONS':
        return ""

    token = read_token(token)

    if token is None:
        return "error 1 bad token"

    project_id = int(project_id)
    user_id = int(token['user_id'])

    user_folder = USERS_FOLDER + "user-" + str(user_id) + "/"
    project_folder = user_folder + "project-" + str(project_id) + "/"
    file_path = project_folder + "files/file_"+ file_name.replace("..", "")

    if not os.path.exists(file_path):
        return "error 8 no file '" + file_path + file_name + "' found"

    with open(file_path, "rb") as f:
        data = io.BytesIO(f.read())
        return send_file(data,
                         attachment_filename="media.media",
                         mimetype="application/octet-stream")


@projects.route("/delete_project/<project_id>", methods=['DELETE', 'OPTIONS'])
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


@projects.route("/rename_project/<project_id>", methods=['POST', 'OPTIONS'])
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


@projects.route("/upload_project/<project_id>", methods=['POST', 'OPTIONS'])
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

    files_folder = project_folder + "/files/"
    os.makedirs(files_folder, exist_ok=True)

    for f in request.files:
        request.files[f].save(files_folder + f.replace("..",""))

    project_file_path = project_folder + "lattefx_file.lattefx"

    with open(project_file_path, "w") as f:
        f.write(project_file)

    project_meta_path = project_folder + "lattefx_project.meta"

    if not os.path.exists(project_meta_path):
        # Create project meta for new projects
        project_meta = json.dumps({"name": "Untitled Project"})

        with open(project_meta_path, "w") as f:
            f.write(project_meta)

    return "success"
