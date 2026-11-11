import pytest
from unittest.mock import patch
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.services.shortcode import (
    generate_base62_code,
    encode_base62,
    decode_base62,
    BASE62_ALPHABET
)
from app.services.url_service import create_short_url
from app.models.url import URL


def test_base62_character_set_and_length():
    code = generate_base62_code(7)
    assert len(code) == 7
    for char in code:
        assert char in BASE62_ALPHABET


def test_base62_integer_encoding_and_decoding():
    test_numbers = [0, 1, 61, 62, 1000, 3844, 999999999]
    for num in test_numbers:
        encoded = encode_base62(num)
        decoded = decode_base62(encoded)
        assert decoded == num


def test_collision_retry_loop_success_after_retries(db_session: Session):
    """
    Test bounded collision resolution:
    Simulate that the first two candidates already exist in the database (causing IntegrityError),
    and on the 3rd attempt a unique code succeeds.
    """
    # Pre-populate two existing codes
    existing1 = URL(original_url="https://a.com", short_code="collis1")
    existing2 = URL(original_url="https://b.com", short_code="collis2")
    db_session.add_all([existing1, existing2])
    db_session.commit()

    generated_sequence = ["collis1", "collis2", "uniq003"]

    with patch("app.services.url_service.generate_base62_code", side_effect=generated_sequence):
        new_url = create_short_url(
            db=db_session,
            original_url="https://success-after-retries.com",
            user_id=None
        )
        assert new_url.short_code == "uniq003"
        assert new_url.original_url == "https://success-after-retries.com"


def test_collision_retry_loop_exhaustion_raises_500(db_session: Session):
    """
    Test when all retry attempts fail due to collision, HTTP 500 is cleanly returned.
    """
    existing = URL(original_url="https://dup.com", short_code="always_collides")
    db_session.add(existing)
    db_session.commit()

    with patch("app.services.url_service.generate_base62_code", return_value="always_collides"):
        with pytest.raises(HTTPException) as exc_info:
            create_short_url(
                db=db_session,
                original_url="https://fail.com",
                user_id=None
            )
        assert exc_info.value.status_code == 500
        assert "Failed to generate a unique short code" in exc_info.value.detail
