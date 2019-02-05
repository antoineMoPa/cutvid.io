from http.server import HTTPServer, BaseHTTPRequestHandler

class ConverterHTTPRequestHandler(BaseHTTPRequestHandler):

    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'Hello, world!')
    
    def do_POST(self):
        with open("input_file.zip", "wb") as outfile:
            outfile.write(self.rfile.read(int(self.headers.get("Content-Length"))))
                
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'ok')


httpd = HTTPServer(('localhost', 8001), ConverterHTTPRequestHandler)
httpd.serve_forever()

# Testing this service:
# Create a zip file data.zip
# curl -X POST  --data-binary "@data.zip" 127.0.0.1:8001 -H "Content-Type: application/x-www-form-urlencoded"
# Ensure content is the same
