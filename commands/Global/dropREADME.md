# Drop Command

**Key:** `drop`  
**Description:** Transfer Currencies and Creatures to a Message  
**Executable from DM:** No (`setDMPermission(false)`)

## Interaction Types

- Confirmation (requires user confirmation before transfer)

## Logic Flow

1. Validate duration (days/hours/minutes) via `computeAndValidateDuration`
2. Validate users, random (winners) via `validateNumericOption`
3. Validate: winners < users if both set; no role in airdrops channel
4. Validate input via `getAndValidateInput`
5. `executeTransferWithConfirmation` → API: `dropAPI` with duration, roleId, users, winners
6. Send standby embed to channel; on success, edit to final embed with "Join Drop" button
7. `dropUpdateAPI` to link message ID; log to system and guild channels

## Options

| Option | Key | Required | Description |
|--------|-----|----------|-------------|
| Input | `input` | Yes | Transfer amount/items |
| Duration (days) | `duration_days` | No | Drop duration |
| Duration (hours) | `duration_hours` | No | Drop duration |
| Duration (minutes) | `duration_minutes` | No | Drop duration |
| Random | `random` | No | Number of random winners |
| Role | `role` | No | Required role to join |
| Users | `users` | No | Max active users to consider |
