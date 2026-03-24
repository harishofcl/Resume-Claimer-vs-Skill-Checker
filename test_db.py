import sqlite3
import os

if os.path.exists('resume_analyzer_v2.db'):
    conn = sqlite3.connect('resume_analyzer_v2.db')
    print("TABLES:", conn.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall())
    tables = [x[0] for x in conn.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall() if x[0] != 'sqlite_sequence']
    for t in tables:
        print(f"--- {t} ---")
        print(conn.execute(f"SELECT * FROM {t}").fetchall())
else:
    print("DB DOES NOT EXIST")
