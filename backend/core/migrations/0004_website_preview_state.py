from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("core", "0003_sitesettings_smtp_sender_email")]

    operations = [
        migrations.AddField(
            model_name="websiteportfolioitem",
            name="preview_error",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="websiteportfolioitem",
            name="preview_path",
            field=models.CharField(blank=True, max_length=500),
        ),
        migrations.AddField(
            model_name="websiteportfolioitem",
            name="preview_status",
            field=models.CharField(
                choices=[
                    ("none", "None"),
                    ("static", "Static preview"),
                    ("build_required", "Build required"),
                    ("building", "Building"),
                    ("ready", "Ready"),
                    ("failed", "Failed"),
                ],
                default="none",
                max_length=20,
            ),
        ),
    ]
