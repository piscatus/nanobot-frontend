# Help Command

**Key:** `help`  
**Description:** Help and Documentation  
**Executable from DM:** Yes (default)

## Interaction Types

- Read-only
- Admin Messages (Administrator can post as public message)

## Logic Flow

1. API call: `helpAPI(guildId, userId)`
2. Status check via `checkStatuses`
3. Build embed options map (General, Awards, Deposits, Drops, etc.)
4. Select embed by `documentation` option
5. `respondWithEmbed` with `getAdminMessageOptions`

## Options

| Option | Key | Required | Description |
|--------|-----|----------|-------------|
| Documentation | `documentation` | Yes | Topic: General, then alphabetical — Awards, Deposits, Drops, Fishing, Gifts, Rains, Sales, Support, Trivia Drops, Updates, Withdrawals |
| Message | `message` | No | Post as public message (Admin only) |
