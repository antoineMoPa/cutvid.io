from pathlib import Path
import os
import re
import json
import datetime
import glob
import string
import random
import time
import requests
import jwt
import shutil
from base64 import b64decode

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

def folder_size(path):
    """ Get folder size in bytes """
    # Thanks stack overflow:
    # https://stackoverflow.com/questions/1392413/
    root_directory = Path(path)

    byte_count = sum(f.stat().st_size for f in root_directory.glob('**/*') if f.is_file())

    return byte_count

def project_meta_path_to_project_id(project_meta_file_path):
    return int(project_meta_file_path.split("/")[-2].split("-")[1])

def render_meta_path_to_render_id(render_meta_file_path):
    render_id = render_meta_file_path.split("/")[-2].split("-")[1]
    return validate_and_sanitize_id(render_id)

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

def validate_and_sanitize_id(vidid):
    vidid = re.sub(r"[^0-9a-zA-Z]", "", vidid)

    if len(vidid) != 40:
        return None

    return vidid

def extract_media(project_folder):
    """ Takes out most big media parts out of lattefx files
    """
    project_file_path = project_folder + "lattefx_file.lattefx"

    with open(project_file_path, "r") as f:
        project = json.loads(f.read())
        f.close()

    project_media_folder = project_folder + "media/"
    os.makedirs(project_media_folder, exist_ok=True)

    for media_type in ('video', 'audio'):
      for scene in project["scenes"]:
          if "effect" not in scene:
              continue

          effect = scene["effect"]

          if media_type + "FileB64" not in effect:
              continue

          video_dataurl = effect[media_type+"FileB64"]

          if video_dataurl == "":
              # Video already extracted
              continue

          video_B64 = video_dataurl.split(",")[1]
          video_file = b64decode(video_B64)

          media_name = id_generator()
          media_path = project_media_folder + media_name

          with open(media_path, "wb") as f:
              f.write(video_file)
              f.close()

          effect[media_type+"FileB64"] = ""
          effect[media_type] = ""
          effect[media_type + "_media_id"] = media_name

    with open(project_file_path, "w") as f:
        f.write(json.dumps(project))

def copy_medias(user_id, project_id, dest_folder):
    """
    Copies media files to a folder
    """

    user_folder = USERS_FOLDER + "user-" + str(user_id) + "/"
    project_folder = user_folder + "project-" + str(project_id) + "/"
    medias_folder = project_folder + "media/"
    directory = Path(medias_folder)

    for filename in directory.glob("*"):
        media_id = str(filename).split("/")[-1]
        if validate_and_sanitize_id(media_id) is None:
            continue

        media_path = medias_folder + media_id
        shutil.copyfile(media_path, dest_folder + media_id)

def consume_render_credits(user_id, count):
    """
    Consume 'count' render credits from user account

    Returns True on success
    """

    auth_port = settings['auth_port']
    auth_url = "http://127.0.0.1:" + str(auth_port) + "/auth"
    url = auth_url + "/consume_render_credits/" + str(user_id) + "/" + str(count)

    request = requests.get(url=url)

    return request.text == "success"
