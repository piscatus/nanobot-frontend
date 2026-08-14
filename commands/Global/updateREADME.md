# Update Command

**Key:** `update`  
**Description:** Update Deposit Address Representative  
**Executable from DM:** Yes (default)

## Interaction Types

- Confirmation (requires user confirmation before update)

## Logic Flow

1. Validate address via `validateAddress`
2. `executeTransferWithConfirmation` → API: `updateAPI(guildId, userId, confirmed, address)`
3. Build receipt and log embeds via `buildReceiptAndLogEmbeds`
4. `postTransferReceiptAndLog` to withdraw logging channel (ephemeral)

## Options

| Option | Key | Required | Description |
|--------|-----|----------|-------------|
| Address | `address` | Yes | New representative address |
