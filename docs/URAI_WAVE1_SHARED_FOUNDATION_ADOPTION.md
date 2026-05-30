# URAI Wave 1 Shared Foundation Adoption - URAI Studio

Status: in_build
Domain: uraistudio.com
Repository: LifeLoggerAI/urai-studio
System: URAI Studio
Access class: Public

## Purpose

This document locks how the shared URAI network foundation should be applied to the URAI Studio repository.

URAI Studio is the commercial creative/media arm. It converts client, artist, founder, and brand attention into project requests, campaign work, retainers, and case-study proof.

## Separation Rule

`uraistudio.com` is for paid creative/media work.

It should not become the UrAi app homepage, the investor room, the privacy center, or the broad Labs ecosystem homepage.

## Shared Foundation Files to Adopt

Copy or port from `LifeLoggerAI/urai-labs-llc`:

- `src/styles/urai-network-system.css`
- `src/lib/urai-attribution.js`
- `src/lib/urai-metadata.js`
- `src/lib/urai-form.js`
- `src/lib/urai-trust.js`
- `src/lib/urai-components.js`
- `scripts/urai-qa-checks.js`
- `scripts/README_URAI_QA_CHECKS.md`

Optional later for client preview/login areas:

- `src/lib/urai-portal-components.js`
- `src/styles/urai-portal-system.css`

## Required Public Routes

- `/`
- `/start`
- `/work`
- `/services`
- `/packages`
- `/case-studies`
- `/submit-project`
- `/contact`
- `/privacy`
- `/terms`

## Homepage Requirements

Hero language:

> AI campaigns built to stop the scroll.

Primary CTA:

> Start a Project

Secondary CTA:

> Watch the Reel

Required sections:

- showreel or visual proof area
- services grid
- packages
- case studies / proof cards
- production process
- project intake form
- usage-rights note
- URAI Privacy link
- subtle ecosystem footer

## Services

Core services:

- viral AI shorts
- cinematic AI ads
- music visuals
- launch campaigns
- product visuals
- brand worlds
- social content systems
- AI character campaigns

## Packages

Default package labels:

- Starter Sprint
- Growth Sprint
- Launch Campaign
- Monthly Retainer
- Custom Brand World

Package copy should avoid guaranteed virality claims.

## Forms

Project intake should submit as:

- `formType: project`
- destination collection: `projectRequests`
- source domain: `uraistudio.com`

Required captured fields:

- name
- email
- company/brand
- website or social link
- budget range
- project type
- message
- attribution payload

## Analytics Events

Required events:

- `urai_studio_hero_cta_click`
- `urai_studio_reel_click`
- `urai_studio_package_click`
- `urai_studio_project_submit`
- `urai_studio_contact_click`
- `urai_studio_privacy_click`

## Privacy and Trust Requirements

All project forms must include visible consent language and a link to:

- `https://uraiprivacy.com`

No client work, logos, or performance claims should be presented unless verified and allowed for public use.

## QA Requirements

Before launch-lock:

- verify no placeholder client names/logos
- verify package buttons route to project intake
- verify forms submit or clearly stage safely
- verify metadata and OpenGraph tags
- verify mobile CTA visibility
- verify privacy link
- verify no unsupported claims like guaranteed views or guaranteed revenue
- run URAI QA checks on output where applicable

## Definition of Done

This repository can move from `planning_locked` to `ready_for_review` only when:

- studio-only route boundaries are preserved
- shared foundation visual rules are applied
- project intake works
- privacy links are visible
- package/CTA flows are tested
- metadata is complete
- analytics events are mapped
- QA checks pass
- production/staging URLs and latest commit are recorded in `URAI_LAUNCH_LOCK_REGISTER.md`
