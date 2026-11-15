# HabitFlow

Designed and developed by: 
- Mithun Venkatesh Gowda
- Bailey Perillo
- Anurag Bheemappa Gnanamurthy

🔗 Link to deployed app: https://habitflow-6ky6.onrender.com/

> Hosted on Render's free plan, so the first visit after a quiet period can take about a minute while the server wakes up.

## About

### Description and Purpose

A full-stack productivity dashboard and habit tracker that helps users build consistent daily routines and manage tasks. Users sign in with GitHub, organize tasks with categories, track habit streaks, and get a calculated weekly insights panel that compares this week with last week and highlights overdue work, streaks, and their most-used categories.

### Inspiration

Inspired by the need for intelligent productivity tools that don't just act as static checklists, but actively provide actionable feedback and data-driven insights on habit formation and time management.

## Tech Stack

Frontend: React, Vite, React Router, CSS

Backend: Node.js, Express.js, RESTful API

Database: PostgreSQL (with one-to-one, one-to-many, and many-to-many relationships)

Authentication: GitHub OAuth with Passport.js, sessions stored in PostgreSQL

Deployment: Render

## Current Development Progress

Milestone 4 (Unit 8) delivered the full task flow, from the database to the UI:

- React frontend (Vite + React Router) with shared navigation and routes for
  `/`, `/tasks`, `/tasks/:taskId`, `/habits`, `/habits/:habitId`, and `/insights`.
- Tasks page: create, edit, delete, and mark tasks complete, with priority,
  due date, overdue highlighting, and category tags.
- Task details page at `/tasks/:taskId`, with "Task not found." for missing tasks.
- Dashboard with task totals, completed, incomplete, overdue, and completion
  percentage calculated from real data, plus a "Due today and overdue" list.
- Filtering by status, priority, and category, and sorting by due date,
  priority, created date, or title.
- Validation on both the frontend form and the backend API, with clear loading,
  empty, and error states.

The final milestone (Unit 9) completes the app:

- Habits with create, edit, delete, "Complete today" / undo, completion
  history, and current streaks calculated for daily, weekdays, and weekly
  habits.
- Weekly Insights page and a "This week" chart on the Dashboard, calculated
  from real tasks and habit check-ins by `GET /api/insights/weekly`.
- Tasks record when they were completed (`completed_at`), so insights can
  count tasks finished each day.
- A due-date filter on the Tasks page: overdue, due today, next 7 days, or no
  due date.
- Sign in with GitHub (Passport.js). Every page except the login page
  requires signing in, and each user only sees their own tasks and habits.
- A user's first sign-in automatically creates a starter set of tasks and
  habits. GitHub details are stored in `github_profiles`, which has a
  one-to-one relationship with `users`.
- The `task_categories` join table records `added_at`, shown on the task
  details page.
- "Reset demo data" in the footer restores the signed-in user's starter set.
- Express serves the built React app, so the whole project deploys as one
  Render web service (`render.yaml`), live at
  https://habitflow-6ky6.onrender.com/.
- 168 automated backend tests (`npm test`).

### API Reference

