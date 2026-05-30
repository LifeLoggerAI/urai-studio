# Wave 1 URAI Studio Launch Lock Evidence

Domain: uraistudio.com

Repo: LifeLoggerAI/urai-studio

Status: implementation evidence in progress

## Completed evidence

- Wave 1 adoption issue created
- Shared foundation adoption note added
- Studio claims guidance added
- Studio forms checklist added
- URAI QA script added: `scripts/urai-qa-checks.js`

## Required Studio positioning

URAI Studio is the commercial creative and media engine for:

- cinematic AI production
- launch films
- trailers
- motion systems
- music visuals
- campaign assets
- custom visual worlds
- client project workflows

## Public claim boundaries

Studio public copy must not claim:

- guaranteed virality
- guaranteed revenue
- guaranteed follower growth
- guaranteed ad income
- guaranteed platform approval
- guaranteed conversion outcomes

## Required routing

- App users route to https://urai.app
- Privacy questions route to https://uraiprivacy.com
- Client portal access routes to the approved B2B portal
- Project briefs route to the approved Studio brief flow

## Required form behavior

Public Studio forms must include:

- privacy note
- sourceDomain
- sourcePath
- utmSource
- utmMedium
- utmCampaign
- utmContent
- utmTerm
- referrer
- loading state
- success state
- error state

Project briefs should write to `projectRequests` or an approved backend equivalent.

## Evidence still required before approval

- Add or import shared visual foundation into app UI where connector allows
- Wire `pnpm urai:qa` into package scripts if connector allows
- Confirm required routes exist:
  - `/`
  - `/start`
  - `/work`
  - `/services`
  - `/packages`
  - `/case-studies`
  - `/process`
  - `/brief`
  - `/contact`
- Confirm project brief form works
- Confirm UTM/source capture works
- Run build/typecheck/QA
- Confirm DNS and SSL for `uraistudio.com`
- Record production deployment URL
- Record latest deploy commit
- Record owner approval

## Current launch decision

Do not mark approved until build, route, brief form, privacy, DNS/SSL, and deployment evidence are recorded.
