from django.urls import path

from . import views


urlpatterns = [
    path("<slug:project_id>/", views.preview_website),
    path("<slug:project_id>/<path:subpath>", views.preview_website),
]
