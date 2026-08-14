# Roles Command

**Key:** `roles`  
**Description:** Server Roles  
**Executable from DM:** No (guild-only; deployed to home server)

## Interaction Types

- Read-only
- Admin Mod Messages (Admin/Mod role can post as public message)

## Logic Flow

1. API call: `rolesAPI(guildId, userId)`
2. Status check via `checkStatuses`
3. Build embed from role option (e.g. Level roles)
4. `respondWithEmbed` with `isPrivileged` from `PRIVILEGED_ROLE_IDS` (owner, admin, mod)

## Options

| Option | Key | Required | Description |
|--------|-----|----------|-------------|
| Role | `role` | Yes | Role type (e.g. Level) |
| Message | `message` | No | Post as public message (Admin/Mod only) |
