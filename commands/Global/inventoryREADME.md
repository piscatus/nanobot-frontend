# Inventory Command

**Key:** `inventory`  
**Description:** Creature Balances  
**Executable from DM:** Yes (default)

## Interaction Types

- Read-only
- Paged (currency filter buttons, plus `SUB` prefixed pages when a subordinate
  account is linked)

## Logic Flow

1. API call: `inventoryAPI(guildId, userId)`
2. Status check via `executeWithStatusCheck`
3. `buildInventoryPanels` builds an `ALL` page plus one page per currency present
4. `carousel` renders the pages with a button per filter

Filter buttons are omitted when the inventory spans fewer than two currencies,
since they would duplicate the `ALL` page. A linked subordinate's pages are
appended rather than merged into the same embed, because one field per creature
type means a merged unfiltered view could exceed Discord's 25 field limit.

## Options

None. Uses `getInteractionContext` for userId; subordinate from API response.
