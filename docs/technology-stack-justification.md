# Technology Stack Justification

## Frontend

**Chosen technology:** React 19 with TypeScript 5.7, Tailwind CSS 4 and Vite 8.

**Alternative considered:** Traditional HTML, CSS and JavaScript.

**Justification:** React was selected because the Career Readiness Assistant requires an interactive interface containing multiple application states, including account access, resume feedback, interview preparation and job advertisement comparison. React's component-based structure supports reusable interface elements and allows the approved prototype to be progressively connected to backend functionality. TypeScript provides additional type checking during development, while Tailwind CSS supports consistent interface styling. Vite provides a lightweight development and production build environment. The existing Figma prototype was exported as a React-based application, making this stack a practical fit for the MVP.

**Accepted risk:** The frontend stack introduces additional dependencies and build tooling compared with plain HTML, CSS and JavaScript. Dependency versions therefore need to be maintained and tested throughout development.

## Backend

**Chosen technology:** PHP 8.3.

**Alternative considered:** Node.js with Express.

**Justification:** PHP provides a lightweight server-side environment suitable for implementing the MVP's REST-style API endpoints and database operations. The current backend successfully provides database connectivity, health checking, user registration and credential verification. PHP also integrates directly with PDO and the MySQL-compatible database environment used by the project.

**Accepted risk:** The current backend is intentionally lightweight and does not yet provide complete production authentication infrastructure such as persistent authenticated sessions. Security controls will need to be strengthened as the MVP progresses.

## Database

**Chosen technology:** MariaDB 10.4 using a MySQL-compatible relational database environment.

**Alternative considered:** MongoDB.

**Justification:** A relational database was selected because the project ERD contains clearly defined entities and relationships involving users, resumes, feedback, interview sessions, questions, responses, job advertisements and analyses. MariaDB supports primary keys, foreign keys, uniqueness constraints and referential integrity required by this model. It also provides SQL-based querying and integrates with PHP through PDO.

**Accepted risk:** The local development database is currently dependent on the XAMPP environment and configuration. Deployment will require database configuration appropriate to the production environment.

## Generative AI Service

**Chosen technology:** OpenAI API (planned integration).

**Alternative considered:** Locally hosted language model.

**Justification:** The OpenAI API is planned to support the generative functions of the MVP, including resume feedback and interview preparation. An external API reduces the infrastructure required to host and maintain a large language model locally and supports rapid MVP development.

**Accepted risk:** External AI services introduce cost, availability, privacy and output-reliability considerations. AI-generated outputs therefore require responsible-AI safeguards, transparent user notices and appropriate handling of user data. The OpenAI integration should not be described as operational until the live API connection has been implemented and tested.

## Development and Version Control

**Chosen technology:** Visual Studio Code, Node.js 24.21.0, npm 11.19.0, XAMPP and Git/GitHub.

**Alternative considered:** Development without a shared version-controlled repository.

**Justification:** The selected tools provide a reproducible local development environment while Git and GitHub maintain version history and provide a shared record of implementation progress. Environment-specific credentials are stored outside version control using a `.env` file, while `.env.example` documents the required configuration without exposing credentials.

**Accepted risk:** Differences between local development and future deployment environments may create configuration issues. Setup instructions, dependency versions and environment variables therefore need to be documented and tested.