| Method | Route | Success | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/health` | `200` | Health check |
| `GET` | `/api/auth/github` | `302` | Starts GitHub sign-in (redirects to GitHub) |
| `GET` | `/api/auth/github/callback` | `302` | GitHub returns here; signs the user in and redirects to the app |
| `GET` | `/api/auth/me` | `200` | `{ user }` for the signed-in user, or `{ user: null }` |
| `POST` | `/api/auth/logout` | `204` | Signs out and ends the session |
| `GET` | `/api/tasks` | `200` | Supports filters and sorting below |
| `GET` | `/api/tasks/:id` | `200` | Includes related `categories` |
| `POST` | `/api/tasks` | `201` | Requires `title`; the task belongs to the signed-in user |
| `PATCH` | `/api/tasks/:id` | `200` | Partial update; `due_date: null` clears the date |
| `DELETE` | `/api/tasks/:id` | `204` | No response body |
| `GET` | `/api/categories` | `200` | All categories, sorted by name |
| `GET` | `/api/habits` | `200` | Habits with `current_streak`, `completed_today`, `last_completed_on`, `completion_count` |
| `GET` | `/api/habits/:id` | `200` | One habit with the same calculated fields |
| `POST` | `/api/habits` | `201` | Requires `name`; `frequency` is `daily`, `weekdays`, or `weekly` |
| `PATCH` | `/api/habits/:id` | `200` | Partial update of `name`, `description`, `frequency` |
| `DELETE` | `/api/habits/:id` | `204` | Also deletes the habit's completions |
| `GET` | `/api/habits/:id/completions` | `200` | Completion history, newest first |
| `POST` | `/api/habits/:id/completions` | `201` | Logs a completion (`completed_on` defaults to today); `409` if already logged |
| `DELETE` | `/api/habits/:id/completions/:date` | `200` | Undoes a completion and returns the updated streak |
| `GET` | `/api/insights/weekly` | `200` | Calculated summary of the current Monday–Sunday week (custom non-RESTful route) |
| `POST` | `/api/reset` | `200` | Replaces the signed-in user's tasks and habits with the starter set (custom non-RESTful route) |

Task fields: `title` (non-empty string), `description` (string),
`priority` (`low`, `medium`, `high`), `due_date` (`YYYY-MM-DD` or `null`),
`completed` (`true`/`false`), `category_ids` (array of existing category ids;
replaces the task's categories, `[]` removes them). The owner is always the
signed-in user, so `user_id` is not accepted in request bodies.
Responses also include `completed_at`, set automatically when a task is
completed and cleared when it is reopened.

List query parameters:

```text
GET /api/tasks?completed=false
GET /api/tasks?priority=high
GET /api/tasks?category=Learning
GET /api/tasks?due=overdue&today=2026-11-11  # overdue | today | week | none
GET /api/tasks?sort=due_date            # due_date | priority | created_at | title
GET /api/tasks?sort=title&order=desc    # order is optional: asc | desc
```

Habit, insights, and due-date routes accept an optional `today=YYYY-MM-DD`
query parameter so streaks and "overdue" use the browser's date; the server's
date is used when it is omitted.

`GET /api/insights/weekly` returns `week` (start, end, today), `days` (habit
check-ins and tasks completed for each day), `tasks` (completed this week and
last week, overdue, due this week, open), `habits` (check-ins this week and
last week, completion rate of scheduled check-ins, active streaks, best
streak, and every habit's streak), `categories` (task counts per category),
and `most_used_category`.

Tasks, habits, insights, and reset require signing in and return `401` for
visitors. Every query is limited to the signed-in user's own data, so another
user's task or habit id returns `404`. Health and categories are public.

Error responses use the shape `{ "error": "message" }`: `400` for invalid IDs,
fields, query parameters, or malformed JSON; `404` for missing tasks or
habits; `409` for a duplicate habit completion; and `500` only for unexpected
server failures.

## GitHub Project Management

Repository: https://github.com/HabitFlowProject/web103_finalproject

Project board: https://github.com/orgs/HabitFlowProject/projects/2

### Completed Unit 7 Issues

- [#6 Complete HabitFlow planning documents](https://github.com/HabitFlowProject/web103_finalproject/issues/6)
- [#7 Create and configure HabitFlow project board](https://github.com/HabitFlowProject/web103_finalproject/issues/7)
- [#8 Present HabitFlow pitch and record feedback](https://github.com/HabitFlowProject/web103_finalproject/issues/8)

### Completed Unit 8 Issues

- [#1 Implement task REST API CRUD](https://github.com/HabitFlowProject/web103_finalproject/issues/1) ✅
- [#2 Create PostgreSQL schema and seed data](https://github.com/HabitFlowProject/web103_finalproject/issues/2) ✅
- [#3 Build Dashboard and Tasks pages](https://github.com/HabitFlowProject/web103_finalproject/issues/3) ✅
- [#5 Add validation, filtering, sorting, and error handling](https://github.com/HabitFlowProject/web103_finalproject/issues/5) ✅

The backend foundation walkthrough shows the health check and seeded task
response without exposing database credentials.

![Backend foundation walkthrough](images/backend-foundation.gif)

### Completed Unit 9 Issues

- [#4 Implement habits and completion streaks](https://github.com/HabitFlowProject/web103_finalproject/issues/4) ✅
- [#14 Add weekly insights, database reset, and due-date filter](https://github.com/HabitFlowProject/web103_finalproject/issues/14) ✅
- [#15 Deploy HabitFlow to Render](https://github.com/HabitFlowProject/web103_finalproject/issues/15) ✅
- [#18 Add GitHub login with Passport.js](https://github.com/HabitFlowProject/web103_finalproject/issues/18) ✅
- [#19 Auto-create starter tasks and habits on first login](https://github.com/HabitFlowProject/web103_finalproject/issues/19) ✅
- [#20 Add a unique field to the join table](https://github.com/HabitFlowProject/web103_finalproject/issues/20) ✅
- [#16 Record the final demo GIF](https://github.com/HabitFlowProject/web103_finalproject/issues/16) ✅
- [#17 Complete the milestone documentation](https://github.com/HabitFlowProject/web103_finalproject/issues/17) ✅

### Final Demo

![HabitFlow final walkthrough](images/final-demo.gif)

## Features

### ✅ User Dashboard Overview:

A centralized view displaying task completion rates, overdue work, active habit streaks, and this week's activity.

Completed in Unit 8: task totals, completed, incomplete, overdue, and completion
percentage from real data, plus a "Due today and overdue" list where tasks can
be completed without leaving the page. Unit 9 added active habit streaks,
same-page habit completion, and a "This week" chart of habit check-ins and
completed tasks.

![Dashboard walkthrough](images/dashboard.gif)

### ✅ Habit & Task CRUD Management:

Full create, read, update, and delete capabilities for managing tasks, daily habits, and habit completion logs.

Completed in Unit 8 for tasks: create and edit in a modal form, mark complete,
delete with confirmation, and a task details page.

![Task CRUD walkthrough](images/task-crud.gif)

Completed in Unit 9 for habits: create, edit, and delete habits, mark them
done today (or undo) without leaving the page, and see the streak update
immediately. Each habit has a details page at `/habits/:habitId` with its
completion history.

![Habits and streaks walkthrough](images/habits-streaks.gif)

### ✅ Category Tagging System (Many-to-Many):

Organize habits and tasks into custom categories (e.g., Health, Career, Learning) with a join table allowing flexible categorization.

Tasks can be tagged with any number of categories through the `task_categories`
join table, and tags are shown on every task. The join table also stores
`added_at`, the date each category was added to a task, which is shown on the
task details page and kept when the task is edited.

![Category tagging walkthrough](images/categories.gif)

### ✅ Weekly Coaching & Insights Panel:

A dedicated view where users receive calculated summaries and highlights based on their weekly task and habit activity.

The insights are calculated from real data (no LLM): tasks completed and
habit check-ins this week compared with last week, the share of scheduled
check-ins done so far, active and best streaks, overdue tasks, a day-by-day
chart, category usage, and highlights such as which streaks need a check-in
today. Real AI-generated coaching remains a stretch goal.

![Weekly insights walkthrough](images/insights.gif)

### ✅ Interactive Filtering & Sorting:

Filter and sort tasks by completion status, priority level, category tags, or due date.

Tasks can be filtered by status, priority, and category, and sorted by due
date, priority, created date, or title. Filters are kept in the URL.

![Filtering and sorting walkthrough](images/filter-sort.gif)

Unit 9 added a due-date filter: overdue, due today, the next 7 days, or no due
date.

![Due-date filter walkthrough](images/due-filter.gif)

### ✅ Data Validation & Error Handling:

Robust backend validation on all POST and PATCH requests to ensure clean data input and graceful error messaging across the UI.

The task form checks the title, priority, and due date before saving, and the
API rejects invalid input with a `400` and a clear message. The UI shows
loading, empty, and error states, including "Task not found." for missing tasks.

![Validation walkthrough](images/validation.gif)

### ✅ Reset Demo Data:

"Reset demo data" in the footer replaces the signed-in user's tasks, habits,
and check-ins with the starter set after a confirmation, and the current page
reloads with the fresh data. Other users' data is not affected.

![Reset demo data walkthrough](images/reset-demo-data.gif)

### ✅ GitHub Sign-In:

Users sign in with GitHub (Passport.js with `passport-github2`); every page
except the login page requires signing in, and each user only sees their own
tasks and habits. The GitHub username and avatar are stored in
`github_profiles`, which has a one-to-one relationship with `users`. Sessions
are stored in PostgreSQL so sign-ins survive server restarts.

On a user's first sign-in, HabitFlow automatically creates a starter set of
four tasks (linked to categories, one already completed) and three habits, so
the app is ready to explore. The same starter set is what "Reset demo data"
restores.

![GitHub sign-in walkthrough](images/github-sign-in.gif)

## Installation Instructions

### Backend

```bash
cd backend
npm install
npm run db:schema
npm start
```

Sign in with GitHub to get your starter tasks and habits. (`npm run db:seed`
adds the categories and a demo user used by the automated tests; it is not
needed to use the app.)

The backend requires a local ignored `.env` file containing the Render
PostgreSQL connection variables:

```env
PGUSER=
PGPASSWORD=
PGHOST=
PGPORT=5432
PGDATABASE=
NODE_ENV=development
PORT=3000
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
SESSION_SECRET=
```

For GitHub sign-in, create a GitHub OAuth App (GitHub → Settings → Developer
settings → OAuth Apps) with the homepage `http://localhost:5173` and the
callback URL above, and copy its client ID and secret into `.env`.
`SESSION_SECRET` can be any long random string (`openssl rand -hex 32`).
After signing in, GitHub sends the browser back to `CLIENT_URL`, which
defaults to `http://localhost:5173` in development.

