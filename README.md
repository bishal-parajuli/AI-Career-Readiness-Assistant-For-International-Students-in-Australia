# AI Career Readiness Assistant — For International Students in Australia

*An AI-assisted career preparation platform providing resume feedback and interview preparation for international students in Australia.*

## Project Status

**PROF910 IT Project Part B — MVP Development**

The project has progressed from design and modelling into implementation. The current application skeleton includes a React frontend, PHP backend API, MariaDB relational database, user registration and login credential verification.

Generative AI functionality is planned for subsequent development and should not yet be considered a live OpenAI API integration.

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
- Backend-to-database connection using PDO
- Backend health-check endpoint
- User registration with server-side validation and password hashing
- Login credential verification using stored password hashes
- Real frontend → backend → database registration flow
- Real frontend → backend credential-verification flow
- Environment variables excluded from version control
- Git/GitHub version control

Persistent authenticated sessions or token-based authentication have not yet been implemented.

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

### Planned Generative AI Service
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

A future OpenAI API integration will connect through the backend rather than directly from the browser.

See [`docs/system-architecture.md`](./docs/system-architecture.md) for the editable architecture diagram and implementation notes.

## Repository Structure

```text
.
├── backend/
│   ├── api/
│   │   ├── health.php
│   │   ├── login.php
│   │   └── register.php
│   ├── config/
│   │   └── database.php
│   └── .env.example
├── database/
│   └── schema.sql
├── docs/
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
mysql -u YOUR_DATABASE_USER -p ai_career_readiness < database/schema.sql
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
