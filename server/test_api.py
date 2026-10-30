"""Testes HTTP com banco simulado; não substituem teste no MariaDB real."""
import unittest
from datetime import date
from unittest.mock import patch

import pymysql
from app import create_app
from security import hash_password, verify_password, valid_date

ORIGIN = {'Origin': 'http://localhost:3000'}
USER = {'id': 'authenticated-user', 'email': 'reader@example.com', 'metadata': '{}'}


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({'TESTING': True, 'APP_ORIGIN': ORIGIN['Origin']})
        self.client = self.app.test_client()
        self.patch = patch('app.query', side_effect=self.query)
        self.db = self.patch.start()
        self.addCleanup(self.patch.stop)

    def query(self, sql, params=()):
        if 'JOIN sessions' in sql:
            return [USER]
        if sql.startswith('SELECT livro, capitulo FROM'):
            return [{'livro': 'Salmos', 'capitulo': 1}]
        return []

    def login_cookie(self):
        self.client.set_cookie('bibliavida_session', 'a' * 64)

    def test_signed_out_session(self):
        response = self.client.get('/api/auth/session')
        self.assertEqual(response.json, {'session': None})
        self.db.assert_not_called()

    def test_requires_authentication(self):
        self.assertEqual(self.client.get('/api/progress').status_code, 401)

    def test_origin_protection(self):
        response = self.client.put('/api/progress/chapter', json={}, headers={'Origin': 'http://other.example'})
        self.assertEqual(response.status_code, 403)
        self.db.assert_not_called()
        self.assertEqual(self.client.post('/api/auth/login', json={}).status_code, 403)

    def test_progress_is_scoped_to_session(self):
        self.login_cookie()
        response = self.client.get('/api/progress?user_id=another-user')
        self.assertEqual(response.json, {'Salmos': [1]})
        self.assertEqual(self.db.call_args.args[1], (USER['id'],))

    def test_chapter_limits_and_types(self):
        self.login_cookie()
        for chapter in (151, 0, True, '1'):
            response = self.client.put('/api/progress/chapter', json={'livro': 'Salmos', 'capitulo': chapter}, headers=ORIGIN)
            self.assertEqual(response.status_code, 400)

    def test_mutations_ignore_user_id(self):
        self.login_cookie()
        response = self.client.put('/api/progress/chapter', json={'livro': 'Salmos', 'capitulo': 150, 'user_id': 'other'}, headers=ORIGIN)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.db.call_args.args[1], (USER['id'], 'Salmos', 150))

    def test_whole_book_is_single_atomic_statement(self):
        self.login_cookie()
        response = self.client.put('/api/progress/book', json={'livro': 'Salmos'}, headers=ORIGIN)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(self.db.call_args.args[1]), 150 * 3)

    def test_goal_dates_remain_iso_strings(self):
        self.login_cookie()
        self.db.side_effect = lambda sql, params=(): [USER] if 'JOIN sessions' in sql else [{'escopo': 'biblia', 'data_alvo': date(2028, 2, 29)}]
        response = self.client.get('/api/goal')
        self.assertEqual(response.json, {'escopo': 'biblia', 'data_alvo': '2028-02-29'})

    def test_empty_goal_and_last_read(self):
        self.login_cookie()
        for path in ('/api/goal', '/api/progress/last'):
            self.assertEqual(self.client.get(path).get_data(as_text=True).strip(), 'null')

    def test_invalid_json_and_size(self):
        self.assertEqual(self.client.post('/api/auth/login', data='{', content_type='application/json', headers=ORIGIN).status_code, 400)
        self.assertEqual(self.client.post('/api/auth/login', json=[], headers=ORIGIN).status_code, 400)
        self.assertEqual(self.client.post('/api/auth/login', json={'data': 'a' * 17000}, headers=ORIGIN).status_code, 413)

    def test_signup_contract_cookie_and_password(self):
        response = self.client.post('/api/auth/signup', json={
            'email': ' Reader@Example.com ', 'password': 'uma-senha-segura',
            'options': {'data': {'nome': 'Maria', 'sobrenome': 'Silva', 'cpf': '123.456.789-01', 'data_nasc': '2000-01-01'}}}, headers=ORIGIN)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['session']['user']['email'], 'reader@example.com')
        self.assertNotIn('password_hash', response.json['user'])
        cookie = response.headers['Set-Cookie']
        for value in ('HttpOnly', 'SameSite=Lax', 'Max-Age=604800', 'Path=/'):
            self.assertIn(value, cookie)
        insert = next(call for call in self.db.call_args_list if call.args[0].startswith('INSERT INTO users'))
        self.assertTrue(verify_password('uma-senha-segura', insert.args[1][2]))
        session_insert = next(call for call in self.db.call_args_list if call.args[0].startswith('INSERT INTO sessions'))
        self.assertEqual(len(session_insert.args[1][0]), 64)
        self.assertNotEqual(self.client.get_cookie('bibliavida_session').value, session_insert.args[1][0])

    def test_login_and_logout(self):
        account = {**USER, 'password_hash': hash_password('uma-senha-segura')}
        self.db.side_effect = lambda sql, params=(): [account] if sql.startswith('SELECT * FROM users') or 'JOIN sessions' in sql else []
        self.assertEqual(self.client.post('/api/auth/login', json={'email': USER['email'], 'password': 'errada'}, headers=ORIGIN).status_code, 401)
        response = self.client.post('/api/auth/login', json={'email': USER['email'], 'password': 'uma-senha-segura'}, headers=ORIGIN)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['session']['user']['id'], USER['id'])
        self.assertEqual(self.client.post('/api/auth/logout', headers=ORIGIN).status_code, 200)
        self.assertIsNone(self.client.get_cookie('bibliavida_session'))
        self.assertTrue(any('DELETE FROM sessions WHERE token_hash' in call.args[0] for call in self.db.call_args_list))

    def test_duplicate_email(self):
        self.db.side_effect = pymysql.err.IntegrityError(1062, 'private details')
        response = self.client.post('/api/auth/signup', json={
            'email': USER['email'], 'password': 'uma-senha-segura',
            'options': {'data': {'nome': 'Maria', 'sobrenome': 'Silva', 'cpf': '123.456.789-01', 'data_nasc': '2000-01-01'}}}, headers=ORIGIN)
        self.assertEqual(response.status_code, 409)
        self.assertNotIn('private', response.get_data(as_text=True))

    def test_rate_limit(self):
        for _ in range(30):
            self.client.post('/api/auth/login', json={}, headers=ORIGIN)
        self.assertEqual(self.client.post('/api/auth/login', json={}, headers=ORIGIN).status_code, 429)

    def test_secure_cookie_configuration(self):
        self.app.config['COOKIE_SECURE'] = True
        response = self.client.post('/api/auth/logout', headers=ORIGIN)
        self.assertIn('Secure', response.headers['Set-Cookie'])


class SecurityTests(unittest.TestCase):
    def test_node_scrypt_compatibility(self):
        # Vetor gerado com crypto.scryptSync no Node.js, com salt fixo de teste.
        stored = ('0123456789abcdef0123456789abcdef:'
                  'e47126065866a62109287931e657aad14e8163d37c304e326a12f4b8a6dd72d2d'
                  '432fa6da3e562647a065dcb24d1c8d6a80a2d1a45bec7539cca804530425783')
        self.assertTrue(verify_password('senha-de-teste', stored))
        self.assertEqual(hash_password('senha-de-teste', '0123456789abcdef0123456789abcdef'), stored)

    def test_hashes_and_dates(self):
        first = hash_password('senha-com-acentos-á')
        self.assertNotEqual(first, hash_password('senha-com-acentos-á'))
        self.assertTrue(verify_password('senha-com-acentos-á', first))
        self.assertFalse(verify_password('errada', first))
        self.assertFalse(verify_password('errada', 'inválido'))
        self.assertTrue(valid_date('2028-02-29'))
        self.assertFalse(valid_date('2026-02-29'))
        self.assertFalse(valid_date('2026-02-30'))


if __name__ == '__main__':
    unittest.main()
