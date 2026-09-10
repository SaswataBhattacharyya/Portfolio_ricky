from django.contrib import admin

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


for model in [
    Submission,
    SiteSettings,
    PortfolioMedia,
    WebsitePortfolioItem,
    PushSubscription,
    AnalyticsEvent,
    AnalyticsDailyAggregate,
    AdminAuditEvent,
]:
    admin.site.register(model)
