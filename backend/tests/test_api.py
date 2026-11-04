from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

SAMPLE_XML = """<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="ApiSuite" tests="2" failures="0" errors="0" skipped="0" time="0.85">
    <testcase classname="com.runlens.Api" name="testHealth" time="0.25" />
    <testcase classname="com.runlens.Api" name="testCreate" time="0.60" />
</testsuite>
"""


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "runlens-api"


def test_analyze_valid_report():
    files = {"file": ("junit-report.xml", SAMPLE_XML.encode("utf-8"), "application/xml")}
    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["run_name"] == "junit-report"
    assert data["summary"]["total"] == 2
    assert data["summary"]["passed"] == 2
    assert len(data["test_cases"]) == 2


def test_analyze_malformed_xml():
    files = {"file": ("broken.xml", b"<unclosed>", "application/xml")}
    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 400
    assert "Invalid or malformed JUnit XML document" in response.json()["detail"]


def test_analyze_empty_file():
    files = {"file": ("empty.xml", b"", "application/xml")}
    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 400
    assert "Uploaded file is empty" in response.json()["detail"]


def test_analyze_invalid_extension():
    files = {"file": ("report.pdf", b"%PDF-1.4", "application/pdf")}
    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 400
    assert "Invalid file format" in response.json()["detail"]


def test_analyze_oversized_file():
    huge_data = b"<testsuite>" + (b" " * (2 * 1024 * 1024 + 10)) + b"</testsuite>"
    files = {"file": ("huge.xml", huge_data, "application/xml")}
    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 413
    assert "File size exceeds the 2 MB limit" in response.json()["detail"]
