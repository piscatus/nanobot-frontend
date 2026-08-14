# Gift Command

**Key:** `gift`  
**Description:** Transfer Currencies and Creatures to a User  
**Executable from DM:** No (`setDMPermission(false)`)

## Interaction Types

- Confirmation (requires user confirmation before transfer)

## Logic Flow

1. Validate: cannot gift to self
2. Validate input via `getAndValidateInput`
3. `executeTransferWithConfirmation` → API: `giftAPI(guildId, channelId, userId, [gifted], confirmed, input)`
4. `postTransferMessageAndLog` with recipient info

## Options

| Option | Key | Required | Description |
|--------|-----|----------|-------------|
| User | `user` | Yes | Recipient |
| Input | `input` | Yes | Transfer amount/items |
