from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(
            name="Submission",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=160)), ("email", models.EmailField(max_length=254)),
                ("phone", models.CharField(blank=True, max_length=40)), ("country", models.CharField(max_length=120)),
                ("description", models.TextField(max_length=10000)), ("budget", models.CharField(max_length=40)),
                ("currency", models.CharField(max_length=3)), ("duration", models.CharField(max_length=40)),
                ("project_type", models.CharField(max_length=30)),
                ("status", models.CharField(choices=[("new", "New"), ("reviewed", "Reviewed"), ("archived", "Archived")], default="new", max_length=20)),
                ("email_status", models.CharField(default="pending", max_length=20)), ("push_status", models.CharField(default="pending", max_length=20)),
                ("notification_error", models.TextField(blank=True)), ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)),
            ], options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(name="SiteSettings", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("receiver_email", models.EmailField(blank=True, max_length=254)), ("public_contact_email", models.EmailField(blank=True, max_length=254)), ("email_notifications_enabled", models.BooleanField(default=True)), ("push_notifications_enabled", models.BooleanField(default=False)), ("updated_at", models.DateTimeField(auto_now=True))]),
        migrations.CreateModel(name="PortfolioMedia", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("kind", models.CharField(choices=[("animation", "Animation"), ("video", "Video")], max_length=20)), ("title", models.CharField(max_length=200)), ("description", models.TextField(max_length=2000)), ("duration", models.CharField(blank=True, max_length=30)), ("source_label", models.CharField(blank=True, max_length=300)), ("video", models.FileField(upload_to="videos/")), ("poster", models.FileField(blank=True, null=True, upload_to="thumbnails/")), ("display_order", models.PositiveIntegerField(default=0)), ("is_published", models.BooleanField(default=True)), ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True))], options={"ordering": ["display_order", "created_at"]}),
        migrations.CreateModel(name="WebsitePortfolioItem", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("title", models.CharField(max_length=200)), ("description", models.TextField(max_length=2000)), ("kind", models.CharField(choices=[("deployed", "Deployed"), ("imported", "Imported")], default="deployed", max_length=20)), ("url", models.URLField(blank=True)), ("git_url", models.URLField(blank=True)), ("branch", models.CharField(blank=True, max_length=120)), ("source_label", models.CharField(blank=True, max_length=200)), ("preview_image", models.FileField(blank=True, null=True, upload_to="thumbnails/")), ("display_order", models.PositiveIntegerField(default=0)), ("is_published", models.BooleanField(default=True)), ("import_status", models.CharField(choices=[("none", "None"), ("pending", "Pending"), ("ready", "Ready"), ("failed", "Failed")], default="none", max_length=20)), ("import_path", models.CharField(blank=True, max_length=500)), ("import_error", models.TextField(blank=True)), ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True))], options={"ordering": ["display_order", "created_at"]}),
        migrations.CreateModel(name="AnalyticsEvent", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("event_name", models.CharField(max_length=80)), ("route", models.CharField(blank=True, max_length=300)), ("session_id", models.CharField(blank=True, max_length=80)), ("created_at", models.DateTimeField(auto_now_add=True))]),
        migrations.CreateModel(name="AnalyticsDailyAggregate", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("day", models.DateField()), ("event_name", models.CharField(max_length=80)), ("route", models.CharField(blank=True, max_length=300)), ("count", models.PositiveIntegerField(default=0))], options={"constraints": [models.UniqueConstraint(fields=("day", "event_name", "route"), name="unique_daily_event_route")]}),
        migrations.CreateModel(name="AdminAuditEvent", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("action", models.CharField(max_length=100)), ("object_type", models.CharField(blank=True, max_length=100)), ("object_id", models.CharField(blank=True, max_length=100)), ("created_at", models.DateTimeField(auto_now_add=True)), ("user", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL))]),
        migrations.CreateModel(name="PushSubscription", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("endpoint", models.URLField(max_length=2000, unique=True)), ("p256dh", models.CharField(max_length=255)), ("auth", models.CharField(max_length=255)), ("active", models.BooleanField(default=True)), ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)), ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="push_subscriptions", to=settings.AUTH_USER_MODEL))]),
    ]
