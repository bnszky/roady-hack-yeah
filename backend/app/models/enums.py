from enum import StrEnum


class CategoryStatus(StrEnum):
    APPROVED = "approved"
    PENDING = "pending"
    REJECTED = "rejected"


class ProblemStatus(StrEnum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    REJECTED = "rejected"


class ReportSource(StrEnum):
    FORM = "form"
    VOICE = "voice"
    PROXIMITY_PROMPT = "proximity_prompt"
