from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.url import URL


def test_create_short_url_authenticated(client: TestClient, auth_headers: dict, verified_user: User):
    resp = client.post(
        "/api/v1/urls",
        headers=auth_headers,
        json={"original_url": "https://example.com/very/long/path/to/resource"}
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "short_code" in data
    assert len(data["short_code"]) == 7
    assert data["original_url"] == "https://example.com/very/long/path/to/resource"
    assert data["user_id"] == verified_user.id
    assert data["click_count"] == 0
    assert "/r/" in data["short_url"]


def test_create_short_url_custom_alias(client: TestClient, auth_headers: dict):
    resp = client.post(
        "/api/v1/urls",
        headers=auth_headers,
        json={
            "original_url": "https://example.com/custom-test",
            "custom_alias": "my-custom-slug"
        }
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["short_code"] == "my-custom-slug"

    # Attempting duplicate alias should fail with 409
    dup_resp = client.post(
        "/api/v1/urls",
        headers=auth_headers,
        json={
            "original_url": "https://example.com/another",
            "custom_alias": "my-custom-slug"
        }
    )
    assert dup_resp.status_code == 409
    assert "already in use" in dup_resp.json()["detail"]


def test_invalid_urls_rejected(client: TestClient, auth_headers: dict):
    # Javascript scheme
    resp1 = client.post(
        "/api/v1/urls",
        headers=auth_headers,
        json={"original_url": "javascript:alert(1)"}
    )
    assert resp1.status_code == 422

    # FTP scheme
    resp2 = client.post(
        "/api/v1/urls",
        headers=auth_headers,
        json={"original_url": "ftp://files.example.com"}
    )
    assert resp2.status_code == 422


def test_public_shorten_hero_section(client: TestClient):
    resp = client.post(
        "/api/v1/urls/public",
        json={"original_url": "https://news.ycombinator.com"}
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["user_id"] is None
    assert len(data["short_code"]) == 7


def test_strict_cross_user_isolation(
    client: TestClient,
    auth_headers: dict,
    auth_headers_user_two: dict,
    verified_user: User,
    user_two: User
):
    # User A creates a URL
    create_resp = client.post(
        "/api/v1/urls",
        headers=auth_headers,
        json={"original_url": "https://private-user-a.com/doc"}
    )
    url_id = create_resp.json()["id"]

    # User B lists URLs: should NOT see User A's URL
    list_b = client.get("/api/v1/urls", headers=auth_headers_user_two)
    assert list_b.status_code == 200
    ids_b = [item["id"] for item in list_b.json()["items"]]
    assert url_id not in ids_b

    # User B attempts to access User A's URL directly: should be 404
    get_b = client.get(f"/api/v1/urls/{url_id}", headers=auth_headers_user_two)
    assert get_b.status_code == 404

    # User B attempts to delete User A's URL: should be 404
    del_b = client.delete(f"/api/v1/urls/{url_id}", headers=auth_headers_user_two)
    assert del_b.status_code == 404

    # User A CAN delete their own URL
    del_a = client.delete(f"/api/v1/urls/{url_id}", headers=auth_headers)
    assert del_a.status_code == 200
    assert del_a.json()["success"] is True
