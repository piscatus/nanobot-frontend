# Creatures Command

**Key:** `creatures`  
**Description:** Creatures List  
**Executable from DM:** Yes (default)

## Interaction Types

- Read-only
- Admin Messages (Administrator can post as public message)

## Logic Flow

1. `executeReadOnlyEmbedCommand`: API call `creaturesAPI(guildId, userId)` → status check → `buildCreaturePanels` → `carousel` with an `ALL` page plus one page per currency that has creatures

Filter pages come from the tickers present on the creature list, so a currency
with no creatures gets no page and a new currency appears automatically. When the
admin `message` option is used the reply is posted publicly as a single static
embed, since a component collector is scoped to the requesting user.

## Options

| Option | Key | Required | Description |
|--------|-----|----------|-------------|
| Message | `message` | No | Post as public message (Admin only) |
