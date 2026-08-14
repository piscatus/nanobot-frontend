# Audit Command

**Key:** `audit`  
**Description:** Audit Liquidity  
**Executable from DM:** Yes (default)

## Interaction Types

- Read-only

## Logic Flow

1. API call: `auditAPI(guildId, userId)`
2. Status check via `executeWithStatusCheck`
3. Format embed via `formatAudit(response.data)`
4. Reply with embed

## Options

None. Guild-scoped; uses `getInteractionContext` for guildId/userId.
