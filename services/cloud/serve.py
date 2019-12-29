import os

def render_queue_process():
    from render_worker import start_render_worker
    start_render_worker()

def serve_process():
    import cloud
    from waitress import serve

    serve(cloud.app, host='0.0.0.0', port=8004)

def forker():
    newpid = os.fork()

    if newpid == 0:
        serve_process()
    else:
        render_queue_process()
        pids = (os.getpid(), newpid)
        print("serve_process: %d, render_queue_process: %d\n" % pids)

forker()
