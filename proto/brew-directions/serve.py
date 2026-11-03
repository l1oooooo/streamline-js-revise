"""Serve the isolated exploration without caching files during iteration."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

if __name__ == '__main__':
    root = Path(__file__).resolve().parents[2]
    print('Preview: http://127.0.0.1:8766/proto/brew-directions/', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8766), partial(Handler, directory=root)).serve_forever()
