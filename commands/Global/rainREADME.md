# Rain Command

**Key:** `rain`  
**Description:** Transfer Currencies and Creatures to Active Users  
**Executable from DM:** No (`setDMPermission(false)`)

## Interaction Types

- Confirmation (requires user confirmation before transfer)

## Logic Flow

1. Validate duration via `computeAndValidateDuration`
2. Resolve role members if role option provided
3. Validate input via `getAndValidateInput`
4. `executeTransferWithConfirmation` → API: `rainAPI` with minutesActiveConfig, random, userIdsWithRole, users
5. If no active users: show activity embed; else `postTransferMessageAndLog`

## Options

| Option | Key | Required | Description |
|--------|-----|----------|-------------|
| Input | `input` | Yes | Transfer amount/items |
| Duration (days) | `duration_days` | No | Activity window |
| Duration (hours) | `duration_hours` | No | Activity window |
| Duration (minutes) | `duration_minutes` | No | Activity window |
| Random | `random` | No | Random subset of active users |
| Users | `users` | No | Max active users |
| Role | `role` | No | Filter by role (requires GUILD_INTENTS_GRANTED) |
