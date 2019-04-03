from http.server import HTTPServer, BaseHTTPRequestHandler
from cgi import parse_header, parse_multipart

import re
import json
import os

import random
import string

# Thanks to https://stackoverflow.com/questions/2257441/
def id_generator(size=15, chars=string.ascii_uppercase + string.ascii_lowercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))

settings = json.load(open('../../src/settings.json'))

class ConverterHTTPRequestHandler(BaseHTTPRequestHandler):

    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'Hello, world!')

    def do_POST(self):
        ctype, pdict = parse_header(self.headers['content-type'])
        pdict['boundary'] = bytes(pdict['boundary'], "utf-8")
        data = parse_multipart(self.rfile, pdict)

        downloadableName = id_generator()

        os.system("mkdir tmp/"+downloadableName)

        for filename in data:
            # Verify format: ex 00000001.png
            if re.search(r"[0-9]{1,10}\.png", filename):
                # Write file
                with open("tmp/" + downloadableName + "/" + filename, "wb") as outfile:
                    outfile.write(data[filename][0])

        # Write video JSON
        with open("tmp/" + downloadableName + "/data.json", "wb") as outfile:
            outfile.write(data['data'][0])

        # float() acts as some safety filtering
        # since we pass this variable to the command line
        fps = float(data['fps'][0])

        candidates_folder = settings['candidates_folder']

        # The double % becomes a single %
        os.system("ffmpeg -nostdin -r %f -i tmp/%s/%%07d.png -map 0 -c:v png tmp/%s/result.avi" % (fps, downloadableName, downloadableName))
        os.system("mv tmp/%s/result.avi tmp/%s/purchased-video-%s.avi" % (downloadableName, downloadableName, downloadableName))
        os.system("mv tmp/%s %s" % (downloadableName, candidates_folder))

        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', settings['app'])
        self.end_headers()

        # Respond with the downloadable content id
        downloadableNameInBytes = str.encode(downloadableName)
        self.wfile.write(downloadableNameInBytes)


httpd = HTTPServer(('localhost', 8004), ConverterHTTPRequestHandler)
httpd.serve_forever()

# Testing this service:
# Create a zip file data.zip
# curl -X POST  --data-binary "@data.zip" 127.0.0.1:8004 -H "Content-Type: application/x-www-form-urlencoded"
# Ensure content is the same
