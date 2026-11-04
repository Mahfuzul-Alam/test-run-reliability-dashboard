import pytest
from app.parser import parse_junit_xml, parse_float_safe, sanitize_message

SAMPLE_SINGLE_SUITE = b"""<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="AuthSuite" tests="3" failures="1" errors="0" skipped="1" time="1.25">
    <testcase classname="com.runlens.AuthTests" name="testLoginSuccess" time="0.45" />
    <testcase classname="com.runlens.AuthTests" name="testLoginFailure" time="0.55">
        <failure message="Invalid credentials" type="AssertionError">Expected 200 but received 401</failure>
    </testcase>
    <testcase classname="com.runlens.AuthTests" name="testOAuthPending" time="0.25">
        <skipped message="OAuth provider disabled in test environment" />
    </testcase>
</testsuite>
"""

SAMPLE_MULTI_SUITES = b"""<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="AllTests" time="3.50">
    <testsuite name="CheckoutSuite" tests="2">
        <testcase classname="com.runlens.Checkout" name="testCartAdd" time="0.80" />
        <testcase classname="com.runlens.Checkout" name="testPaymentTimeout" time="2.10">
            <error message="Gateway connection timed out" type="TimeoutError">Socket timeout</error>
        </testcase>
    </testsuite>
    <testsuite name="InventorySuite" tests="1">
        <testcase classname="com.runlens.Inventory" name="testStockLevel" time="0.60" />
    </testsuite>
</testsuites>
"""

SAMPLE_DUPLICATE_CASES = b"""<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="ParamSuite" tests="2">
    <testcase classname="com.runlens.ParamTest" name="testValidateInput" time="0.10" />
    <testcase classname="com.runlens.ParamTest" name="testValidateInput" time="0.12">
        <failure message="Validation failed on second input" />
    </testcase>
</testsuite>
"""


def test_parse_single_suite():
    result = parse_junit_xml(SAMPLE_SINGLE_SUITE, "auth-report.xml")
    assert result.run_name == "auth-report"
    assert result.summary.total == 3
    assert result.summary.passed == 1
    assert result.summary.failed == 1
    assert result.summary.errored == 0
    assert result.summary.skipped == 1
    assert result.summary.duration_seconds == 1.25
    assert len(result.test_cases) == 3

    failed_case = next(tc for tc in result.test_cases if tc.name == "testLoginFailure")
    assert failed_case.status == "failed"
    assert failed_case.failure_type == "AssertionError"
    assert "Invalid credentials" in failed_case.message


def test_parse_multi_suites():
    result = parse_junit_xml(SAMPLE_MULTI_SUITES, "all-tests.xml")
    assert result.summary.total == 3
    assert result.summary.passed == 2
    assert result.summary.errored == 1
    assert result.summary.duration_seconds == 3.50

    errored_case = next(tc for tc in result.test_cases if tc.status == "errored")
    assert errored_case.failure_type == "TimeoutError"
    assert "Gateway connection timed out" in errored_case.message


def test_parse_duplicate_testcases():
    result = parse_junit_xml(SAMPLE_DUPLICATE_CASES, "param-report.xml")
    assert result.summary.total == 2
    ids = [tc.id for tc in result.test_cases]
    assert "com.runlens.ParamTest#testValidateInput" in ids
    assert "com.runlens.ParamTest#testValidateInput#dup2" in ids


def test_parse_malformed_xml():
    with pytest.raises(ValueError, match="Invalid or malformed JUnit XML document"):
        parse_junit_xml(b"<not closed", "broken.xml")


def test_parse_unsupported_root():
    with pytest.raises(ValueError, match="Unsupported root element"):
        parse_junit_xml(b"<configuration><prop>1</prop></configuration>", "config.xml")


def test_parse_float_safe():
    assert parse_float_safe("1.25") == 1.25
    assert parse_float_safe("-0.5") == 0.0
    assert parse_float_safe("invalid", 2.0) == 2.0
    assert parse_float_safe(None, 0.0) == 0.0


def test_sanitize_message():
    assert sanitize_message(None) is None
    short_msg = "All good"
    assert sanitize_message(short_msg) == "All good"
    long_msg = "X" * 600
    sanitized = sanitize_message(long_msg)
    assert len(sanitized) < 520
    assert sanitized.endswith("... [truncated]")
