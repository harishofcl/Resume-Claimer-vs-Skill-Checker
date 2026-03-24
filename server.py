from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import re

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

DB_PATH = 'resume_analyzer_v2.db' 

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def sanitize_table_name(name):
    # Remove any non-alphanumeric characters to prevent SQL syntax errors or injections
    safe_name = re.sub(r'[^a-zA-Z0-9]', '_', name)
    return f"company_{safe_name}"

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/candidates', methods=['POST'])
def save_candidate():
    data = request.json
    company_name = data.get('company_name')
    if not data or not data.get('name') or not data.get('email') or not company_name:
        return jsonify({'error': 'Missing required fields'}), 400
        
    table_name = sanitize_table_name(company_name)
        
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Dynamically create the table for this specific company if it doesn't exist
    cur.execute(f'''
        CREATE TABLE IF NOT EXISTS {table_name} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recruiter_name TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            role TEXT NOT NULL,
            score INTEGER NOT NULL,
            status TEXT NOT NULL,
            skills TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cur.execute(f'''
        INSERT INTO {table_name} (recruiter_name, name, email, role, score, status, skills)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (data.get('recruiter_name', 'Unknown'), data.get('name'), 
          data.get('email'), data.get('role'), data.get('score'), data.get('status'), data.get('skills')))
    
    conn.commit()
    inserted_id = cur.lastrowid
    conn.close()
    
    return jsonify({'message': 'Candidate saved successfully into company table', 'id': inserted_id}), 201

@app.route('/api/candidates', methods=['GET'])
def get_candidates():
    company = request.args.get('company')
    if not company:
        return jsonify({'error': 'Company name is required query parameter'}), 400

    table_name = sanitize_table_name(company)

    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute(f'SELECT * FROM {table_name} ORDER BY created_at DESC')
        rows = cur.fetchall()
        candidates = [dict(row) for row in rows]
    except sqlite3.OperationalError:
        # Table doesn't exist yet, meaning no candidates for this company
        candidates = []
        
    conn.close()
    return jsonify(candidates)

@app.route('/api/candidates', methods=['DELETE'])
def clear_candidates():
    company = request.args.get('company')
    if not company:
        return jsonify({'error': 'Company name is required query parameter'}), 400

    table_name = sanitize_table_name(company)

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(f'DROP TABLE IF EXISTS {table_name}')
        conn.commit()
        changes = 1
    except sqlite3.OperationalError:
        changes = 0
        
    conn.close()
    return jsonify({'message': f'Database table dropped for {company}', 'changes': changes})

if __name__ == '__main__':
    app.run(port=3000, debug=True)
