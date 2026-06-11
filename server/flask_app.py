from flask import Flask, request, jsonify
import sqlite3
import datetime
import os

app = Flask(__name__)

DB_PATH = "game.db"

# cria base de dados se não existir
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id TEXT,
            player_name TEXT,
            action TEXT,
            time TEXT,
            score TEXT,
            turn TEXT,
            gold TEXT,
            enemies_defeated TEXT,
            allies TEXT,
            class_type TEXT,
            hp TEXT,
            mana TEXT,
            power TEXT,
            rank TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

@app.route("/")
def home():
    return "D&D RPG API running", 200

@app.route("/submit", methods=["GET"])
def submit():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("""
        INSERT INTO scores (
            player_id, player_name, action, time, score, turn, gold,
            enemies_defeated, allies, class_type, hp, mana, power, rank
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        request.args.get("player_id"),
        request.args.get("player_name"),
        request.args.get("action"),
        str(datetime.datetime.now()),
        request.args.get("score"),
        request.args.get("turn"),
        request.args.get("gold"),
        request.args.get("enemies_defeated"),
        request.args.get("allies"),
        request.args.get("class_type"),
        request.args.get("hp"),
        request.args.get("mana"),
        request.args.get("power"),
        request.args.get("rank")
    ))

    conn.commit()
    conn.close()

    return "ok", 200

@app.route("/list")
def list_data():
    conn = sqlite3.connect("game.db")
    c = conn.cursor()

    c.execute("SELECT * FROM scores ORDER BY id DESC")
    rows = c.fetchall()

    conn.close()

    html = """
    <html>
    <head>
        <title>D&D RPG - Data</title>
        <style>
            body { font-family: Arial; background:#111; color:#eee; padding:20px; }
            table { width:100%; border-collapse: collapse; margin-top:20px; }
            th, td { border:1px solid #444; padding:8px; text-align:center; font-size:12px; }
            th { background:#222; color:#ffd700; }
            tr:nth-child(even) { background:#1a1a1a; }
        </style>
    </head>
    <body>
        <h1>⚔️ D&D RPG - Stored Game Data ⚔️</h1>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Player ID</th>
                    <th>Player Name</th>
                    <th>Action</th>
                    <th>Time</th>
                    <th>Score(%)</th>
                    <th>Enemies</th>
                    <th>Gold</th>
                    <th>Allies</th>
                    <th>Class</th>
                    <th>HP</th>
                    <th>Mana</th>
                    <th>Power</th>
                    <th>Rank</th>
                </tr>
            </thead>
            <tbody>
    """

    for row in rows:
        html += "<tr>"
        for cell in row:
            html += f"<td>{cell if cell else '-'}</td>"
        html += "</tr>"

    html += """
            </tbody>
        </table>
    </body>
    </html>
    """

    return html

@app.route("/data", methods=["GET"])
def data():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("SELECT * FROM scores ORDER BY id DESC")
    rows = c.fetchall()

    conn.close()

    return jsonify(rows)

if __name__ == '__main__':
    app.run()