# Active Command

**Key:** `active`  
**Description:** Channel Activity  
**Executable from DM:** No (`setDMPermission(false)`)

## Interaction Types

- Read-only

## Logic Flow

1. Validate duration (days/hours/minutes) via `computeAndValidateDuration`
2. Resolve role and member IDs if role option provided (`resolveRoleAndMemberIds`)
3. API call: `activeAPI(guildId, channelId, userId, minutesActiveConfig, random, users, userIdsWithRole)`
4. Status check via `executeWithStatusCheck`
5. Build embed via `buildActiveEmbed` with activity data
6. Reply with embed

## Options

| Option | Key | Required | Description |
|--------|-----|----------|-------------|
| Duration (minutes) | `duration_minutes` | No | Minutes of activity |
| Duration (hours) | `duration_hours` | No | Hours of activity |
| Duration (days) | `duration_days` | No | Days of activity |
| Users | `users` | No | Max users to consider |
| Random | `random` | No | Random subset size |
| Role | `role` | No | Filter by role (requires GUILD_INTENTS_GRANTED) |
