from http.server import HTTPServer
from http.server import BaseHTTPRequestHandler
from http.server import SimpleHTTPRequestHandler

PORT = 8000

class RequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        SimpleHTTPRequestHandler.end_headers(self)

def run(server_class=HTTPServer, handler_class=RequestHandler):
    httpd = server_class(('', PORT), # Server Adress
                         handler_class)
    httpd.serve_forever()

if __name__ == "__main__":
  print("Starting server at http://127.0.0.1:" + str(PORT))
  run()
