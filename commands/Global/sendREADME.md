# Send Command

**Key:** `send`  
**Description:** Wallet Withdrawal  
**Executable from DM:** Yes (default)

## Interaction Types

- Confirmation (requires user confirmation before withdrawal)

## Logic Flow

1. Validate address via `validateAddress`
2. Validate input via `getAndValidateInput`
3. `executeTransferWithConfirmation` → API: `sendAPI(guildId, userId, confirmed, input, address)`
4. Build receipt and log embeds via `buildReceiptAndLogEmbeds`
5. `postTransferReceiptAndLog` to withdraw logging channel (ephemeral)

## Options

| Option | Key | Required | Description |
|--------|-----|----------|-------------|
| Input | `input` | Yes | Withdrawal amount (e.g. "10 Banano") |
| Address | `address` | Yes | Destination address |
