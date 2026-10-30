"""API Bibliavida. React → Flask → MariaDB."""
import json
import os
import re
import secrets
import time
from datetime import date, datetime, timezone
from pathlib import Path
from threading import Lock
from uuid import uuid4

import pymysql
from flask import Flask, g, jsonify, request
from werkzeug.exceptions import HTTPException

from db import close_db, query
from security import digest, hash_password, valid_date, verify_password

SOURCE = (Path(__file__).parent.parent / 'src/data/books.js').read_text(encoding='utf-8')
CHAPTER_COUNTS = {book: int(count) for book, count in re.findall(
    r'"([^"]+)":\s*(\d+)', SOURCE.split('export const chapterCounts =', 1)[1])}
COOKIE = 'bibliavida_session'
LIFETIME = 7 * 24 * 60 * 60


class ApiError(Exception):
    def __init__(self, status, message):
        self.status = status
        self.message = message


def fail(status, message):
    raise ApiError(status, message)


def body():
    data = request.get_json()
    if not isinstance(data, dict):
        fail(400, 'Envie um objeto JSON válido.')
    return data


def public_user(row):
    metadata = row['metadata']
    return {'id': row['id'], 'email': row['email'],
            'user_metadata': json.loads(metadata) if isinstance(metadata, str) else metadata}


