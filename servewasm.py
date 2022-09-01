#!/usr/bin/env python

import mimetypes

mimetypes.init()
if ".wasm" not in mimetypes.types_map:
    mimetypes.add_type("application/wasm", ".wasm")

import argparse
from http import server

parser = argparse.ArgumentParser(description='Start a local webserver with a Python terminal.')
parser.add_argument('--port', type=int, default=8000, help='port for the http server to listen on')
args = parser.parse_args()

class MyHTTPRequestHandler(server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_my_headers()

        super().end_headers()

    def send_my_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")


def run(server_class=server.HTTPServer, handler_class=MyHTTPRequestHandler):
    """Entrypoint for python server"""
    server_address = ("0.0.0.0", args.port)
    httpd = server_class(server_address, handler_class)
    print("launching server...")
    httpd.serve_forever()
    
# server.test(HandlerClass=MyHTTPRequestHandler, protocol="HTTP/1.1", port=args.port)

if __name__ == "__main__":
    run()