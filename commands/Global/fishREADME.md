# Fish Command

**Key:** `fish`  
**Description:** Fish for Creatures  
**Executable from DM:** No (`setDMPermission(false)`)

## Interaction Types

- Verification (captcha puzzle before first fish)
- Read-only (no transfer confirmation; creature awarded directly)

## Logic Flow

1. Check verification status via `verificationsApi.check(userId)`
2. If verified: API call `fishAPI` → status check → `runFishSuccess` (receipt, channel message, logging)
3. If not verified: `sendVerificationCaptchaPuzzle` from `utils/buttonUtil.js` with emoji selection; on correct choice → `handleCaptchaSuccess` → fish flow

Guild context and member roles drive fishing permissions.

## Options

| Name       | Type   | Required | Description                                        |
| ---------- | ------ | -------- | -------------------------------------------------- |
| `currency` | String | No       | Set your default fishing currency for this server   |

`currency` is a setting, not a one-off filter. Choosing one both catches that
currency's creature now and saves it as the user's default for the guild, so
every later `/fish` with no option catches the same currency without having to
pick it again. Choosing `Any` clears the default and goes back to catching
whatever the server's reserves can cover.

The default is stored per user per guild on the `anglers` document, alongside
the fishing cooldown, so the same user can prefer a different currency in each
server.

When the default changes, the receipt gains a **Default Currency** section
confirming what it changed to and how to undo it. Routine trips that change
nothing do not show it.

### When the default cannot be served

The API rejects a currency the server cannot serve, either because no creatures
are stocked for it or because its reserves are too low, and the error names the
currencies that are available instead. A rejected request does not start the
fishing cooldown.

A saved default gets its own wording, because the user did not name a currency
on that request: the error says which default is set and tells them to pick
`Any` to clear it. This is deliberately strict rather than quietly falling back
to another currency, so a catch is always the currency that was asked for.

For the same reason a currency is only saved as the default once it is known to
be fishable. Saving one that cannot be served would reject every later trip made
without an option. The save does happen before the inventory and cooldown
checks, though, so a full inventory or an unfinished cooldown still lets a user
change what they fish for.

### Currency choices

Discord fixes a command's choices when it is deployed, so the list is built once
at startup by `buildData()` from `GET /currencies` and `GET /creatures`. Choices
are labelled `Name [TICKER]` and cover only enabled currencies that have at
least one creature, so a currency appears as soon as creatures exist for it and
the bot restarts. `Any` is prepended and counts against the 25 choices Discord
allows.

If either request fails the command deploys with no option at all. Fishing keeps
working and saved defaults are still honoured, but nobody can change theirs
until the API answers again.
