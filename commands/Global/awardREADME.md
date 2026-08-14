# Award Command

**Key:** `award`  
**Description:** Transfer Currencies and Creatures to Users with a Role  
**Executable from DM:** No (`setDMPermission(false)`)

## Interaction Types

- Confirmation (requires user confirmation before transfer)

## Logic Flow

1. Validate input via `getAndValidateInput`
2. Validate role: must be server role, not guild ID
3. Resolve role members via `resolveRoleAndMemberIds` (exclude issuer)
4. Validate: at least 1 user, max `MAXIMUM_USERS_ACTIVE`
5. `executeTransferWithConfirmation` → API: `giftAPI` with userIdsWithRole
6. `postTransferMessageAndLog` with recipient info

## Options

| Option | Key | Required | Description |
|--------|-----|----------|-------------|
| Role | `role` | Yes | Target role for recipients |
| Input | `input` | Yes | Transfer amount/items (e.g. "10 Banano") |
