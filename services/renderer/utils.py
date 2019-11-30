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
