"""Conexão MariaDB: uma conexão por requisição, fechada pelo Flask."""
import os
from pathlib import Path

import pymysql
from dotenv import load_dotenv
from flask import g

load_dotenv(Path(__file__).with_name('.env'))


def connect():
    return pymysql.connect(
        host=os.getenv('DB_HOST', '127.0.0.1'),
        port=int(os.getenv('DB_PORT', '3306')),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME', 'bibliavida'),
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
        connect_timeout=5,
        read_timeout=10,
        write_timeout=10,
        init_command="SET time_zone = '+00:00'",
    )


def query(sql, params=()):
    if 'db' not in g:
        g.db = connect()
    with g.db.cursor() as cursor:
        cursor.execute(sql, params)
        return list(cursor.fetchall()) if cursor.description else []


def close_db(error=None):
    connection = g.pop('db', None)
    if connection is not None:
        connection.close()
