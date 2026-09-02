# Send Command

**Key:** `send`  
**Description:** Wallet Withdrawal  
**Executable from DM:** Yes (default)

## Fees and Settlement

Withdrawals leave the bot, so unlike gifts and rain they cost whatever the
network charges. Nano and Banano are feeless; Monero and Bitcoin are not.

The fee is deducted from the amount sent rather than added on top, so a user
asking to withdraw ten receives ten minus the fee. That keeps the ledger exact:
the hot wallet drops by precisely what was taken from the balance.

The minimum a user must clear is therefore `minimumWithdraw + feeEstimate`, which
`getEffectiveMinimumWithdraw` computes and the confirmation embed shows.
Settlement is not instant either: `formatConfirmationRequirement` renders the
currency's confirmation depth, which ranges from one block on Nano to ten on
Monero.

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
| Input | `input` | Yes | Withdrawal amount (e.g. "10 Banano", "0.001 BTC") |
| Address | `address` | Yes | Destination address |