Do not commit `.env` or database credentials.

### Frontend

With the backend running on port 3000, in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. In development, Vite forwards `/api` requests to
`http://localhost:3000`. If the backend runs on another port, start the
frontend with `VITE_DEV_API_TARGET=http://localhost:<port> npm run dev`.

### Backend Tests

The API tests use Node's built-in test runner (Node 22 or newer) against
a dedicated local PostgreSQL database. The tests drop and recreate every table
on each run, so they refuse to start unless the database name ends in `_test`
and the host is not on Render.

```bash
createdb habitflow_test
cd backend
cp .env.test.example .env.test   # fill in local credentials; ignored by Git
npm test
```

Values in `backend/.env.test` take priority over `backend/.env` during tests,
so the development and Render databases are never touched.

### Deployment (Render)

The app deploys as a single Render web service: the build step compiles the
React app into `frontend/dist`, and Express serves it alongside the API, with
every non-API route falling back to `index.html` so links like
`/tasks/3` work on refresh. `render.yaml` describes the service.

1. Create a Render PostgreSQL database (or reuse the existing one).
2. In Render, create a **Blueprint** from this repository, or a web service
   with:
   - Build command: `npm run build && npm --prefix backend run db:schema`
   - Start command: `npm start`
   - Health check path: `/api/health`
3. Set the environment variables `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`,
   `PGDATABASE`, `NODE_ENV=production`, and `NODE_VERSION=22`. Render
   provides `PORT`.
4. Create a second GitHub OAuth App for production with the callback URL
   `https://<your-app>.onrender.com/api/auth/github/callback`, and set
   `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`, and
   `SESSION_SECRET` on Render.
5. Open the app and sign in with GitHub; the first sign-in creates your
   starter tasks and habits.

`db:schema` only creates missing tables and columns, so it is safe on every
deploy. If the frontend is ever hosted separately, build it with
`VITE_API_BASE_URL=<backend URL>` and set `CORS_ORIGIN=<frontend URL>` on the
backend.

To try the production setup locally:

```bash
npm run build      # from the repository root
PORT=3000 npm start
```
