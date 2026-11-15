# Milestone 5

This document should be completed and submitted during **Unit 9** of this course. You **must** check off all completed tasks in this document in order to receive credit for your work.

## Checklist

This unit, be sure to complete all tasks listed below. To complete a task, place an `x` between the brackets.

- [x] Deploy your project on Render
  - [x] In `readme.md`, add the link to your deployed project
- [x] Update the status of issues in your project board as you complete them
- [x] In `readme.md`, check off the features you have completed in this unit by adding a ✅ emoji in front of their title
  - [x] Under each feature you have completed, **include a GIF** showing feature functionality
- [x] In this document, complete the **Reflection** section below
- [x] 🚩🚩🚩**Complete the Final Project Feature Checklist section below**, detailing each feature you completed in the project (ONLY include features you implemented, not features you planned)
- [x] 🚩🚩🚩**Record a GIF showing a complete run-through of your app** that displays all the components included in the **Final Project Feature Checklist** below
  - [x] Include this GIF in the **Final Demo GIF** section below

## Final Project Feature Checklist

Complete the checklist below detailing each baseline, custom, and stretch feature you completed in your project. This checklist will help graders look for each feature in the GIF you submit.

### Baseline Features

👉🏾👉🏾👉🏾 Check off each completed feature below.

- [x] The project includes an Express backend app and a React frontend app
- [x] The project includes these backend-specific features:
  - [x] At least one of each of the following database relationships in Postgres
    - [x] one-to-many
    - [x] many-to-many with a join table
  - [x] A well-designed RESTful API that:
    - [x] supports all four main request types for a single entity (ex. tasks in a to-do list app): GET, POST, PATCH, and DELETE
      - [x] the user can **view** items, such as tasks
      - [x] the user can **create** a new item, such as a task
      - [x] the user can **update** an existing item by changing some or all of its values, such as changing the title of task
      - [x] the user can **delete** an existing item, such as a task
    - [x] Routes follow proper naming conventions
  - [x] The web app includes the ability to reset the database to its default state
- [x] The project includes these frontend-specific features:
  - [x] At least one redirection, where users are able to navigate to a new page with a new URL within the app
  - [x] At least one interaction that the user can initiate and complete on the same page without navigating to a new page
  - [x] Dynamic frontend routes created with React Router
  - [x] Hierarchically designed React components
    - [x] Components broken down into categories, including Page and Component types
    - [x] Corresponding container components and presenter components as appropriate
- [x] The project includes dynamic routes for both frontend and backend apps
- [x] The project is deployed on Render with all pages and features that are visible to the user are working as intended

### Custom Features

👉🏾👉🏾👉🏾 Check off each completed feature below.

- [x] The project gracefully handles errors
- [x] The project includes a one-to-one database relationship
- [x] The project includes a slide-out pane or modal as appropriate for your use case that pops up and covers the page content without navigating away from the current page
- [x] The project includes a unique field within the join table
- [x] The project includes a custom non-RESTful route with corresponding controller actions
- [x] The user can filter or sort items based on particular criteria as appropriate for your use case
- [x] Data is automatically generated in response to a certain event or user action. Examples include generating a default inventory for a new user starting a game or creating a starter set of tasks for a user creating a new task app account
- [x] Data submitted via a POST or PATCH request is validated before the database is updated (e.g. validating that an event is in the future before allowing a new event to be created)
  - [x] *To receive full credit, please be sure to demonstrate in your walkthrough that for certain inputs, the item will NOT be successfully created or updated.*

### Stretch Features

👉🏾👉🏾👉🏾 Check off each completed feature below.

- [x] A subset of pages require the user to log in before accessing the content
  - [x] Users can log in and log out via GitHub OAuth with Passport.js
- [ ] Restrict available user options dynamically, such as restricting available purchases based on a user's currency
- [ ] Show a spinner while a page or page element is loading
- [x] Disable buttons and inputs during the form submission process
- [ ] Disable buttons after they have been clicked
  - *At least 75% of buttons in your app must exhibit this behavior to receive full credit*
- [ ] Users can upload images to the app and have them be stored on a cloud service
  - *A user profile picture does **NOT** count for this rubric item **only if** the app also includes "Login via GitHub" functionality.*
  - *Adding a photo via a URL does **NOT** count for this rubric item (for example, if the user provides a URL with an image to attach it to the post).*
  - *Selecting a photo from a list of provided photos does **NOT** count for this rubric item.*
- [ ] 🍞 [Toast messages](https://www.patternfly.org/v3/pattern-library/communication/toast-notifications/index.html) deliver simple feedback in response to user events

## Final Demo GIF

🔗 [Here's a GIF walkthrough of the final project](../images/final-demo.gif)

![HabitFlow final walkthrough](../images/final-demo.gif)

The walkthrough shows: the login page (signed-out visitors are redirected),
signing in with GitHub and the auto-generated starter data, completing a task
on the dashboard, validation rejecting an empty task title and an empty habit
name, creating a task with categories in a modal, the task details route with
each category's `added_at` date from the join table, editing a task, filtering
by priority, due date, and category with sorting, deleting a task, completing a
habit and its streak, habit history, the Insights page (custom non-RESTful
route), the 404 page, resetting the demo data, and signing out. GitHub's own
authorization page is not shown.

## Reflection

### 1. What went well during this unit?

We finished every feature we planned for the final milestone and deployed
the whole app as one Render web service. Splitting the work into one branch
and pull request per phase kept main stable, and the backend test suite (168
tests against a dedicated test database) let us change large parts of the app,
like adding sign-in to every route, with confidence. Habits and streaks,
weekly insights, the reset route, the due-date filter, and GitHub sign-in all
landed in this unit.

### 2. What were some challenges your group faced in this unit?

Deployment and authentication caused the most trouble. The first Render
build failed because Render installs packages in production mode, which
skipped Vite (a dev dependency), so we had to change the build command. GitHub
sign-in failed on Render with "redirect_uri is not associated with this
application" until we realized a GitHub OAuth App only accepts one callback
URL, so local development and Render each need their own app. Adding login
also meant every query had to be limited to the signed-in user, which touched
almost every model, controller, and test. On the GitHub side, pull requests
were first routed to the original CodePath repository because ours was a
fork, and stacked pull requests closed when their base branch was deleted.

### 3. What were some of the highlights or achievements that you are most proud of in this project?

We are proud that the app is a complete, working product: users sign in
with GitHub, get a starter set of tasks and habits on their first sign-in, and
only ever see their own data. Streaks are calculated correctly for daily,
weekday, and weekly habits, and the Insights page compares this week with last
week using real data. We are also proud of the test suite and of handling
details such as keeping each category's `added_at` date when a task is
edited.

### 4. Reflecting on your web development journey so far, how have you grown since the beginning of the course?

At the start of the course we were mostly building pages; now we can design
a PostgreSQL schema with one-to-one, one-to-many, and many-to-many
relationships, build a RESTful Express API with validation and error handling,
connect it to a React app with routing, add OAuth sign-in with sessions, and
deploy it. We also got much more comfortable with Git workflows (branches,
pull requests, and code review) and with writing automated tests before
changing working code.

### 5. Looking ahead, what are your goals related to web development, and what steps do you plan to take to achieve them?

We want to keep building full-stack projects and get more comfortable with
production concerns such as authentication, security, performance, and
monitoring. Next steps are learning TypeScript, adding frontend tests, trying
a hosted authentication or AI service for features like real coaching
suggestions, and contributing to open-source projects to practice working in
larger codebases.
