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

| Name       | Type   | Required | Description                                |
| ---------- | ------ | -------- | ------------------------------------------ |
| `currency` | String | No       | Fish for a specific currency's creatures   |

Omit `currency` to catch anything the server's reserves can cover. Choose one
to fish only that currency's creatures, which is useful when closing in on a
full stack of a particular creature.

The API rejects a currency the server cannot serve, either because no creatures
are stocked for it or because its reserves are too low, and the error names the
currencies that are available instead. A rejected request does not start the
fishing cooldown.

### Currency choices

Discord fixes a command's choices when it is deployed, so the list is built once
at startup by `buildData()` from `GET /currencies` and `GET /creatures`. Choices
are labelled `Name [TICKER]` and cover only enabled currencies that have at
least one creature, so a currency appears as soon as creatures exist for it and
the bot restarts. If either request fails the command deploys with no option at
all and fishing keeps working, just untargeted.
