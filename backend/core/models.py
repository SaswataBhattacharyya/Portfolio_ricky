from django.contrib.auth import get_user_model
from django.db import models


class Submission(models.Model):
    STATUS_CHOICES = [("new", "New"), ("reviewed", "Reviewed"), ("archived", "Archived")]
    name = models.CharField(max_length=160)
    email = models.EmailField()
    phone = models.CharField(max_length=40, blank=True)
    country = models.CharField(max_length=120)
    description = models.TextField(max_length=10000)
    budget = models.CharField(max_length=40)
    currency = models.CharField(max_length=3)
    budget_usd = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    duration = models.CharField(max_length=40)
    project_type = models.CharField(max_length=30)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    email_status = models.CharField(max_length=20, default="pending")
    push_status = models.CharField(max_length=20, default="pending")
    notification_error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]


class SiteSettings(models.Model):
    smtp_sender_email = models.EmailField(blank=True)
    receiver_email = models.EmailField(blank=True)
    public_contact_email = models.EmailField(blank=True)
    email_notifications_enabled = models.BooleanField(default=True)
    push_notifications_enabled = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def singleton(cls):
        value, _ = cls.objects.get_or_create(pk=1)
        return value


class PortfolioMedia(models.Model):
    KIND_CHOICES = [("animation", "Animation"), ("video", "Video")]
    kind = models.CharField(max_length=20, choices=KIND_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField(max_length=2000)
    duration = models.CharField(max_length=30, blank=True)
    source_label = models.CharField(max_length=300, blank=True)
    video = models.FileField(upload_to="videos/")
    poster = models.FileField(upload_to="thumbnails/", blank=True, null=True)
    display_order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "created_at"]


class WebsitePortfolioItem(models.Model):
    KIND_CHOICES = [("deployed", "Deployed"), ("imported", "Imported")]
    IMPORT_CHOICES = [("none", "None"), ("pending", "Pending"), ("ready", "Ready"), ("failed", "Failed")]
    title = models.CharField(max_length=200)
    description = models.TextField(max_length=2000)
    kind = models.CharField(max_length=20, choices=KIND_CHOICES, default="deployed")
    url = models.URLField(blank=True)
    git_url = models.URLField(blank=True)
    branch = models.CharField(max_length=120, blank=True)
    source_label = models.CharField(max_length=200, blank=True)
    preview_image = models.FileField(upload_to="thumbnails/", blank=True, null=True)
    display_order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    import_status = models.CharField(max_length=20, choices=IMPORT_CHOICES, default="none")
    import_path = models.CharField(max_length=500, blank=True)
    import_error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "created_at"]


class PushSubscription(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name="push_subscriptions")
    endpoint = models.URLField(max_length=2000, unique=True)
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class AnalyticsEvent(models.Model):
    event_name = models.CharField(max_length=80)
    route = models.CharField(max_length=300, blank=True)
    session_id = models.CharField(max_length=80, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class AnalyticsDailyAggregate(models.Model):
    day = models.DateField()
    event_name = models.CharField(max_length=80)
    route = models.CharField(max_length=300, blank=True)
    count = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["day", "event_name", "route"], name="unique_daily_event_route")]


class AdminAuditEvent(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=100)
    object_type = models.CharField(max_length=100, blank=True)
    object_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
