from pathlib import Path
import sqlite3, json, time, hashlib

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "service" / "predictions.sqlite"

def _connect():
    DB.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB)
    con.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts INTEGER NOT NULL,
            task TEXT NOT NULL,
            model_version TEXT NOT NULL,
            inputs_json TEXT NOT NULL,
            probability REAL NOT NULL,
            band TEXT NOT NULL,
            ip_hash TEXT
        )
    """)
    return con

def log_prediction(task:str, model_version:str, inputs:dict, probability:float, band:str, ip:str|None):
    con = _connect()
    ip_hash = hashlib.sha256(ip.encode()).hexdigest() if ip else None
    con.execute(
        "INSERT INTO predictions (ts, task, model_version, inputs_json, probability, band, ip_hash) VALUES (?,?,?,?,?,?,?)",
        (int(time.time()), task, model_version, json.dumps(inputs), float(probability), band, ip_hash)
    )
    con.commit()
    con.close()

def count_rows():
    con = _connect()
    cur = con.execute("SELECT COUNT(*) FROM predictions")
    n = cur.fetchone()[0]
    con.close()
    return n
