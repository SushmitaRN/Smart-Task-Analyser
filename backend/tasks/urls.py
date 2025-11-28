from django.urls import path
from .views import (
    AnalyzeTasksView,
    SuggestTasksView,
    signup_view,
    login_view,
)

urlpatterns = [
    path('auth/signup/', signup_view, name='auth-signup'),
    path('auth/login/', login_view, name='auth-login'),
    path('tasks/analyze/', AnalyzeTasksView.as_view(), name='tasks-analyze'),
    path('tasks/suggest/', SuggestTasksView.as_view(), name='tasks-suggest'),
]
