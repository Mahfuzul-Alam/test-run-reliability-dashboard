from datetime import datetime, timezone
import re
from typing import Dict, List, Optional, Tuple
import uuid
import defusedxml.ElementTree as ET
from defusedxml.common import DefusedXmlException

from app.models import NormalizedTestRun, TestCaseResult, TestCaseStatus, TestRunSummary

MAX_MESSAGE_LENGTH = 500


def sanitize_message(msg: Optional[str]) -> Optional[str]:
    if not msg:
        return None
    cleaned = msg.strip()
    if len(cleaned) > MAX_MESSAGE_LENGTH:
        return cleaned[:MAX_MESSAGE_LENGTH] + "... [truncated]"
    return cleaned


def parse_float_safe(value: Optional[str], default: float = 0.0) -> float:
    if not value:
        return default
    try:
        val = float(value.strip())
        return max(0.0, val)
    except (ValueError, TypeError):
        return default


def parse_junit_xml(xml_bytes: bytes, filename: Optional[str] = None) -> NormalizedTestRun:
    """
    Parses a JUnit XML report safely using defusedxml.
    Supports either <testsuites> or <testsuite> root elements.
    Returns NormalizedTestRun with computed summaries and safe test results.
    """
    try:
        root = ET.fromstring(xml_bytes)
    except (ET.ParseError, DefusedXmlException, UnicodeDecodeError) as exc:
        raise ValueError(f"Invalid or malformed JUnit XML document: {str(exc)}")

    tag = root.tag.lower()
    if tag not in ("testsuites", "testsuite"):
        raise ValueError(
            f"Unsupported root element <{root.tag}>. Expected <testsuites> or <testsuite>."
        )

    # Determine list of testsuite elements
    testsuites: List[ET.Element] = []
    if tag == "testsuite":
        testsuites.append(root)
    else:
        # root is <testsuites>
        suites = root.findall("testsuite")
        if suites:
            testsuites.extend(suites)
        else:
            # Check for direct testcases under testsuites or nested
            suites_nested = root.iter("testsuite")
            testsuites.extend(list(suites_nested))

    run_name = filename or root.get("name") or "Test Run"
    # Clean filename of extension for cleaner display name
    clean_name = re.sub(r"\.(xml|junit)$", "", run_name, flags=re.IGNORECASE)

    raw_timestamp = root.get("timestamp")
    timestamp = datetime.now(timezone.utc).isoformat()
    if raw_timestamp:
        try:
            # Validate ISO timestamp or date
            ts_str = raw_timestamp.strip()
            # If valid, format cleanly
            timestamp = ts_str
        except Exception:
            pass

    test_cases: List[TestCaseResult] = []
    seen_ids: Dict[str, int] = {}

    total_passed = 0
    total_failed = 0
    total_errored = 0
    total_skipped = 0
    calculated_duration = 0.0

    for suite in testsuites:
        suite_name = suite.get("name") or "default_suite"

        for case in suite.findall("testcase"):
            raw_name = (case.get("name") or "unnamed_test").strip()
            raw_classname = (case.get("classname") or suite_name or "default_class").strip()

            base_id = f"{raw_classname}#{raw_name}"
            seen_ids[base_id] = seen_ids.get(base_id, 0) + 1
            if seen_ids[base_id] > 1:
                test_id = f"{base_id}#dup{seen_ids[base_id]}"
            else:
                test_id = base_id

            duration = parse_float_safe(case.get("time"), 0.0)
            calculated_duration += duration

            status: TestCaseStatus = "passed"
            message: Optional[str] = None
            failure_type: Optional[str] = None

            error_node = case.find("error")
            failure_node = case.find("failure")
            skipped_node = case.find("skipped")

            if error_node is not None:
                status = "errored"
                total_errored += 1
                failure_type = error_node.get("type")
                message = sanitize_message(error_node.get("message") or error_node.text)
            elif failure_node is not None:
                status = "failed"
                total_failed += 1
                failure_type = failure_node.get("type")
                message = sanitize_message(failure_node.get("message") or failure_node.text)
            elif skipped_node is not None:
                status = "skipped"
                total_skipped += 1
                message = sanitize_message(skipped_node.get("message") or skipped_node.text)
            else:
                status = "passed"
                total_passed += 1

            test_cases.append(
                TestCaseResult(
                    id=test_id,
                    name=raw_name,
                    classname=raw_classname,
                    suite_name=suite_name,
                    status=status,
                    duration_seconds=round(duration, 4),
                    message=message,
                    failure_type=failure_type,
                )
            )

    total_tests = len(test_cases)
    # Check if root had time attribute, else use calculated sum
    root_time = parse_float_safe(root.get("time"), calculated_duration)
    total_duration = round(root_time if root_time > 0 else calculated_duration, 4)

    summary = TestRunSummary(
        total=total_tests,
        passed=total_passed,
        failed=total_failed,
        errored=total_errored,
        skipped=total_skipped,
        duration_seconds=total_duration,
    )

    return NormalizedTestRun(
        run_id=str(uuid.uuid4()),
        run_name=clean_name,
        timestamp=timestamp,
        summary=summary,
        test_cases=test_cases,
    )
