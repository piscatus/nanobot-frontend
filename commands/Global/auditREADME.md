# Audit Command

**Key:** `audit`  
**Description:** Audit Liquidity  
**Executable from DM:** Yes (default)

## Interaction Types

- Read-only
- Paged (currency filter buttons)

## Logic Flow

1. `executeReadOnlyEmbedCommand`: API call `auditAPI(guildId, userId)` → status
   check → `buildAuditPanels` → `carousel` with an `ALL` page plus one page per
   audited currency
2. `beforeApiCall` refuses a non-owner's `reveal` before the request is made

Filter buttons are omitted when fewer than two currencies are audited, since a
single filter page would only repeat the summary.

## Panels

The `ALL` page is a fixed size: one row per currency showing what is credited
to users against what the bot holds, plus the overall verdict. Detail lives on the currency
pages so that adding a currency or a creature cannot grow the default view.

This matters because embed descriptions are capped at 4096 characters and
`buildEmbed` clamps fields but not the description. The previous single-embed
report rendered every wallet, creature, and total into one description, which
measured 3065 characters against three currencies and would have failed the
request outright on the next coin.

Each currency page breaks the position down into wallet balances, creature sale
value, total credited, hot wallet reserve, and the headroom or shortfall between
them, followed by the creatures priced in that currency.

## Liquidity

A currency is backed when its hot wallet reserve covers what is credited, which
is wallet balances across users, servers, and active drops, plus the sale value
of every creature held. Balances are credits rather than debts, so the report
uses that word throughout. The bot is liquid when every audited currency is
backed.

A ticker carrying a balance that no currency document describes is listed
separately as untracked and fails the check. It cannot be priced or backed, and
listing it is the only way that verdict is explicable: an unresolvable ticker is
dropped from every formatted row, so the report would otherwise read as illiquid
for no visible reason.

## Privacy

Currencies flagged `concealBalances` in the API (privacy coins) have their
amounts replaced with `?????`, are excluded from the USD totals, and are skipped
by the liquidity check. Excluding them from the totals matters: a total that
included a concealed currency could be differenced against the visible rows to
recover the hidden amount.

For the same reason a concealed currency shows no per-currency verdict mark, and
its currency page withholds the creature breakdown. Publishing either would let
the withheld figure be reconstructed from its parts.

The `reveal` option shows real figures and is restricted to
`BOT_OWNER_USER_ID`. A non-owner passing it is refused outright rather than
being silently shown the concealed report, so it is never ambiguous whether the
figures are real.

## Options

| Option | Key | Required | Description |
|--------|-----|----------|-------------|
| Reveal | `reveal` | No | Show concealed currency balances (Bot owner only) |
