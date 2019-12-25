import sys

from watchdog.observers import Observer
from watchdog.events import LoggingEventHandler

from build import build

class EventHandler(LoggingEventHandler):
    def dispatch(self, event):

        if event.event_type == "modified":
            if event.src_path != "./app.build.js" :
                print("rebuilding")
                print(event.event_type)
                print(event.src_path)
                build()

event_handler = EventHandler()
observer = Observer()
observer.schedule(event_handler, "./", recursive=True)

try:
    observer.start()
except KeyboardInterrupt:
    observer.stop()

observer.join()
