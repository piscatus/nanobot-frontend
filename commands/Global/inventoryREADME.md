# Inventory Command

**Key:** `inventory`  
**Description:** Creature Balances  
**Executable from DM:** Yes (default)

## Interaction Types

- Read-only
- Swappable (swap button to toggle user vs subordinate view)

## Logic Flow

1. API call: `inventoryAPI(guildId, userId)`
2. Status check via `executeWithStatusCheck`
3. If subordinate exists: `swap` with user and subordinate inventory panels
4. Else: reply with `buildInventoryEmbed`

## Options

None. Uses `getInteractionContext` for userId; subordinate from API response.
