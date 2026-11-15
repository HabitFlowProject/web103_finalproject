# Entity Relationship Diagram

## List of Tables

- `users`: Demo users and future GitHub OAuth identities.
- `tasks`: One-time or scheduled work items owned by a user.
- `habits`: Recurring routines owned by a user.
- `habit_completions`: Daily completion records for habits.
- `categories`: Reusable labels such as Health, Career, Learning, Personal,
  and Finance.
- `task_categories`: Join table connecting tasks and categories.

## Entity Relationship Diagram

![HabitFlow entity relationship diagram](../images/HabitFlow_ERD.png)

```mermaid
erDiagram
    USERS ||--o{ TASKS : owns
    USERS ||--o{ HABITS : owns
    HABITS ||--o{ HABIT_COMPLETIONS : records
    TASKS ||--o{ TASK_CATEGORIES : has
    CATEGORIES ||--o{ TASK_CATEGORIES : labels

    USERS {
        integer id PK
        text name
        text email UK
        text github_id UK
        timestamp created_at
    }

    TASKS {
        integer id PK
        integer user_id FK
        text title
        text description
        text priority
        date due_date
        boolean completed
        timestamp created_at
        timestamp updated_at
    }

    HABITS {
        integer id PK
        integer user_id FK
        text name
        text description
        text frequency
        integer current_streak
        timestamp created_at
        timestamp updated_at
    }

    HABIT_COMPLETIONS {
        integer id PK
        integer habit_id FK
        date completed_on
        timestamp created_at
    }

    CATEGORIES {
        integer id PK
        text name UK
        text color
    }

    TASK_CATEGORIES {
        integer task_id PK, FK
        integer category_id PK, FK
        timestamp added_at
    }
```

## Relationship Notes

- `users` to `tasks` is a one-to-many relationship.
- `users` to `habits` is a one-to-many relationship.
- `habits` to `habit_completions` is a one-to-many relationship.
- `tasks` to `categories` is a many-to-many relationship implemented with
  `task_categories`.
- The composite primary key on `task_categories` prevents assigning the same
  category to the same task more than once.
- The `github_id` field is reserved for the planned GitHub OAuth stretch
  feature. The core app can use seeded demo data before authentication is added.

## Seeded Categories

The initial database state will include:

- Health
- Career
- Learning
- Personal
- Finance
