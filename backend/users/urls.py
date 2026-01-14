# users/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('social/', views.social_login),
]