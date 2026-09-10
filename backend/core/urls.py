from django.urls import path

from . import views


urlpatterns = [
    path("health/", views.health),
    path("auth/csrf/", views.csrf),
    path("auth/login/", views.login_view),
    path("auth/logout/", views.logout_view),
    path("auth/session/", views.session_view),
    path("submissions/", views.submissions),
    path("analytics/events/", views.analytics_events),
    path("portfolio/media/", views.public_media),
    path("portfolio/websites/", views.public_websites),
    path("settings/public/", views.public_settings),
    path("notifications/public-key/", views.vapid_public_key),
    path("notifications/subscribe/", views.push_subscribe),
    path("admin/overview/", views.admin_overview),
    path("admin/submissions/", views.admin_submissions),
    path("admin/submissions/<int:submission_id>/", views.admin_submission_detail),
    path("admin/settings/", views.admin_settings),
    path("admin/analytics/", views.admin_analytics),
    path("admin/media/", views.admin_media),
    path("admin/media/<int:media_id>/", views.admin_media_detail),
    path("admin/websites/", views.admin_websites),
    path("admin/websites/<int:website_id>/", views.admin_website_detail),
    path("admin/git-import/", views.admin_git_import),
]
