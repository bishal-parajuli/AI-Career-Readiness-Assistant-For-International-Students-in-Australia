"""
AI Career Readiness Assistant — Startup MVP
Code skeleton for Part B development.

This file outlines the intended structure of the three core modules
(resume feedback, interview preparation, responsible AI safeguards).
No functionality has been implemented yet — this is a Part A planning
artefact, to be built out from Part B Week 3 onward per the WBS
(Project Proposal, Section 9.1).
"""

def get_resume_feedback(resume_text: str) -> dict:
    """
    Generate AI-based feedback on an uploaded resume.
    Planned for Sprint 1 (Part B Weeks 3-4).

    Args:
        resume_text: raw text extracted from the user's uploaded resume

    Returns:
        dict containing structured feedback (formatting, keywords, alignment
        with Australian employer expectations)
    """
    raise NotImplementedError("Planned for Sprint 1 — see WBS 2.2")


def generate_interview_questions(job_description: str) -> list:
    """
    Generate tailored interview practice questions based on a job description.
    Planned for Sprint 2 (Part B Weeks 5-6).

    Args:
        job_description: text of the job the user is preparing for

    Returns:
        list of interview questions relevant to the role
    """
    raise NotImplementedError("Planned for Sprint 2 — see WBS 2.3")


def apply_responsible_ai_checks(output: dict) -> dict:
    """
    Apply fairness, transparency and human-oversight safeguards to any
    AI-generated output before it is shown to the user, aligned to the
    NIST AI Risk Management Framework.
    Planned for Sprint 3 (Part B Weeks 7-8).

    Args:
        output: raw AI-generated content (resume feedback or interview questions)

    Returns:
        dict with safeguards applied (disclaimers, bias flags, verification notes)
    """
    raise NotImplementedError("Planned for Sprint 3 — see WBS 2.5")


if __name__ == "__main__":
    print("AI Career Readiness Assistant — MVP skeleton. Development begins Part B Week 3.")
