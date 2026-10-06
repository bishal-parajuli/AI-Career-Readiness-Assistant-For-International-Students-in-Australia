# AI Career Readiness Assistant — For International Students in Australia

*An AI-assisted career preparation platform providing resume feedback and interview preparation for international students in Australia.*

## Project Status

**PROF910 IT Project Part B — MVP Development**

The project has progressed from design and modelling into active MVP implementation. The current system includes a React frontend, PHP backend API, MariaDB relational database and backend OpenAI API integration. Working vertical slices support user registration, login credential verification, resume submission, AI-generated resume feedback, interview session creation, AI-generated interview questions, interview response persistence, interview session lifecycle tracking and personalised AI-generated interview feedback.

The OpenAI integration is implemented through the PHP backend rather than directly from the browser. AI-generated results are validated before being displayed or persisted, and the application displays an error rather than fabricating feedback when the AI service is unavailable.

## The Problem

International students in Australia can face challenges when preparing for graduate employment, including unfamiliarity with Australian recruitment practices, resume conventions, interview expectations and limited access to personalised career guidance.

Existing digital career-support tools often provide isolated functions rather than an integrated career-preparation experience.

## The Solution

The project develops a web-based Career Readiness Assistant designed for international students in Australia.

The core MVP focuses on:

- AI-assisted resume feedback
- AI-assisted interview preparation
- Responsible AI safeguards and transparent user guidance

Following lecturer feedback and prototype development, the interface also includes job advertisement comparison. Users provide job advertisement information for comparison with resume information. The current system does not automatically retrieve job advertisements from SEEK.

## Current Implementation

The Week 5 application foundation currently includes:

- React-based user interface derived from the approved prototype
- PHP backend API
- MariaDB relational database
- Nine-entity database schema based on the revised ERD
- Backend-to-database connection using PDO prepared statements
- Backend health-check endpoint with database connectivity verification
- User registration with server-side validation and password hashing
- Login credential verification using stored password hashes
- User preferred names are persisted in the database and retrieved during login
- Edit Profile is connected to the backend, allowing users to persistently update their preferred name and email address
- Change Password is connected to the backend with current-password verification and secure password hashing
- Resume text submission persisted through the frontend → backend → database flow
- Live AI-generated resume feedback through the backend OpenAI API integration
- AI resume feedback is validated before persistence and display
- Unavailable or invalid AI responses are handled safely without fabricating resume feedback
- Interview session creation persisted to the database
- Interview questions persisted against their corresponding interview session
- Live AI-generated interview questions based on the selected target role, industry, interview type and difficulty
- Interview responses persisted against the correct interview question
- Skipped interview questions intentionally create no response record
- Interview sessions distinguish normal completion (`completed`) from deliberate early termination (`ended_early`)
- Interview completion timestamps are persisted in the database
- Personalised AI-generated interview feedback analyses submitted responses after session completion or deliberate early termination
- Interview feedback is validated and persisted to the database before being displayed to the user
- Sessions with no submitted responses do not generate personalised AI feedback
- AI interview failures display an error rather than fabricated feedback
- Saved resumes are retrieved from the database for job advertisement comparison
- Job advertisements submitted through the frontend are persisted to the database
- Job advertisement analysis requests validate ownership of both the selected resume and job advertisement
- Unavailable AI job-match analysis is handled safely without storing or displaying fabricated match results
- Environment variables and secrets excluded from version control, with `.env.example` provided
- Git/GitHub version control with incremental implementation commits
- My Progress retrieves persisted resume and interview activity from the database
- Logout clears the authenticated user state from the frontend

Persistent authenticated sessions or token-based authentication have not yet been implemented.

Interview questions are generated through the backend OpenAI API integration using the user's selected target role, industry, interview type and difficulty. Submitted interview responses can be analysed to generate personalised feedback after the session ends. AI-generated results are clearly identified, and the application does not fabricate results when the external AI service is unavailable.
## Technology Stack

### Frontend
- React 19
- TypeScript 5.7
- Tailwind CSS 4
- Vite 8

### Backend
- PHP 8.3

### Database
- MariaDB 10.4 (MySQL-compatible)
- PDO with `pdo_mysql`

### Generative AI Service
- OpenAI API

### Development Tools
- Visual Studio Code
- Node.js 24.21.0
- npm 11.19.0
- XAMPP
- Git
- GitHub

A detailed technology selection rationale is available in [`docs/technology-stack-justification.md`](./docs/technology-stack-justification.md).

## System Architecture

The current architecture follows a client-server structure:

**International Student → React Frontend → PHP Backend/API → MariaDB**

**PHP Backend/API → OpenAI API** for AI-powered resume feedback, interview question generation and personalised interview feedback.

The OpenAI API integration connects through the PHP backend rather than directly from the browser. Resume content and interview-practice data required for AI-powered features are sent through the backend for processing, while the API key remains server-side and is excluded from version control.

