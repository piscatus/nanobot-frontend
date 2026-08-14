# Aliases Command

**Key:** `aliases`  
**Description:** Aliases List  
**Executable from DM:** Yes (default)

## Interaction Types

- Read-only
- Admin Messages (Administrator can post as public message)

## Logic Flow

1. Get subcommand: `global` or `server`
2. `executeReadOnlyEmbedCommand` with `beforeApiCall`: If DM + server subcommand → show error, abort
3. API call: `aliasesAPI(guildId, userId, global)` → status check → build embed via `buildAliasesEmbed` → `respondWithEmbed` with `getAdminMessageOptions`

## Options

| Option | Key | Required | Description |
|--------|-----|----------|-------------|
| Subcommand | `global` / `server` | Yes | Global or server aliases |
| Message | `message` | No | Post as public message (Admin only) |
