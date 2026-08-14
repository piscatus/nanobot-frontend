# Leaderboards Command

**Key:** `leaderboards`  
**Description:** Server Fishing Leaderboards  
**Executable from DM:** No (`setDMPermission(false)`)

## Interaction Types

- Read-only
- Pagination (prev/next buttons to navigate list)

## Logic Flow

1. API call: `leaderboardsAPI(guildId, userId)`
2. Status check via `executeWithStatusCheck`
3. `buildLeaderboardData` from response
4. `paginateLeaderboard` with navigation buttons

## Options

None. Guild-scoped; uses `getInteractionContext` for guildId/userId.
