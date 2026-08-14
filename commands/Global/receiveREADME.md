# Receive Command

**Key:** `receive`  
**Description:** Deposit Addresses  
**Executable from DM:** Yes (default)

## Interaction Types

- Read-only
- Swappable (swap button to toggle primary vs subordinate addresses)

## Logic Flow

1. API call: `receiveAPI(guildId, userId)`
2. Status check via `executeWithStatusCheck`
3. `buildReceiveSwapParams` for primary and subordinate addresses
4. `swap` with two address panels

## Options

None. Uses `getInteractionContext` for userId; addresses from API.
