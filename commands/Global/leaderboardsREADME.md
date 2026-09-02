# Leaderboards Command

**Key:** `leaderboards`  
**Description:** Server Fishing Leaderboards  
**Executable from DM:** No (`setDMPermission(false)`)

## Interaction Types

- Read-only
- Currency select menu (scope which creatures are listed)
- Creature select menu (jump straight to one board)
- Pagination (wrap/prev/next buttons plus jump-to-my-rank)

## Logic Flow

1. API call: `leaderboardsAPI(guildId, userId)`
2. Status check via `executeWithStatusCheck`
3. `buildLeaderboardData` from response
4. `paginateLeaderboard` with the menus and navigation buttons

Guild-scoped; uses `getInteractionContext` for guildId/userId.

## Options

| Name       | Type   | Required | Description                                  |
| ---------- | ------ | -------- | -------------------------------------------- |
| `currency` | String | No       | Only show creatures for one currency         |
| `creature` | String | No       | Jump straight to one creature's leaderboard  |

`currency` uses choices resolved from the API at startup, the same way `/fish`
does. `creature` uses **autocomplete**, and narrows to `currency` when both are
given.

## Why the creature option is autocompleted

Discord caps a slash command choice list, and a select menu, at 25 entries. Four
currencies of eight creatures is 32, so a flat creature list cannot hold the
roster and some creatures would simply be unreachable. Autocomplete has no such
ceiling: it returns only the matches for what has been typed, up to 25 at a
time. It is answered from the creature list cached at startup on
`client.commandContext`, because Discord discards a suggestion response after
three seconds and an API call per keystroke would not be safe.

## Scoping

The same 25-entry cap drives the two menus. The currency menu scopes the board,
and the creature menu lists only that currency's creatures, so each stays at
roughly eight entries no matter how large the roster grows.

`All Currencies` is offered only while every creature still fits one menu. Past
that a currency has to be chosen first, which is what keeps every creature
reachable. The currency menu is hidden entirely when a single currency has a
board, since "all" and that currency would be the same list.

Wrapping with the outer arrows stays inside the chosen currency, so it can never
carry the board somewhere the menus say you are not. Choosing either menu resets
to page one. The wrap arrows are disabled when the scope holds one creature, and
the page arrows are disabled at the ends. Controls stay live for five minutes.
