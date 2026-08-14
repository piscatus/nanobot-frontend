# Server Command

**Key:** `server`  
**Description:** Server Configurations  
**Executable from DM:** No (`setDMPermission(false)`)

## Interaction Types

- Read-only
- Admin Messages (Administrator can post as public message)

## Logic Flow

1. `executeReadOnlyEmbedCommand`: API call `serverAPI(guildId, userId)` → status check → build embed via `buildServerEmbed` → `respondWithEmbed` with `getAdminMessageOptions`

## Options

| Option | Key | Required | Description |
|--------|-----|----------|-------------|
| Message | `message` | No | Post as public message (Admin only) |

Guild-scoped (`setDMPermission(false)`); uses `getInteractionContext` for guildId/userId.
