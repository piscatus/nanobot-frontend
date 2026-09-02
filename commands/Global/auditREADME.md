# Audit Command

**Key:** `audit`  
**Description:** Audit Liquidity  
**Executable from DM:** Yes (default)

## Privacy

Currencies flagged `concealBalances` in the API (privacy coins) have their
amounts replaced with `?????`, are excluded from the USD totals, and are skipped
by the liquidity check. Excluding them from the totals matters: a total that
included a concealed currency could be differenced against the visible rows to
recover the hidden amount.

The `reveal` option shows real figures and is restricted to
`BOT_OWNER_USER_ID`. A non-owner passing it is refused outright rather than
being silently shown the concealed report, so it is never ambiguous whether the
figures are real.

## Interaction Types

- Read-only

## Logic Flow

1. API call: `auditAPI(guildId, userId)`
2. Status check via `executeWithStatusCheck`
3. Format embed via `formatAudit(response.data)`
4. Reply with embed

## Options

None. Guild-scoped; uses `getInteractionContext` for guildId/userId.