See [`docs/system-architecture.md`](./docs/system-architecture.md) for the editable architecture diagram and implementation notes.

## Repository Structure
```text

.
├── backend/
│   ├── api/
│   │   ├── health.php
│   │   ├── register.php
│   │   ├── login.php
│   │   ├── resume.php
│   │   ├── resume-feedback.php
│   │   ├── interview-session.php
│   │   ├── interview-questions.php
│   │   ├── interview-response.php
│   │   ├── interview-complete.php
│   │   ├── interview-feedback.php
│   │   ├── user-resumes.php
│   │   ├── job-advertisement.php
│   │   └── job-match-analysis.php
│   ├── config/
│   │   └── database.php
│   └── .env.example
├── database/
│   └── schema.sql
├── docs/
│   ├── erd.md
│   ├── schema-changes.md
│   ├── system-architecture.md
│   └── technology-stack-justification.md
├── frontend/
├── images/
├── src/
└── tests/
```

## Local Development Setup

### Prerequisites

Install or configure:

- Node.js
- npm
- PHP with PDO MySQL support
- MariaDB/MySQL-compatible database server
- Git

The current local implementation uses XAMPP MariaDB.

### 1. Clone the Repository

```bash
git clone https://github.com/bishal-parajuli/AI-Career-Readiness-Assistant-For-International-Students-in-Australia.git

cd AI-Career-Readiness-Assistant-For-International-Students-in-Australia
```

### 2. Configure Backend Environment Variables

Create the local backend environment file from the provided example:

```bash
cp backend/.env.example backend/.env
```

Configure the values for your local database environment.

Example:

```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=ai_career_readiness
DB_USER=your_database_user
DB_PASSWORD=your_database_password
```

Do not commit `backend/.env` or real credentials to GitHub.

### 3. Create the Database

Create a database named:

```text
ai_career_readiness
```

Import the checked-in schema:

```bash
mysql -h 127.0.0.1 -P 3307 -u YOUR_DATABASE_USER -p ai_career_readiness < database/schema.sql
```

The local XAMPP development environment currently uses MariaDB on port `3307`. Adjust the command for your own environment where necessary.

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 5. Start the PHP Backend

From the repository root:

```bash
php -S localhost:8000 -t backend
```

The backend health endpoint can then be checked at:

```text
http://localhost:8000/api/health.php
```

A successful response reports that the backend is running and the database is connected.

### 6. Start the React Frontend

In another terminal:

```bash
cd frontend
npm run dev
```

Open the Local URL displayed by Vite in the browser.

The current local development configuration uses port `8443`.

## Database

The revised implementation contains nine entities:

1. User
2. Resume
3. Resume Feedback
4. Interview Session
5. Interview Question
6. Interview Response
7. Interview Feedback
8. Job Advertisement
9. Job Match Analysis

The SQL schema is version-controlled in [`database/schema.sql`](./database/schema.sql).

Database-model changes from the earlier ERD are documented in [`docs/schema-changes.md`](./docs/schema-changes.md).

## Security and Privacy

Current implementation controls include:

- Passwords are hashed rather than stored as plaintext.
- SQL database operations use PDO prepared statements.
- Database credentials are stored in a local `.env` file excluded from Git.
- `.env.example` contains placeholders rather than real credentials.
- The frontend communicates with backend API endpoints rather than connecting directly to the database.
- AI-generated outputs are presented as career-preparation guidance rather than guaranteed employment outcomes.

The current authentication implementation verifies credentials but does not yet provide persistent authenticated sessions or tokens. Authentication security will be strengthened as development progresses.

## Responsible AI

The project treats responsible AI as a governance and safeguard layer rather than a separate career-support function.

The design considers:

- transparency of AI-generated feedback
- potential bias and inaccurate recommendations
- privacy and data minimisation
- human review of AI-generated advice
- clear communication that the platform does not guarantee employment outcomes

The project draws on the Australian Privacy Principles, Australian AI Ethics Principles and NIST AI Risk Management Framework.

## Project Plan

Key implementation milestones include:

- Week 5 — Architecture, technology stack, database foundation and application skeleton
- Week 6 — Working MVP development
- Week 8 — Usability testing
- Week 10 — Final evaluation and recommendations

[View the GitHub Project Board](https://github.com/users/bishal-parajuli/projects/1)

## Development Documentation

- [Technology Stack Justification](./docs/technology-stack-justification.md)
- [System Architecture](./docs/system-architecture.md)
- [Database Schema Changes](./docs/schema-changes.md)
- [Database Schema](./database/schema.sql)

## AI Use Disclosure

AI tools have been used to assist with activities such as prototype generation, development guidance, code review, debugging, documentation structure and quality checking. AI-assisted outputs are reviewed and tested before being incorporated into the project.

The frontend prototype was generated with Figma Make and subsequently integrated with the project's backend and database implementation.

## Contact

Bishal Parajuli

## Acknowledgements

Thanks to the academic teaching and supervision team for feedback and guidance throughout the project.
