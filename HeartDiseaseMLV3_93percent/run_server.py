# run_server.py
"""
One-click local launcher for your FastAPI service.

Usage:
  python run_server.py                # starts on http://127.0.0.1:8000
  python run_server.py --open         # auto-open /docs in your browser
  python run_server.py --reload       # dev mode (auto-reload on code changes)
  python run_server.py --port 9000    # custom port
"""

import argparse
import time
import threading
import webbrowser
import sys

try:
    import uvicorn
    import requests
except ImportError as e:
    print("Missing packages. Install requirements first:")
    print("  pip install -r requirements.txt")
    sys.exit(1)


def wait_and_open(url: str, timeout: float = 15.0, interval: float = 0.5):
    """Ping the server until it responds, then open browser."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(url, timeout=2)
            if r.status_code < 500:
                webbrowser.open(url)
                return
        except Exception:
            pass
        time.sleep(interval)


def main():
    parser = argparse.ArgumentParser(description="Run FastAPI service locally.")
    parser.add_argument("--host", default="127.0.0.1", help="Bind address (default 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8000, help="Port (default 8000)")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload (dev mode)")
    parser.add_argument("--open", action="store_true", help="Open API docs in browser when ready")
    args = parser.parse_args()

    if args.open:
        # open the docs page once server is responding
        t = threading.Thread(
            target=wait_and_open, args=(f"http://{args.host}:{args.port}/docs",), daemon=True
        )
        t.start()

    # Run uvicorn programmatically
    uvicorn.run(
        "service.api:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info",
    )


if __name__ == "__main__":
    main()
