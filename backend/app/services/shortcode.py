import secrets
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.config import settings

BASE62_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
BASE62_LEN = len(BASE62_ALPHABET)  # 62


def generate_base62_code(length: int = settings.SHORT_CODE_LENGTH) -> str:
    """
    Generate a cryptographically secure pseudo-random Base62 string.
    Using secrets.choice ensures non-predictable, uniform distribution.
    For length = 7, the keyspace is 62^7 = 3.52 * 10^12 (over 3.5 trillion unique codes).
    """
    return "".join(secrets.choice(BASE62_ALPHABET) for _ in range(length))


def encode_base62(num: int) -> str:
    """
    Encode an integer (e.g. auto-increment DB ID) into a Base62 string.
    Useful for comparison analysis in system architecture documentation.
    """
    if num == 0:
        return BASE62_ALPHABET[0]
    arr = []
    base = BASE62_LEN
    while num:
        num, rem = divmod(num, base)
        arr.append(BASE62_ALPHABET[rem])
    arr.reverse()
    return "".join(arr)


def decode_base62(code: str) -> int:
    """Decode a Base62 string back into its original integer ID."""
    num = 0
    for char in code:
        num = num * BASE62_LEN + BASE62_ALPHABET.index(char)
    return num
