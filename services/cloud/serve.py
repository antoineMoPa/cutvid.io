import os
import cloud
from waitress import serve

def serve_cloud(port=8004):
    serve(cloud.app, host='0.0.0.0', port=port)

if __name__ == '__main__':
    serve_cloud()
