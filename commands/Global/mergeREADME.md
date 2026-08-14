# Merge Command

**Key:** `merge`  
**Description:** Consolidate Subordinate Currencies and Creatures  
**Executable from DM:** Yes (default)

## Interaction Types

- Confirmation (requires user confirmation before merge transfer)

## Logic Flow

1. `executeTransferWithConfirmation` → API: `mergeAPI(guildId, userId, confirmed)`
2. Build receipt and log embeds via `buildReceiptAndLogEmbeds`
3. `postTransferReceiptAndLog` to transfer logging channel

## Options

None. Merge consolidates subordinate (linked account) items into primary.
