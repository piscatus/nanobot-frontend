# Bonuses Command

**Key:** `bonuses`  
**Description:** Sale Multipliers List  
**Executable from DM:** Yes (default)

## Interaction Types

- Read-only
- Admin Messages (Administrator can post as public message)

## Logic Flow

1. `executeReadOnlyEmbedCommand`: API call `bonusesAPI(guildId, userId)` → status check → build embed via `formatBonuses`, `formatBonusesMessage` → `respondWithEmbed` with `getAdminMessageOptions`

## Options

| Option | Key | Required | Description |
|--------|-----|----------|-------------|
| Message | `message` | No | Post as public message (Admin only) |
