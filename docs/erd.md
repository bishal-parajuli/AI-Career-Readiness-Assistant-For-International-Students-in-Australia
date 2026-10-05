# Entity Relationship Diagram

This ERD represents the current database implementation of the AI Career Readiness Assistant. It contains nine entities and reflects the implemented MariaDB schema following the documented scope evolution and prototype refinement.

## Current ERD
```mermaid
erDiagram

    USER {
        INT user_id PK
        VARCHAR email UK
        VARCHAR password_hash
        DATETIME created_at
    }

    RESUME {
        INT resume_id PK
        INT user_id FK
        VARCHAR input_method
        VARCHAR file_name
        TEXT resume_text
        VARCHAR target_role
        DATETIME uploaded_at
    }

    RESUME_FEEDBACK {
        INT feedback_id PK
        INT resume_id FK
        VARCHAR feedback_category
        VARCHAR feedback_type
        TEXT feedback_text
        VARCHAR priority
        DATETIME generated_at
    }

    INTERVIEW_SESSION {
        INT session_id PK
        INT user_id FK
        VARCHAR target_role
        VARCHAR industry
        VARCHAR interview_type
        VARCHAR difficulty_level
        INT question_count
        BOOLEAN use_career_profile
        DATETIME started_at
        DATETIME completed_at
        VARCHAR session_status
    }

    INTERVIEW_QUESTION {
        INT question_id PK
        INT session_id FK
        VARCHAR question_type
        TEXT question_text
        TEXT guidance_text
        TEXT sample_answer
        INT question_order
        DATETIME generated_at
    }

    INTERVIEW_RESPONSE {
        INT response_id PK
        INT question_id FK,UK
        TEXT response_text
        DATETIME submitted_at
    }

    INTERVIEW_FEEDBACK {
        INT interview_feedback_id PK
        INT session_id FK
        VARCHAR feedback_type
        TEXT feedback_text
        DATETIME generated_at
    }

    JOB_ADVERTISEMENT {
        INT job_ad_id PK
        INT user_id FK
        VARCHAR input_method
        TEXT job_url
        TEXT job_ad_text
        VARCHAR job_title
        VARCHAR company_name
        DATETIME created_at
    }

    JOB_MATCH_ANALYSIS {
        INT analysis_id PK
        INT job_ad_id FK
        INT resume_id FK
        DECIMAL match_score
        VARCHAR analysis_type
        TEXT analysis_text
        DATETIME generated_at
    }

    USER ||--o{ RESUME : submits
    RESUME ||--o{ RESUME_FEEDBACK : receives

    USER ||--o{ INTERVIEW_SESSION : starts
    INTERVIEW_SESSION ||--|{ INTERVIEW_QUESTION : contains
    INTERVIEW_QUESTION ||--o| INTERVIEW_RESPONSE : receives
    INTERVIEW_SESSION ||--o{ INTERVIEW_FEEDBACK : receives

    USER ||--o{ JOB_ADVERTISEMENT : provides
    JOB_ADVERTISEMENT ||--o{ JOB_MATCH_ANALYSIS : produces
    RESUME ||--o{ JOB_MATCH_ANALYSIS : used_in
```
## Relationship Summary

- One user can submit many resumes.
- One resume can receive many resume feedback records.
- One user can start many interview sessions.
- Each interview session contains one or more interview questions.
- Each interview question can have zero or one interview response.
- One interview session can receive many interview feedback records.
- One user can provide many job advertisements.
- One job advertisement can produce many job match analysis records.
- One resume can be used in many job match analyses.

The `INTERVIEW_RESPONSE.question_id` field is constrained as unique in the database, enforcing the zero-or-one response per interview question relationship.

The Job Advertisement and Job Match Analysis entities represent the lecturer-requested scope evolution reflected in the current prototype. The platform does not automatically retrieve SEEK content; job advertisement information is user supplied.