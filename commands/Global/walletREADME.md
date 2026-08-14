# Wallet Command

**Key:** `wallet`  
**Description:** Currency Balances  
**Executable from DM:** Yes (default)

## Interaction Types

- Read-only
- Swappable (swap button to toggle user vs subordinate view)

## Logic Flow

1. API call: `walletAPI(guildId, userId)`
2. Status check via `executeWithStatusCheck`
3. If subordinate exists: `swap` with user and subordinate wallet panels
4. Else: reply with embed (color, title, description, fields)

## Options

None. Uses `getInteractionContext` for userId; subordinate from API response.
