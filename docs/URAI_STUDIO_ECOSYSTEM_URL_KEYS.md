# URAI Studio Ecosystem URL Keys

Date: 2026-06-16
Repository: `LifeLoggerAI/urai-studio`

This file records the public URL keys used by Studio integration diagnostics.

## Required for launch diagnostics

- `NEXT_PUBLIC_ASSET_FACTORY_URL`
- `NEXT_PUBLIC_URAI_SPATIAL_URL`
- `NEXT_PUBLIC_URAI_ANALYTICS_URL`
- `NEXT_PUBLIC_URAI_ADMIN_URL`
- `NEXT_PUBLIC_URAI_PRIVACY_URL`

## Optional but tracked system-of-systems surfaces

- `NEXT_PUBLIC_URAI_JOBS_URL`
- `NEXT_PUBLIC_URAI_CONTENT_URL`
- `NEXT_PUBLIC_URAI_MARKETING_URL`
- `NEXT_PUBLIC_URAI_INVESTORS_URL`
- `NEXT_PUBLIC_B2B_PORTAL_URL`

## Rule

Studio diagnostics may show optional systems as missing without blocking readiness. Required launch diagnostics must be configured before a production lock can honestly be recorded.
