# Update Command

**Key:** `update`  
**Description:** Update Deposit Address Representative  
**Executable from DM:** Yes (default)

## Currency Support

Only Nano forks have a representative. The API reports this per currency as
`supportsRepresentative`, and currencies without one (Monero, Bitcoin) are left
out of the help text for this command entirely. A representative update queued
against such a currency is discarded by the backend as a misconfiguration rather
than retried.

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
