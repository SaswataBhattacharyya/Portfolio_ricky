import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create the super-admin from process environment values supplied by setup-production.sh."

    def handle(self, *args, **options):
        email = os.getenv("ADMIN_EMAIL", "").strip().lower()
        password = os.getenv("ADMIN_PASSWORD", "")
        if not email or not password:
            raise CommandError("ADMIN_EMAIL and ADMIN_PASSWORD are required")
        model = get_user_model()
        user, _ = model.objects.get_or_create(username=email, defaults={"email": email})
        user.email = email
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()
        self.stdout.write(self.style.SUCCESS(f"Super-admin ready: {email}"))
