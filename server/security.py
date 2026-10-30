"""Hashes compatíveis com os que a versão Node.js gerava."""
import hashlib
import hmac
import re
import secrets
from datetime import date


def digest(value):
    return hashlib.sha256(value.encode('utf-8')).hexdigest()


def hash_password(password, salt=None):
    salt = salt or secrets.token_hex(16)
    key = hashlib.scrypt(password.encode('utf-8'), salt=salt.encode('utf-8'),
                         n=16384, r=8, p=1, dklen=64)
    return f'{salt}:{key.hex()}'


def verify_password(password, stored):
    try:
        salt, expected = stored.split(':')
        if not re.fullmatch(r'[0-9a-f]{32}', salt) or not re.fullmatch(r'[0-9a-f]{128}', expected):
            return False
        actual = hash_password(password, salt).split(':')[1]
        return hmac.compare_digest(actual, expected)
    except (TypeError, ValueError, AttributeError):
        return False


def valid_date(value):
    if not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', value):
        return False
    try:
        return date.fromisoformat(value).isoformat() == value
    except ValueError:
        return False
