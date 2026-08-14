# Sell Command

**Key:** `sell`  
**Description:** Exchange Creatures for Currencies  
**Executable from DM:** Yes (default)

## Interaction Types

- Confirmation (requires user confirmation before exchange)

## Logic Flow

1. Validate input via `getAndValidateInput`
2. `executeTransferWithConfirmation` → API: `sellAPI(guildId, userId, confirmed, input)`
3. Build receipt and log embeds via `buildReceiptAndLogEmbeds`
4. `postTransferReceiptAndLog` to sale logging channel

## Options

| Option | Key | Required | Description |
|--------|-----|----------|-------------|
| Input | `input` | Yes | Creatures to sell (e.g. "5 Kraken") |
