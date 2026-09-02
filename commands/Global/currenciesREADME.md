# Currencies Command

**Key:** `currencies`  
**Description:** Currencies List  
**Executable from DM:** Yes (default)

## Interaction Types

- Read-only
- Admin Messages (Administrator can post as public message)

## Logic Flow

1. `executeReadOnlyEmbedCommand`: API call `currenciesAPI(guildId, userId)` → status check → `buildCurrencyPanels` → `carousel` with an `ALL` page plus one page per enabled currency

When the admin `message` option is used the reply is posted publicly as a single
static embed built by `formatCurrencies`, since a component collector is scoped
to the requesting user and would do nothing for other readers.

## Options

| Option | Key | Required | Description |
|--------|-----|----------|-------------|
| Message | `message` | No | Post as public message (Admin only) |
