import sys

from watchdog.observers import Observer
from watchdog.events import LoggingEventHandler

from build import build

# Build once at startup
build()

# ...
# Then watch for change in the folder and rebuild

class EventHandler(LoggingEventHandler):
    def dispatch(self, event):

        if event.event_type == "modified":
            if event.src_path != "./app.build.js" :
                build()

event_handler = EventHandler()
observer = Observer()
observer.schedule(event_handler, "./", recursive=True)


try:
    observer.start()
except KeyboardInterrupt:
    observer.stop()

observer.join()
