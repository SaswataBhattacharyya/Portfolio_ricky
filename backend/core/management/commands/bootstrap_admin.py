import getpass

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create or update the single Webberick super-admin without exposing the password."

    def add_arguments(self, parser):
        parser.add_argument("--email")

    def handle(self, *args, **options):
        email = (options.get("email") or input("Admin email: ")).strip().lower()
        if not email:
            raise CommandError("Admin email is required")
        password = getpass.getpass("Admin password: ")
        confirmation = getpass.getpass("Confirm admin password: ")
        if not password or password != confirmation:
            raise CommandError("Passwords are empty or do not match")
        user_model = get_user_model()
        user, _ = user_model.objects.get_or_create(username=email, defaults={"email": email})
        user.email = email
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()
        self.stdout.write(self.style.SUCCESS(f"Super-admin ready: {email}"))
