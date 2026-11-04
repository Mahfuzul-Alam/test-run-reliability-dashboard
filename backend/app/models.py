from typing import List, Literal, Optional
from pydantic import BaseModel, Field

TestCaseStatus = Literal["passed", "failed", "errored", "skipped"]


class TestCaseResult(BaseModel):
    id: str = Field(description="Unique stable identifier for the test case (classname#name)")
    name: str = Field(description="Test case name")
    classname: str = Field(description="Class or package name")
    suite_name: str = Field(description="Enclosing testsuite name")
    status: TestCaseStatus = Field(description="Outcome status of the test case")
    duration_seconds: float = Field(default=0.0, ge=0.0, description="Test execution duration in seconds")
    message: Optional[str] = Field(default=None, description="Failure, error, or skip message (truncated if long)")
    failure_type: Optional[str] = Field(default=None, description="Failure or error exception/type")


class TestRunSummary(BaseModel):
    total: int = Field(default=0, ge=0)
    passed: int = Field(default=0, ge=0)
    failed: int = Field(default=0, ge=0)
    errored: int = Field(default=0, ge=0)
    skipped: int = Field(default=0, ge=0)
    duration_seconds: float = Field(default=0.0, ge=0.0)


class NormalizedTestRun(BaseModel):
    run_id: str = Field(description="Unique run identifier (UUID)")
    run_name: str = Field(description="Human-readable run name or filename")
    timestamp: str = Field(description="ISO-8601 timestamp of the test run")
    summary: TestRunSummary
    test_cases: List[TestCaseResult]
