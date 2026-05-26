# EstateIQ Future Enterprise Roadmap

## Foundation First

Before enterprise expansion, validate the core loop:

Property setup -> inspection -> photos -> issue tracking -> homeowner report -> owner confidence.

Enterprise features should wait until pilot customers prove the repeated workflow.

## Future Integrations

- Supabase production auth and role policies.
- Stripe subscriptions and pilot-to-paid conversion.
- Google Calendar or Outlook scheduling.
- Twilio SMS notifications.
- SendGrid or Resend email reports.
- QuickBooks or accounting export for service billing.
- Vendor management systems.
- Smart home platform status imports.
- Airbnb/VRBO calendar imports.
- Property management system integrations.

## AI Roadmap

Phase 1:
- AI inspection summaries with human review.
- Tone guide: calm, concierge, professional.

Phase 2:
- AI maintenance recommendations.
- Vendor category suggestions.
- Priority guidance based on issue details and photos.

Phase 3:
- AI-generated owner reports.
- Brand and tone consistency.
- Owner-specific summary formatting.

Phase 4:
- Issue prediction and property risk scoring.
- Trend analysis across inspections.
- Seasonal risk recommendations for luxury desert homes.

## Enterprise Opportunities

- Multi-organization SaaS console.
- Property portfolio analytics.
- Team assignment and permissions.
- Audit logs for every user action.
- White-label reporting.
- Owner portal branding.
- Vendor SLA tracking.
- Compliance-ready inspection history.
- Enterprise security reviews.

## Scaling Recommendations

- Move pilot JSON stores to Supabase tables.
- Add row-level security by organization, property, and role.
- Move photo storage fully to Supabase Storage or a dedicated media service.
- Add background jobs for PDF generation.
- Add structured analytics tables.
- Add monitoring, error tracking, and uptime checks.
- Add formal test coverage for core workflows.

## What Should Wait

- Complex AI automation without human review.
- Deep enterprise integrations.
- Marketplace-style vendor network.
- Custom white-label themes.
- Advanced billing.
- Predictive scoring until enough inspection data exists.

## Product Principle

EstateIQ should feel like a trusted estate manager in software form: calm, precise, polished, and accountable.
