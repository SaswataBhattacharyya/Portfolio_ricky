from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("core", "0002_submission_budget_usd")]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="smtp_sender_email",
            field=models.EmailField(blank=True, max_length=254),
        ),
    ]
