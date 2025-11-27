# Smart Task Analyzer

Smart Task Analyzer is a full‑stack Django web app that scores and sorts tasks by priority using due dates, importance, estimated effort, and dependencies. It also offers multiple strategies like “Fastest Wins”, “High Impact”, “Deadline Driven”, and a balanced mode to suggest the top tasks to do today.

## Features

- REST API built with Django + Django REST Framework.
- Task model with title, due date, estimated hours, importance, and dependencies.
- Priority algorithm combining urgency, importance, effort, and blocking dependencies.
- Multiple strategies: Fastest Wins / High Impact / Deadline Driven / Smart Balance.
- Responsive HTML/CSS/JavaScript frontend.
- Color‑coded task cards (High / Medium / Low priority) with human‑readable explanations.

## Tech Stack

- Backend: Python, Django, Django REST Framework
- Frontend: HTML, CSS, Vanilla JavaScript (Fetch API)
- Database: SQLite (default Django dev DB)
- Tools: Git, GitHub
