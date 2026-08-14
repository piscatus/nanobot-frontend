# Config Command

**Key:** `config`  
**Description:** Configure the Server  
**Executable from DM:** No (`setDMPermission(false)`)

## Interaction Types

- Read-only (writes config via API; no transfer confirmation)

## Logic Flow

1. Require Administrator permission
2. Build guild template from context
3. Route to subcommand handler (e.g. `add_alias`, `fishing_channel`, `activity_duration`)
4. Each handler: validate options → `configAPI(guildTemplate)` → `checkStatuses` (ACCEPTED) → reply with embed

## Options (Subcommands)

| Subcommand | Description |
|------------|-------------|
| `activity_duration` | Set activity duration (days/hours/minutes) |
| `add_alias` | Add server alias (singular, plural, value, emoji) |
| `fishing_bypass_role` | Set fishing bypass role |
| `fishing_error_message` | Set fishing error message |
| `fishing_channel` | Set or clear fishing channel |
| `fishing_frequency` | Set fishing cooldown frequency (days/hours/minutes) |
| `fishing_role` | Set required fishing role |
| `fishing_logging_channel` | Set fishing log channel |
| `transfer_logging_channel` | Set transfer log channel |
| `remove_alias` | Remove server alias |
| `users_active` | Set max active users per channel |
