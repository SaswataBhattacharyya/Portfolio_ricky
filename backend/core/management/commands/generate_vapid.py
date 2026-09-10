import base64
import os
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric import ec

from django.core.management.base import BaseCommand


def encoded(value: int, size: int) -> str:
    return base64.urlsafe_b64encode(value.to_bytes(size, "big")).rstrip(b"=").decode()


class Command(BaseCommand):
    help = "Generate VAPID keys into the protected environment file if they are missing."

    def handle(self, *args, **options):
        env_file = Path(os.getenv("WEBBERICK_ENV_FILE", "/etc/webberick/webberick.env"))
        text = env_file.read_text() if env_file.exists() else ""
        values = {}
        for line in text.splitlines():
            if "=" in line and not line.startswith("#"):
                key, value = line.split("=", 1)
                values[key] = value
        if values.get("VAPID_PUBLIC_KEY") and values.get("VAPID_PRIVATE_KEY"):
            return
        private = ec.generate_private_key(ec.SECP256R1())
        private_numbers = private.private_numbers()
        public_numbers = private.public_key().public_numbers()
        values["VAPID_PRIVATE_KEY"] = encoded(private_numbers.private_value, 32)
        values["VAPID_PUBLIC_KEY"] = encoded(2 + (public_numbers.y & 1), 1) + encoded(public_numbers.x, 32)
        env_file.write_text("".join(f"{key}={value}\n" for key, value in values.items()))
        os.chmod(env_file, 0o600)
        self.stdout.write("VAPID keys generated.")
