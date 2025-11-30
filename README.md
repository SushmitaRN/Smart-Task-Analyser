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

- ## Priority Algorithm Explanation
- The Smart Task Analyzer uses a multi-factor scoring system that evaluates each task using four components: urgency, importance, effort, and dependency impact. The goal is to create a flexible model that adapts to different work styles while still giving meaningful rankings.

Urgency is based on the number of days until the due date. Tasks with closer deadlines naturally receive higher urgency values, helping prevent last-minute rushes. Importance represents the overall impact of the task, giving heavier weight to tasks that matter most. Effort is measured using estimated hours, and depending on the strategy, it can either penalize long tasks or elevate short ones (e.g., “Fastest Wins”). Lower effort means a higher priority score when the goal is quick progress.

Dependencies also factor into scoring. If a task is blocking others, its priority increases because completing it unlocks additional work. Conversely, tasks that depend on incomplete prerequisites may be deprioritized. The system detects circular dependencies using a DFS-based recursion-stack approach. Tasks inside cycles are flagged and visually marked so users can resolve the cycle manually.

Each strategy adjusts scoring weights. Smart Balance gives equal influence to urgency, importance, and effort for a well-rounded result. Deadline Driven maximizes the urgency component to highlight critical due dates. High Impact increases importance weighting to spotlight meaningful tasks. Fastest Wins flips the effort component to reward quick tasks that can be finished rapidly.

This hybrid approach ensures fast client-side responsiveness while still supporting more advanced logic in future backend expansions.

## Dependency Visualization Logic
# Node Positioning

Tasks are arranged evenly around a circle:

angle = (index / taskCount) * 2π
x = centerX + radius * cos(angle)
y = centerY + radius * sin(angle)

# Node Rendering

Blue circle = normal task

Red circle = task involved in a circular dependency

Task name drawn inside each node

# Dependency Arrows

Arrow direction: dependency → dependent task

If part of a cycle, arrows turn red

# Cycle Detection (DFS)

Build adjacency list

Track visited and recStack

If DFS revisits a node in the current recursion path → cycle detected

Mark all cycle tasks in red

## Client-Side Priority Strategy Logic

Implemented in task-dashboard.js:

Smart Balance: equal weight to due date, importance, and estimated hours

Deadline First: soonest due date is top priority

Impact First: highest importance prioritized

Results displayed in a popup alert

## Design Decisions

Client-side priority scoring chosen for speed and simplicity

Vanilla JS used instead of a framework to keep the project lightweight

Circular dependency graph chosen for readability and easy trigonometric layout

SQLite used for frictionless development

Balanced simplicity vs. expandability throughout the design

## Time Breakdown
Component	Hours
Django backend & models	4–5 hrs
REST API setup	2 hrs
Frontend layout & UI	3–4 hrs
Priority algorithms	3 hrs
Dependency graph & cycle detection	3–4 hrs
Testing & fixes	2 hrs
README & documentation	1 hr

Total: ~18–20 hours

## Bonus Challenges Attempted

Circular dependency detection

Full dependency visualization graph

Multiple priority strategy modes

Fully responsive UI

## Future Improvements

Add modal instead of alert popups for results

Drag-and-drop nodes on the dependency graph

User accounts & task syncing

Machine-learning-based priority predictions

Calendar integration

Replace circular layout with force-directed graph
