# Creatures Command

**Key:** `creatures`  
**Description:** Creatures List  
**Executable from DM:** Yes (default)

## Interaction Types

- Read-only
- Admin Messages (Administrator can post as public message)

## Logic Flow

1. `executeReadOnlyEmbedCommand`: API call `creaturesAPI(guildId, userId)` → status check → build embed via `formatCreatures`, `formatCreatureCommands` → `respondWithEmbed` with `getAdminMessageOptions`

## Options

| Option | Key | Required | Description |
|--------|-----|----------|-------------|
| Message | `message` | No | Post as public message (Admin only) |
