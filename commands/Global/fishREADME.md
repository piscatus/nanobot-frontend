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

## Options

None. Uses guild context and member roles for fishing permissions.
