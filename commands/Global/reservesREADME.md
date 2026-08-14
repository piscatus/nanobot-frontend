# Reserves Command

**Key:** `reserves`  
**Description:** Server Fishing Reserves  
**Executable from DM:** No (`setDMPermission(false)`)

## Interaction Types

- Read-only

## Logic Flow

1. API call: `reservesAPI(guildId, userId)`
2. Status check via `executeWithStatusCheck`
3. Build embed via `buildReservesEmbed`
4. Reply with embed

## Options

None. Guild-scoped; uses `getInteractionContext` for guildId/userId.
