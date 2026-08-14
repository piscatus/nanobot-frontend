# Transactions Command

**Key:** `transactions`  
**Description:** User Transactions  
**Executable from DM:** Yes (`setDMPermission(true)`)

## Interaction Types

- Read-only
- Pagination (prev/next buttons to navigate list)

## Logic Flow

1. API call: `transactionsAPI(guildId, userId)`
2. Status check via `executeWithStatusCheck`
3. `paginateTransactions` with navigation buttons

## Options

None. Uses `getInteractionContext` for userId; transactions from API.
