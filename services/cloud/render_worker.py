"""

Listens to render tasks and executes them with the renderer

"""

import json
import zmq
import subprocess
import json

settings = json.load(open('../lattefx/settings.json'))


def update_status(render_folder):
    # Update status
    render_meta_path = render_folder + "lattefx_render.meta"

    with open(render_meta_path, "r") as f:
        render_meta = json.loads(f.read())
        f.close()

    render_meta["status"] = "rendering"

    with open(render_meta_path, "w") as f:
        f.write(json.dumps(render_meta))
        f.close()

def start_render_worker():

    context = zmq.Context()
    render_queue = context.socket(zmq.SUB)

    if settings["variant_name"] == "prod":
        ipc_channel = "ipc:///tmp/render_queue"
    elif settings["variant_name"] == "next":
        ipc_channel = "ipc:///tmp/render_queue_next"

    render_queue.connect(ipc_channel);

    render_queue.setsockopt_string(zmq.SUBSCRIBE, "")

    print("Render worker listening")

    while True:
        command_str = render_queue.recv_string()
        command = json.loads(command_str)

        print("executing: " + str(command))

        render_folder = command["render_folder"]

        update_status(render_folder)

        xvfb_run = ['xvfb-run', '-s' , '-ac -screen 0 1920x1080x24']

        if settings["use_xvfb"] == True:
          command["command"] = xvfb_run + command["command"]

        render_command = subprocess.Popen(
            command["command"],
            cwd=command["render_folder"]
        )

        render_command.wait()
        print("done")