def serialize_dates(row):
    if row is None:
        return None
    # DATE deve ser YYYY-MM-DD para o formulário do React; DATETIME é UTC.
    return {key: value.replace(tzinfo=timezone.utc).isoformat() if isinstance(value, datetime)
            else value.isoformat() if isinstance(value, date) else value
            for key, value in row.items()}


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.update(MAX_CONTENT_LENGTH=16384,
                      APP_ORIGIN=os.getenv('APP_ORIGIN', 'http://localhost:3000'),
                      COOKIE_SECURE=os.getenv('COOKIE_SECURE', 'false').lower() == 'true')
    if test_config:
        app.config.update(test_config)
    app.json.ensure_ascii = False
    app.teardown_appcontext(close_db)
    attempts = {}
    attempts_lock = Lock()

    @app.errorhandler(ApiError)
    def api_error(error):
        return jsonify(message=error.message), error.status

    @app.errorhandler(HTTPException)
    def http_error(error):
        messages = {400: 'JSON inválido.', 404: 'Rota não encontrada.',
                    405: 'Método não permitido.', 413: 'Pedido muito grande.',
                    415: 'Envie os dados como application/json.'}
        return jsonify(message=messages.get(error.code, 'Pedido inválido.')), error.code

    @app.errorhandler(Exception)
    def unexpected_error(error):
        if isinstance(error, pymysql.err.IntegrityError) and error.args[0] == 1062:
            return jsonify(message='Este e-mail já está cadastrado.'), 409
        app.logger.error('Falha na API: %s', type(error).__name__)
        return jsonify(message='Não foi possível acessar o banco de dados.'), 500

    @app.after_request
    def response_headers(response):
        response.headers['Cache-Control'] = 'no-store'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        return response

    @app.before_request
    def authenticate_request():
        origin = request.headers.get('Origin')
        if origin and origin != app.config['APP_ORIGIN']:
            fail(403, 'Origem não permitida.')
        if request.method not in ('GET', 'HEAD') and origin != app.config['APP_ORIGIN']:
            fail(403, 'Origem obrigatória.')
        g.user = None
        token = request.cookies.get(COOKIE, '')
        g.token = token if re.fullmatch(r'[a-f0-9]{64}', token) else None
        if g.token:
            users = query('SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id '
                          'WHERE s.token_hash=%s AND s.expires_at > UTC_TIMESTAMP()', (digest(g.token),))
            g.user = users[0] if users else None
        if request.path.startswith('/api/progress') or request.path == '/api/goal':
            if not g.user:
                fail(401, 'Entre na sua conta para continuar.')

    def start_session(account):
        token = secrets.token_hex(32)
        query('DELETE FROM sessions WHERE expires_at <= UTC_TIMESTAMP()')
        query('INSERT INTO sessions (token_hash, user_id, expires_at) '
              'VALUES (%s, %s, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY))', (digest(token), account['id']))
        user = public_user(account)
        response = jsonify(user=user, session={'user': user})
        response.set_cookie(COOKIE, token, max_age=LIFETIME, httponly=True,
                            secure=app.config['COOKIE_SECURE'], samesite='Lax', path='/')
        return response

    @app.get('/api/health')
    def health():
        query('SELECT 1')
        return jsonify(ok=True)

    @app.get('/api/auth/session')
    def session():
        return jsonify(session={'user': public_user(g.user)} if g.user else None)

    @app.post('/api/auth/login')
    @app.post('/api/auth/signup')
    def authenticate():
        with attempts_lock:
            now = time.monotonic()
            for key in list(attempts):
                if attempts[key]['until'] < now:
                    del attempts[key]
            attempt = attempts.setdefault(request.remote_addr, {'count': 0, 'until': now + 600})
            attempt['count'] += 1
            if attempt['count'] > 30:
                fail(429, 'Muitas tentativas. Aguarde alguns minutos.')
        data = body()
        email = data.get('email', '')
        email = email.strip().lower() if isinstance(email, str) else ''
        password = data.get('password')
        if (not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email) or len(email) > 254
                or not isinstance(password, str) or not 1 <= len(password) <= 128):
            fail(400, 'E-mail ou senha inválidos.')
        if request.path.endswith('/signup'):
            if len(password) < 8:
                fail(400, 'Use uma senha com pelo menos 8 caracteres.')
            options = data.get('options')
            meta = options.get('data') if isinstance(options, dict) else None
            if not isinstance(meta, dict):
                fail(400, 'Verifique os dados do cadastro.')
            if (not all(isinstance(meta.get(k), str) and meta[k].strip() and len(meta[k]) <= 100
                        for k in ('nome', 'sobrenome'))
                    or not valid_date(meta.get('data_nasc'))
                    or meta['data_nasc'] > datetime.now(timezone.utc).date().isoformat()
                    or not isinstance(meta.get('cpf'), str)
                    or not re.fullmatch(r'\d{3}\.\d{3}\.\d{3}-\d{2}', meta['cpf'])):
                fail(400, 'Verifique os dados do cadastro.')
            metadata = {key: meta[key].strip() for key in ('nome', 'sobrenome', 'cpf', 'data_nasc')}
            account = {'id': str(uuid4()), 'email': email, 'metadata': json.dumps(metadata, ensure_ascii=False)}
            query('INSERT INTO users (id, email, password_hash, metadata) VALUES (%s, %s, %s, %s)',
                  (account['id'], email, hash_password(password), account['metadata']))
        else:
            rows = query('SELECT * FROM users WHERE email=%s', (email,))
            account = rows[0] if rows else None
            fallback = '0' * 32 + ':' + '00' * 64
            valid = verify_password(password, account['password_hash'] if account else fallback)
            if not account or not valid:
                fail(401, 'E-mail ou senha incorretos.')
        return start_session(account)

    @app.post('/api/auth/logout')
    def logout():
        if g.token:
            query('DELETE FROM sessions WHERE token_hash=%s', (digest(g.token),))
        response = jsonify(ok=True)
        response.set_cookie(COOKIE, '', max_age=0, httponly=True,
                            secure=app.config['COOKIE_SECURE'], samesite='Lax', path='/')
        return response

    @app.get('/api/progress')
    def progress():
        rows = query('SELECT livro, capitulo FROM capitulos_lidos WHERE user_id=%s ORDER BY livro, capitulo', (g.user['id'],))
        result = {}
        for row in rows:
            result.setdefault(row['livro'], []).append(row['capitulo'])
        return jsonify(result)

    @app.get('/api/progress/last')
    def last_read():
        rows = query('SELECT livro, capitulo, lido_em FROM capitulos_lidos WHERE user_id=%s '
                     'ORDER BY lido_em DESC, livro, capitulo DESC LIMIT 1', (g.user['id'],))
        return jsonify(serialize_dates(rows[0]) if rows else None)

    @app.route('/api/progress/chapter', methods=['PUT', 'DELETE'])
    @app.route('/api/progress/book', methods=['PUT', 'DELETE'])
    def update_progress():
        data = body()
        book, chapter = data.get('livro'), data.get('capitulo')
        total = CHAPTER_COUNTS.get(book) if isinstance(book, str) else None
        single = request.path.endswith('/chapter')
        if not total or (single and (type(chapter) is not int or not 1 <= chapter <= total)):
            fail(400, 'Livro ou capítulo inválido.')
        if request.method == 'DELETE':
            query('DELETE FROM capitulos_lidos WHERE user_id=%s AND livro=%s' + (' AND capitulo=%s' if single else ''),
                  (g.user['id'], book, chapter) if single else (g.user['id'], book))
        else:
            chapters = [chapter] if single else list(range(1, total + 1))
            placeholders = ','.join(['(%s, %s, %s)'] * len(chapters))
            params = tuple(value for number in chapters for value in (g.user['id'], book, number))
            query('INSERT INTO capitulos_lidos (user_id, livro, capitulo) VALUES ' + placeholders
                  + ' ON DUPLICATE KEY UPDATE capitulo=VALUES(capitulo)', params)
        return jsonify(ok=True)

    @app.route('/api/goal', methods=['GET', 'PUT', 'DELETE'])
    def goal():
        if request.method == 'GET':
            rows = query('SELECT escopo, data_alvo FROM metas_leitura WHERE user_id=%s', (g.user['id'],))
            return jsonify(serialize_dates(rows[0]) if rows else None)
        if request.method == 'DELETE':
            query('DELETE FROM metas_leitura WHERE user_id=%s', (g.user['id'],))
        else:
            data = body()
            if data.get('escopo') not in ('biblia', 'antigo', 'novo') or not valid_date(data.get('data_alvo')):
                fail(400, 'Meta inválida.')
            query('INSERT INTO metas_leitura (user_id, escopo, data_alvo) VALUES (%s, %s, %s) '
                  'ON DUPLICATE KEY UPDATE escopo=VALUES(escopo), data_alvo=VALUES(data_alvo)',
                  (g.user['id'], data['escopo'], data['data_alvo']))
        return jsonify(ok=True)

    return app


if __name__ == '__main__':
    from waitress import serve
    port = int(os.getenv('PORT', '3001'))
    print(f'API Python disponível em http://127.0.0.1:{port}', flush=True)
    serve(create_app(), host='127.0.0.1', port=port)
