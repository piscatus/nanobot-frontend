# Rules Command

**Key:** `rules`  
**Description:** Server Rules  
**Executable from DM:** No (guild-only; deployed to home server)

## Interaction Types

- Read-only
- Admin Mod Messages (Admin/Mod role can post as public message)

## Logic Flow

1. API call: `rulesAPI(guildId, userId)`
2. Status check via `checkStatuses`
3. Build embed from channel option via `formatRulesMap`
4. `respondWithEmbed` with `isPrivileged` from `PRIVILEGED_ROLE_IDS` (owner, admin, mod)

## Options

| Option | Key | Required | Description |
|--------|-----|----------|-------------|
| Channel | `channel` | Yes | Rule set: Server, Support, General, Off-topic, Images, Media, Tip Chat, Airdrops, Fishing, Swaps, Trades |
| Message | `message` | No | Post as public message (Admin/Mod only) |
