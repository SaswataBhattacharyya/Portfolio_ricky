from __future__ import annotations

import ipaddress
import json
import re
import shutil
import subprocess
import uuid
from decimal import Decimal, InvalidOperation
from functools import wraps
from pathlib import Path
from urllib.parse import urlparse

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.core.cache import cache
from django.core.mail import send_mail
from django.db import transaction
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

from .models import (
    AdminAuditEvent,
    AnalyticsDailyAggregate,
    AnalyticsEvent,
    PortfolioMedia,
    PushSubscription,
    SiteSettings,
    Submission,
    WebsitePortfolioItem,
)


INR_PER_USD = Decimal("95")


def send_admin_push(message: str) -> bool:
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        return False
    try:
        from pywebpush import WebPushException, webpush
    except ImportError:
        return False
    sent = False
    for subscription in PushSubscription.objects.filter(active=True):
        info = {"endpoint": subscription.endpoint, "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth}}
        try:
            webpush(
                subscription_info=info,
                data=json.dumps({"title": "New Webberick gig", "body": message}),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": settings.VAPID_CLAIM_EMAIL},
            )
            sent = True
        except WebPushException as exc:
            if getattr(exc, "response", None) is not None and exc.response.status_code in {404, 410}:
                subscription.active = False
                subscription.save(update_fields=["active", "updated_at"])
        except Exception:
            continue
    return sent


def payload(request):
    try:
        return json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return None


def error(message: str, status: int = 400):
    return JsonResponse({"error": message}, status=status)


def admin_required(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated or not request.user.is_superuser:
            return error("Authentication required", 401)
        return view(request, *args, **kwargs)

    return wrapped


def audit(request, action: str, object_type: str = "", object_id: str = ""):
    AdminAuditEvent.objects.create(
        user=request.user if request.user.is_authenticated else None,
        action=action,
        object_type=object_type,
        object_id=object_id,
    )


def json_request_limit(request, key: str, limit: int, seconds: int) -> bool:
    identity = request.META.get("REMOTE_ADDR", "unknown")
    cache_key = f"webberick:rate:{key}:{identity}"
    count = cache.get(cache_key, 0)
    if count >= limit:
        return False
    cache.set(cache_key, count + 1, seconds)
    return True


def media_url(request, field):
    if not field:
        return ""
    return request.build_absolute_uri(field.url)


def media_dict(request, item: PortfolioMedia):
    return {
        "id": item.pk,
        "title": item.title,
        "description": item.description,
        "duration": item.duration,
        "sourcePath": item.source_label,
        "videoUrl": media_url(request, item.video),
        "posterUrl": media_url(request, item.poster),
    }


def website_dict(request, item: WebsitePortfolioItem):
    return {
        "id": str(item.pk),
        "title": item.title,
        "description": item.description,
        "url": item.url,
        "sourcePath": item.source_label,
        "previewImage": media_url(request, item.preview_image),
        "kind": item.kind,
        "gitUrl": item.git_url,
        "importStatus": item.import_status,
    }


def health(request):
    return JsonResponse({"status": "ok"})


@ensure_csrf_cookie
def csrf(request):
    return JsonResponse({"csrfToken": get_token(request)})


@require_http_methods(["POST"])
def login_view(request):
    if not json_request_limit(request, "login", 8, 300):
        return error("Too many login attempts", 429)
    data = payload(request)
    if not data or not isinstance(data.get("email"), str) or not isinstance(data.get("password"), str):
        return error("Email and password are required")
    user = authenticate(request, username=data["email"].strip().lower(), password=data["password"])
    if user is None or not user.is_active or not user.is_superuser:
        return error("Invalid credentials", 401)
    login(request, user)
    audit(request, "login")
    return JsonResponse({"authenticated": True, "email": user.email or user.username})


@require_http_methods(["POST"])
def logout_view(request):
    if request.user.is_authenticated:
        audit(request, "logout")
    logout(request)
    return JsonResponse({"authenticated": False})


def session_view(request):
    if not request.user.is_authenticated or not request.user.is_superuser:
        return JsonResponse({"authenticated": False})
    return JsonResponse({"authenticated": True, "email": request.user.email or request.user.username})


@require_http_methods(["POST"])
def submissions(request):
    if not json_request_limit(request, "submission", 8, 3600):
        return error("Too many submissions", 429)
    data = payload(request)
    if not data or data.get("website"):
        return JsonResponse({"accepted": True})
    required = ["name", "email", "country", "description", "budget", "currency", "duration", "projectType"]
    if any(not isinstance(data.get(key), str) or not data[key].strip() for key in required):
        return error("Please complete all required fields")
    if len(data["description"]) > 10000 or len(data["name"]) > 160:
        return error("Submission is too large")
    currency = data["currency"].strip().upper()
    if currency not in {"USD", "INR"}:
        return error("Currency must be USD or INR")
    try:
        budget_amount = Decimal(data["budget"].strip())
    except (InvalidOperation, AttributeError):
        return error("Budget must be a valid number")
    if not budget_amount.is_finite() or budget_amount < 0:
        return error("Budget must be a valid non-negative number")
    budget_usd = budget_amount if currency == "USD" else budget_amount / INR_PER_USD
    budget_usd = budget_usd.quantize(Decimal("0.01"))
    try:
        with transaction.atomic():
            submission = Submission.objects.create(
                name=data["name"].strip(),
                email=data["email"].strip().lower(),
                phone=str(data.get("phone", "")).strip()[:40],
                country=data["country"].strip(),
                description=data["description"].strip(),
                budget=data["budget"].strip(),
                currency=currency,
                budget_usd=budget_usd,
                duration=data["duration"].strip(),
                project_type=data["projectType"].strip(),
            )
    except Exception:
        return error("Submission could not be saved", 500)

    settings_row = SiteSettings.singleton()
    receiver = settings_row.receiver_email or settings.GIG_RECEIVER_EMAIL
    email_ok = False
    if settings_row.email_notifications_enabled and receiver:
        try:
            send_mail(
                f"New Webberick gig from {submission.name}",
                f"{submission.description}\n\nBudget: {submission.budget} {submission.currency}\nTimeline: {submission.duration}\nCountry: {submission.country}",
                settings.DEFAULT_FROM_EMAIL,
                [receiver],
                reply_to=[submission.email],
                fail_silently=False,
            )
            email_ok = True
        except Exception as exc:
            submission.notification_error = str(exc)[:1000]
    submission.email_status = "sent" if email_ok else ("disabled" if not settings_row.email_notifications_enabled else "failed")
    push_ok = False
    if settings_row.push_notifications_enabled:
        push_ok = send_admin_push(f"New gig from {submission.name}: {submission.budget} {submission.currency}")
    submission.push_status = "sent" if push_ok else ("disabled" if not settings_row.push_notifications_enabled else "failed")
    submission.save(update_fields=["email_status", "push_status", "notification_error", "updated_at"])
    return JsonResponse({"accepted": True, "id": submission.pk})


@require_http_methods(["POST"])
def analytics_events(request):
    if not json_request_limit(request, "analytics", 120, 60):
        return JsonResponse({"accepted": False}, status=202)
    data = payload(request) or {}
    event_name = str(data.get("event", "page_view"))[:80]
    route = str(data.get("route", ""))[:300]
    session_id = str(data.get("sessionId", ""))[:80]
    now = timezone.now()
    AnalyticsEvent.objects.create(event_name=event_name, route=route, session_id=session_id)
    aggregate, _ = AnalyticsDailyAggregate.objects.get_or_create(
        day=now.date(), event_name=event_name, route=route
    )
    aggregate.count += 1
    aggregate.save(update_fields=["count"])
    return JsonResponse({"accepted": True}, status=202)


def public_media(request):
    kind = request.GET.get("kind")
    query = PortfolioMedia.objects.filter(is_published=True)
    if kind in {"animation", "video"}:
        query = query.filter(kind=kind)
    return JsonResponse({"items": [media_dict(request, item) for item in query]})


def public_websites(request):
    query = WebsitePortfolioItem.objects.filter(is_published=True)
    return JsonResponse({"items": [website_dict(request, item) for item in query]})


def public_settings(request):
    row = SiteSettings.singleton()
    return JsonResponse({"publicContactEmail": row.public_contact_email or settings.PUBLIC_CONTACT_EMAIL})


@admin_required
def admin_overview(request):
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return JsonResponse({
        "totalGigs": Submission.objects.count(),
        "thisMonth": Submission.objects.filter(created_at__gte=month_start).count(),
        "visitors": AnalyticsEvent.objects.filter(event_name="page_view").count(),
        "animations": PortfolioMedia.objects.filter(kind="animation").count(),
        "videos": PortfolioMedia.objects.filter(kind="video").count(),
        "websites": WebsitePortfolioItem.objects.filter(kind="deployed").count(),
        "importedWebsites": WebsitePortfolioItem.objects.filter(kind="imported").count(),
    })


@admin_required
def admin_submissions(request):
    order = request.GET.get("sort", "recent")
    ordering = {"earliest": "created_at", "budget": "-budget_usd", "timeline": "-duration"}.get(order, "-created_at")
    rows = Submission.objects.order_by(ordering)[:200]
    return JsonResponse({"items": [
        {"id": row.pk, "name": row.name, "email": row.email, "phone": row.phone, "country": row.country,
         "description": row.description, "budget": row.budget, "budgetUsd": str(row.budget_usd), "currency": row.currency, "duration": row.duration,
         "projectType": row.project_type, "status": row.status, "emailStatus": row.email_status,
         "pushStatus": row.push_status, "createdAt": row.created_at.isoformat()}
        for row in rows
    ]})


@admin_required
@require_http_methods(["PATCH", "DELETE"])
def admin_submission_detail(request, submission_id: int):
    try:
        row = Submission.objects.get(pk=submission_id)
    except Submission.DoesNotExist:
        return error("Submission not found", 404)
    if request.method == "DELETE":
        row.delete()
        audit(request, "submission_deleted", "submission", str(submission_id))
        return JsonResponse({"deleted": True})
    data = payload(request) or {}
    if data.get("status") in dict(Submission.STATUS_CHOICES):
        row.status = data["status"]
        row.save(update_fields=["status", "updated_at"])
        audit(request, "submission_status_changed", "submission", str(submission_id))
    return JsonResponse({"saved": True})


@admin_required
@require_http_methods(["GET", "PATCH"])
def admin_settings(request):
    row = SiteSettings.singleton()
    if request.method == "PATCH":
        data = payload(request) or {}
        for field in ["receiver_email", "public_contact_email"]:
            if field in data:
                setattr(row, field, str(data[field]).strip())
        for field in ["email_notifications_enabled", "push_notifications_enabled"]:
            if field in data:
                setattr(row, field, bool(data[field]))
        row.save()
        audit(request, "settings_changed")
    return JsonResponse({
        "receiverEmail": row.receiver_email or settings.GIG_RECEIVER_EMAIL,
        "publicContactEmail": row.public_contact_email or settings.PUBLIC_CONTACT_EMAIL,
        "emailNotificationsEnabled": row.email_notifications_enabled,
        "pushNotificationsEnabled": row.push_notifications_enabled,
    })


@admin_required
def admin_analytics(request):
    rows = AnalyticsDailyAggregate.objects.order_by("-day", "-count")[:100]
    return JsonResponse({"items": [{"day": row.day.isoformat(), "event": row.event_name, "route": row.route, "count": row.count} for row in rows]})


@admin_required
@require_http_methods(["GET", "POST"])
def admin_media(request):
    if request.method == "GET":
        return JsonResponse({"items": [media_dict(request, item) for item in PortfolioMedia.objects.all()]})
    kind = request.POST.get("kind")
    if kind not in {"animation", "video"}:
        return error("Invalid media kind")
    video = request.FILES.get("video")
    if not video or video.size > settings.MEDIA_MAX_UPLOAD_BYTES:
        return error("A valid media file is required")
    allowed_extensions = {".webm", ".mp4", ".mov", ".m4v"}
    if not re.match(r"^[\w .-]+$", video.name) or Path(video.name).suffix.lower() not in allowed_extensions:
        return error("Invalid filename")
    poster = request.FILES.get("poster")
    if not poster or poster.size > settings.MEDIA_MAX_UPLOAD_BYTES:
        return error("A template image is required")
    image_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    if not re.match(r"^[\w .-]+$", poster.name) or Path(poster.name).suffix.lower() not in image_extensions:
        return error("Invalid template image filename")
    item = PortfolioMedia.objects.create(
        kind=kind,
        title=request.POST.get("title", "Untitled")[:200],
        description=request.POST.get("description", "")[:2000],
        duration=request.POST.get("duration", "")[:30],
        source_label=request.POST.get("sourcePath", video.name)[:300],
        video=video,
        poster=poster,
        display_order=int(request.POST.get("displayOrder", "0") or 0),
    )
    audit(request, "portfolio_media_added", "media", str(item.pk))
    return JsonResponse({"item": media_dict(request, item)}, status=201)


@admin_required
@require_http_methods(["PATCH", "DELETE"])
def admin_media_detail(request, media_id: int):
    try:
        item = PortfolioMedia.objects.get(pk=media_id)
    except PortfolioMedia.DoesNotExist:
        return error("Media item not found", 404)
    if request.method == "DELETE":
        item.video.delete(save=False)
        if item.poster:
            item.poster.delete(save=False)
        item.delete()
        audit(request, "portfolio_media_deleted", "media", str(media_id))
        return JsonResponse({"deleted": True})
    data = payload(request) or {}
    for field in ["title", "description", "duration", "source_label"]:
        if field in data:
            setattr(item, field, str(data[field]))
    if "displayOrder" in data:
        item.display_order = max(0, int(data["displayOrder"]))
    item.save()
    audit(request, "portfolio_media_updated", "media", str(media_id))
    return JsonResponse({"item": media_dict(request, item)})


@admin_required
@require_http_methods(["GET", "POST"])
def admin_websites(request):
    if request.method == "GET":
        return JsonResponse({"items": [website_dict(request, item) for item in WebsitePortfolioItem.objects.all()]})
    data = payload(request) if request.content_type.startswith("application/json") else request.POST
    url = str(data.get("url", "")).strip()
    if url and urlparse(url).scheme not in {"http", "https"}:
        return error("Website URL must use HTTP or HTTPS")
    item = WebsitePortfolioItem.objects.create(
        title=str(data.get("title", "Untitled"))[:200], description=str(data.get("description", ""))[:2000],
        kind="imported" if data.get("gitUrl") else "deployed", url=url, git_url=str(data.get("gitUrl", "")),
        branch=str(data.get("branch", ""))[:120], source_label=str(data.get("sourcePath", ""))[:200],
        display_order=int(data.get("displayOrder", "0") or 0), preview_image=request.FILES.get("previewImage"),
    )
    audit(request, "website_added", "website", str(item.pk))
    return JsonResponse({"item": website_dict(request, item)}, status=201)


@admin_required
@require_http_methods(["PATCH", "DELETE"])
def admin_website_detail(request, website_id: int):
    try:
        item = WebsitePortfolioItem.objects.get(pk=website_id)
    except WebsitePortfolioItem.DoesNotExist:
        return error("Website item not found", 404)
    if request.method == "DELETE":
        if item.preview_image:
            item.preview_image.delete(save=False)
        item.delete()
        audit(request, "website_deleted", "website", str(website_id))
        return JsonResponse({"deleted": True})
    data = payload(request) or {}
    for field in ["title", "description", "url", "git_url", "source_label"]:
        if field in data:
            setattr(item, field, str(data[field]))
    if "displayOrder" in data:
        item.display_order = max(0, int(data["displayOrder"]))
    item.save()
    audit(request, "website_updated", "website", str(website_id))
    return JsonResponse({"item": website_dict(request, item)})


def safe_git_url(value: str) -> bool:
    parsed = urlparse(value)
    if parsed.scheme != "https" or parsed.username or parsed.password or parsed.port:
        return False
    if parsed.hostname not in {"github.com", "gitlab.com", "bitbucket.org"}:
        return False
    try:
        ip = ipaddress.ip_address(parsed.hostname)
        return not (ip.is_private or ip.is_loopback or ip.is_link_local)
    except ValueError:
        return True


@admin_required
@require_http_methods(["POST"])
def admin_git_import(request):
    data = payload(request) or {}
    git_url = str(data.get("gitUrl", "")).strip()
    if not safe_git_url(git_url):
        return error("Only approved HTTPS Git repository URLs are allowed")
    project_id = uuid.uuid4().hex
    destination = Path(settings.IMPORT_ROOT) / project_id
    destination.parent.mkdir(parents=True, exist_ok=True)
    args = ["git", "clone", "--depth", "1"]
    branch = str(data.get("branch", "")).strip()
    if branch:
        args.extend(["--branch", branch])
    args.extend([git_url, str(destination)])
    try:
        subprocess.run(args, check=True, capture_output=True, text=True, timeout=120)
    except (subprocess.SubprocessError, OSError) as exc:
        shutil.rmtree(destination, ignore_errors=True)
        return error(f"Git import failed: {str(exc)[:200]}", 502)
    item = WebsitePortfolioItem.objects.create(
        title=str(data.get("title", project_id))[:200], description=str(data.get("description", ""))[:2000],
        kind="imported", git_url=git_url, branch=branch, source_label=project_id,
        import_status="ready", import_path=str(destination),
    )
    audit(request, "git_import_completed", "website", str(item.pk))
    return JsonResponse({"item": website_dict(request, item)}, status=201)


def vapid_public_key(request):
    return JsonResponse({"publicKey": settings.VAPID_PUBLIC_KEY})


@admin_required
@require_http_methods(["POST"])
def push_subscribe(request):
    data = payload(request) or {}
    subscription = data.get("subscription") or {}
    keys = subscription.get("keys") or {}
    if not subscription.get("endpoint") or not keys.get("p256dh") or not keys.get("auth"):
        return error("Invalid push subscription")
    PushSubscription.objects.update_or_create(
        endpoint=subscription["endpoint"],
        defaults={"user": request.user, "p256dh": keys["p256dh"], "auth": keys["auth"], "active": True},
    )
    audit(request, "push_subscription_registered")
    return JsonResponse({"registered": True})
