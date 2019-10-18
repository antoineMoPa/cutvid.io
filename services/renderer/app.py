from flask import Flask, request
import os
import re
import json

app = Flask(__name__)

settings = json.load(open('../lattefx/settings.json'))

@app.after_request
def apply_corrs_headers(response):
    response.headers["Access-Control-Allow-Origin"] = settings['app']
    return response

@app.route("/has_vid_in_cache/<vidid>")
def has_vid_in_cache(vidid):
    """
    verify if we have a cache folder for this video
    """
    vidid = re.sub(r"[^0-9a-zA-Z]", "", vidid)
    folder = "/tmp/lattefx-cache-" + vidid
    return str(os.path.exists(folder)).lower()


@app.route("/upload_video/<vidid>", methods=['POST'])
def upload_video(vidid):
    """
    This could be optimized by using nginx direct uploading
    """
    vidid = re.sub(r"[^0-9a-zA-Z]", "", vidid)

    if len(vidid) != 40:
        return "error 1 bad token"

    video_file = request.files['video.vid']
    folder = "/tmp/lattefx-cache-" + vidid

    os.makedirs(folder, exist_ok=True)

    video_path = folder + "/video.vid"

    video_file.save(folder + "/video.vid")

    return "success"
