from datetime import date
from collections import defaultdict, deque

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import TaskInputSerializer, TaskOutputSerializer


def detect_cycles(tasks_dict):
    indegree = defaultdict(int)
    graph = defaultdict(list)

    for tid, task in tasks_dict.items():
        for dep in task.get("dependencies", []):
            graph[dep].append(tid)
            indegree[tid] += 1
            if dep not in indegree:
                indegree[dep] = 0

    q = deque([n for n in indegree if indegree[n] == 0])
    visited = 0

    while q:
        node = q.popleft()
        visited += 1
        for nei in graph[node]:
            indegree[nei] -= 1
            if indegree[nei] == 0:
                q.append(nei)

    has_cycle = visited != len(indegree)
    nodes_in_cycle = [n for n, deg in indegree.items() if deg > 0] if has_cycle else []
    return has_cycle, nodes_in_cycle


def compute_dependency_factor(tasks_dict):
    graph = defaultdict(list)
    for tid, t in tasks_dict.items():
        for dep in t.get("dependencies", []):
            graph[dep].append(tid)

    counts = {}
    for tid in tasks_dict.keys():
        visited = set()
        stack = [tid]
        while stack:
            cur = stack.pop()
            for nei in graph[cur]:
                if nei not in visited:
                    visited.add(nei)
                    stack.append(nei)
        counts[tid] = len(visited)

    max_count = max(counts.values()) if counts else 1
    return {
        tid: (counts[tid] / max_count if max_count > 0 else 0.0)
        for tid in counts
    }


def compute_urgency(due_date_obj):
    if not due_date_obj:
        return 0.4
    today = date.today()
    days_to_due = (due_date_obj - today).days
    if days_to_due <= 0:
        return 1.0 if days_to_due < 0 else 0.9
    u = 1 - (days_to_due / 14.0)
    return max(0.0, min(1.0, u))


def compute_effort_factor(estimated_hours):
    if estimated_hours is None:
        estimated_hours = 2.0
    if estimated_hours <= 0:
        return 1.0
    ratio = min(estimated_hours / 8.0, 1.0)
    return 1.0 - ratio


def compute_scores(tasks_dict, strategy="smart_balance", weights=None):
    if weights is None:
        weights = {
            "w_urgency": 0.35,
            "w_importance": 0.35,
            "w_effort": 0.15,
            "w_dependency": 0.15,
        }

    dep_factor = compute_dependency_factor(tasks_dict)
    scored = []

    for tid, t in tasks_dict.items():
        due = t.get("due_date")
        est = t.get("estimated_hours")
        importance = t.get("importance", 5)
        importance = max(1, min(importance, 10))

        urgency = compute_urgency(due)
        effort_factor = compute_effort_factor(est)
        dependency_factor = dep_factor.get(tid, 0.0)
        imp_norm = importance / 10.0

        if strategy == "fastest_wins":
            score = 0.6 * effort_factor + 0.2 * urgency + 0.2 * imp_norm
        elif strategy == "high_impact":
            score = 0.6 * imp_norm + 0.25 * urgency + 0.15 * dependency_factor
        elif strategy == "deadline_driven":
            score = 0.7 * urgency + 0.2 * imp_norm + 0.1 * dependency_factor
        else:
            score = (
                weights["w_urgency"] * urgency
                + weights["w_importance"] * imp_norm
                + weights["w_effort"] * effort_factor
                + weights["w_dependency"] * dependency_factor
            )

        reasons = []
        if urgency >= 0.9:
            reasons.append("urgent or overdue")
        elif urgency >= 0.6:
            reasons.append("approaching deadline")
        if imp_norm >= 0.8:
            reasons.append("very important")
        elif imp_norm >= 0.6:
            reasons.append("important")
        if effort_factor >= 0.7:
            reasons.append("quick to complete")
        if dependency_factor >= 0.5:
            reasons.append("unblocks many other tasks")

        explanation = (
            "High priority because it is " + ", ".join(reasons) + "."
            if reasons
            else "Moderate priority based on current settings."
        )

        scored.append((tid, score, explanation))

    return scored


class AnalyzeTasksView(APIView):
    def post(self, request):
        data = request.data
        tasks_data = data.get("tasks", [])
        strategy = data.get("strategy", "smart_balance")

        if not isinstance(tasks_data, list) or len(tasks_data) == 0:
            return Response(
                {"detail": "tasks must be a non-empty list"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = TaskInputSerializer(data=tasks_data, many=True)
        serializer.is_valid(raise_exception=True)
        valid_tasks = serializer.validated_data

        tasks_dict = {}
        warnings_map = {}

        for idx, t in enumerate(valid_tasks):
            tid = t.get("id") or f"task_{idx}"
            t["id"] = tid

            if "importance" not in t:
                t["importance"] = 5
                warnings_map.setdefault(tid, []).append("Importance defaulted to 5.")
            if "dependencies" not in t or t["dependencies"] is None:
                t["dependencies"] = []

            tasks_dict[tid] = t

        has_cycle, cycle_nodes = detect_cycles(tasks_dict)
        cycle_warning = None
        if has_cycle:
            cycle_warning = "Circular dependency detected."

        scored_list = compute_scores(tasks_dict, strategy=strategy)
        scored_list.sort(key=lambda x: x[1], reverse=True)

        output = []
        for tid, score, explanation in scored_list:
            t = tasks_dict[tid]
            warnings = warnings_map.get(tid, [])
            if cycle_warning and tid in cycle_nodes:
                warnings.append("This task is part of a circular dependency.")
            output.append(
                {
                    "id": tid,
                    "title": t["title"],
                    "due_date": t.get("due_date"),
                    "estimated_hours": t.get("estimated_hours"),
                    "importance": t.get("importance"),
                    "dependencies": t.get("dependencies", []),
                    "score": round(score, 3),
                    "strategy_used": strategy,
                    "explanation": t.get("explanation", explanation),
                    "warnings": warnings,
                }
            )

        out_ser = TaskOutputSerializer(output, many=True)
        return Response({"tasks": out_ser.data})


class SuggestTasksView(APIView):
    def get(self, request):
        strategy = request.query_params.get("strategy", "smart_balance")
        limit = int(request.query_params.get("limit", 3))
        return Response(
            {
                "detail": "Suggest endpoint demo. Connect to DB for real use.",
                "strategy": strategy,
                "limit": limit,
                "tasks": [],
            }
        )
