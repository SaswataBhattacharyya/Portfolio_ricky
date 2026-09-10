import json
import shutil
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand

from core.models import PortfolioMedia, WebsitePortfolioItem


class Command(BaseCommand):
    help = "Import the current static portfolio entries without deleting existing database rows."

    def handle(self, *args, **options):
        root = Path(settings.BASE_DIR).parent
        media_root = Path(settings.MEDIA_ROOT)
        media_root.mkdir(parents=True, exist_ok=True)
        animation_rows = [
            ("animation", "Animation Study 01", "A long-form screen capture showcasing animation timing, interaction flow, and visual polish.", "22:03", "animation/Screencast from 2026-01-20 18-22-35.webm", "media-posters/animation-screencast-2026-01-20-18-22-35.jpg"),
            ("animation", "Animation Study 02", "A focused animation preview with compact motion, transitions, and screen-level interaction detail.", "0:52", "animation/Screencast from 2026-01-20 19-41-28.webm", "media-posters/animation-screencast-2026-01-20-19-41-28.jpg"),
        ]
        video_rows = [
            ("video", "Video Production Study 01", "A short production sample showing composition, timing, and screen capture pacing.", "0:14", "videos/Screencast from 2026-01-20 19-43-16.webm", "media-posters/video-screencast-2026-01-20-19-43-16.jpg"),
            ("video", "Video Production Study 02", "A mid-length production sample for reviewing edit rhythm and presentation flow.", "0:42", "videos/Screencast from 2026-01-20 19-44-15.webm", "media-posters/video-screencast-2026-01-20-19-44-15.jpg"),
            ("video", "Video Production Study 03", "A longer production capture for viewing full-page sequencing and editing decisions.", "6:15", "videos/Screencast from 2026-01-20 19-45-32.webm", "media-posters/video-screencast-2026-01-20-19-45-32.jpg"),
        ]
        for order, row in enumerate(animation_rows + video_rows):
            kind, title, description, duration, source, poster = row
            if PortfolioMedia.objects.filter(title=title).exists():
                continue
            video_source = root / source
            if not video_source.exists():
                self.stdout.write(self.style.WARNING(f"Skipping missing media: {video_source}"))
                continue
            item = PortfolioMedia(kind=kind, title=title, description=description, duration=duration, source_label=source, display_order=order)
            with video_source.open("rb") as handle:
                item.video.save(video_source.name, File(handle), save=False)
            poster_source = root / "public" / poster
            if poster_source.exists():
                with poster_source.open("rb") as handle:
                    item.poster.save(poster_source.name, File(handle), save=False)
            item.save()

        registry = root / "public" / "templates.json"
        if registry.exists():
            data = json.loads(registry.read_text())
            for kind, entries in (("imported", data.get("local", [])), ("deployed", data.get("deployed", []))):
                for entry in entries:
                    if WebsitePortfolioItem.objects.filter(title=entry["title"]).exists():
                        continue
                    WebsitePortfolioItem.objects.create(
                        title=entry["title"], description=entry["description"], kind=kind,
                        url=entry.get("url", "") if kind == "deployed" else "",
                        source_label=entry.get("sourcePath", entry["id"]),
                    )
        self.stdout.write(self.style.SUCCESS("Portfolio import completed."))
