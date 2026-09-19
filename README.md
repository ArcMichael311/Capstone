# Group Capstone = Phonexis

Phonexis is a web-based phonics learning platform for students, teachers, and administrators. It combines guided literacy modules, interactive pronunciation practice, assessments, progress tracking, classroom management, and learning-material sharing in one application.

## Project Status

This is an active capstone project intended for local development, demonstration, and continued feature expansion. The application supports local development with an embedded H2 database and deployment with a Supabase PostgreSQL database and Supabase services.

## Core Idea

The platform allows:

- students to practice alphabet recognition, vowels, consonants, and CVC words
- students to use interactive games, videos, audio, and voice-practice activities
- students to complete pretests and track their learning progress
- teachers to create classes and manage student rosters
- teachers to share learning materials and create pretests with recorded audio
- administrators to manage student and teacher accounts
- authenticated users to access role-specific workspaces

## Tech Stack

### Backend

- Java 17
- Spring Boot 4.0.6
- Maven
- Spring Web MVC
- Spring Data JPA and Hibernate
- Spring Security Crypto for password hashing
- PostgreSQL through Supabase in deployment
- H2 for the default local development database
- Supabase Storage for learning materials and pretest audio
- Docker-ready deployment configuration

### Web App

- React 19
- Create React App and `react-scripts`
- Supabase JavaScript client
- React Testing Library
- Browser speech and media APIs for phonics activities and voice practice

## Repository Structure

```text
Capstone/
├── backend/                         # Spring Boot API
│   ├── src/main/java/com/phonexis/backend/
│   │   ├── Config/                  # CORS and application configuration
│   │   ├── Controller/              # REST API endpoints
│   │   ├── Entity/                  # JPA entities
│   │   ├── Repository/              # Database repositories
│   │   └── Service/                 # Application and Supabase services
│   ├── src/main/resources/          # Spring configuration
│   ├── src/test/                    # Backend tests
│   ├── sql/                         # Database maintenance scripts
│   ├── Dockerfile
│   ├── pom.xml
│   └── mvnw.cmd
├── Web/phonexis/                    # React web client
│   ├── public/                      # Static assets and learning media
│   ├── src/
│   │   ├── components/              # Auth, dashboard, modules, teacher, and admin UI
│   │   ├── context/                 # Authentication context
│   │   ├── lib/                     # Supabase, backend, and voice utilities
│   │   └── router/                  # Client-side route state
│   ├── .env.example
│   ├── .env.production
│   └── package.json
├── render.yaml                      # Render backend service configuration
├── supabase-security.sql            # Supabase security policies
└── README.md
```

## Main Functional Areas

### Student Features

- complete alphabet recognition activities
- practice vowels, consonants, and consonant-vowel-consonant words
- play instructional videos and audio content
- use voice practice and pronunciation checking
- complete pretests and view learning progress
- join a teacher's class with a class code
- view classroom learning materials

### Teacher Features

- create and manage classes
- add and remove students from class rosters
- generate class codes for student enrollment
- upload and delete learning materials
- create, edit, and delete pretests
- add questions and teacher-recorded audio
- review student academic progress

### Administrator Features

- view student and teacher accounts
- update user account information
- remove accounts when necessary
- oversee role-based access to the platform

### Authentication Features

- register and sign in through Supabase Auth
- synchronize Supabase users with the application backend
- change and reset passwords
- verify active devices for backend sessions
- route users to student, teacher, or administrator workspaces based on role

## Backend Architecture

The backend is organized as a Spring Boot REST application under `com.phonexis.backend`. Controllers expose endpoints for authentication, users, classes, learning modules, module games, progress, pretests, teacher activities, and learning materials.

The main API groups include:

- `/api/auth`
- `/api/users`
- `/api/classes`
- `/api/modules`
- `/api/module-games`
- `/api/progress`
- `/api/pretests`
- `/api/teacher-activities`
- `/api/learning-materials`
- `/health`

Local startup uses H2 by default. Deployment switches to PostgreSQL through environment variables, while Supabase Storage is enabled when its backend credentials are configured.

## Web App Architecture

The React application uses role-aware rendering and route state for login, registration, password recovery, student dashboards, learning modules, profiles, teacher tools, and administrator tools. Backend requests are centralized in `src/lib/supabaseClient.js`, which also handles Supabase Auth integration and device identifiers.

The frontend uses these backend targets:

- local development: `http://localhost:8080`
- production: the `REACT_APP_BACKEND_URL` value from `.env.production`

## Local Development Setup

### Prerequisites

- JDK 17
- Maven wrapper support
- Node.js and npm
- A Supabase project for authentication and frontend configuration

### Backend

From the repository root, start the backend on Windows with:

```powershell
Set-Location backend
.\mvnw.cmd spring-boot:run
```

The backend starts at [http://localhost:8080](http://localhost:8080). Without database environment variables, it uses an in-memory H2 database for local development.

### Web App

In a second terminal:

```powershell
Set-Location Web/phonexis
npm install
npm start
```

The web app starts at [http://localhost:3000](http://localhost:3000). Local Supabase and backend values are stored in `.env.local`, which is ignored by Git.

### Local Environment Variables

The repository includes `.env.example` as a template. For a new checkout, create the local file with:

```powershell
Copy-Item .env.example .env.local
```

The important frontend variables are:

```text
REACT_APP_BACKEND_URL=http://localhost:8080
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-public-anon-key
```

Restart the React development server after changing environment variables.

## Deployment

The backend is configured for Render through `../../render.yaml` and can also be built with Docker:

```powershell
Set-Location ../../backend
docker build -t phonexis-backend .
docker run --rm -p 8080:8080 phonexis-backend
```

The production backend requires these environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`
- `SUPABASE_DB_USER`
- `SUPABASE_DB_PASSWORD`
- `FRONTEND_URL`

The frontend production build is created with:

```powershell
Set-Location Web/phonexis
npm run build
```

Production frontend requests use the URL configured in `.env.production`; local defaults do not affect deployment configuration.

## Required Configuration

Backend database settings can be customized with `DB_*` variables or the corresponding `SUPABASE_DB_*` variables. Useful optional settings include:

```text
PORT=8080
DB_URL=jdbc:postgresql://localhost:5432/phonexis
DB_USERNAME=postgres
DB_PASSWORD=your-password
DB_DDL_AUTO=update
SUPABASE_STORAGE_BUCKET=learning-materials
MAX_UPLOAD_SIZE_MB=50
```

For deployment, use PostgreSQL settings and set `SUPABASE_DB_DDL_AUTO=none`. Keep the Supabase service-role key on the backend only.

## Database Scripts

The `../../backend/sql/` directory contains SQL scripts for classes, materials, pretests, teacher activities, assessment scores, and progress-row maintenance. These scripts are available for database setup or targeted maintenance when needed.

## Security Notes

Do not commit:

- database passwords
- Supabase service-role keys
- private deployment credentials
- real student or teacher data
- local environment files

The frontend may use the public Supabase anonymous key, but privileged Supabase credentials must remain backend-only. Configure production secrets in the deployment environment rather than source control.

## Development Guidelines

- keep environment-specific configuration outside source code
- keep privileged Supabase operations in the backend
- keep frontend and backend API contracts synchronized
- validate frontend changes with `npm run build`
- validate backend changes with `..\..\backend\mvnw.cmd test`
- prefer focused changes consistent with the existing role-based architecture

## License

No license has been specified for this repository yet. Add a license file before distributing or reusing the project publicly.
