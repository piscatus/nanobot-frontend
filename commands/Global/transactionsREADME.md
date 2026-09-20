# Transactions Command

**Key:** `transactions`  
**Description:** User Transactions  
**Executable from DM:** Yes (`setDMPermission(true)`)

## Interaction Types

- Read-only
- Filter select menu (narrow the list to one kind of transaction)
- Pagination (first/prev/next/last buttons, one transaction per page)

## Logic Flow

1. API call: `transactionsAPI(guildId, userId)`
2. Status check via `executeWithStatusCheck`
3. `paginateTransactions` with the filter menu and navigation buttons

## Options

| Name   | Type   | Required | Description                          |
| ------ | ------ | -------- | ------------------------------------ |
| `type` | String | No       | Only show one kind of transaction    |

Omit `type` to open on the full history. Supplying it opens pre-filtered, which
saves paging to a kind you already know you want.

## Filtering

The API returns the user's whole 30-day history in one call, so filtering and
paging both happen client side and switching filters is instant. The API purges
anything older nightly, and the embed says so directly under the balances note
so nobody goes looking for a transaction that has already been dropped.

The select menu is built from the user's own history by
`buildTransactionFilterOptions`, and each entry carries a live count, for
example `Deposits (2)` next to `Fishing (98)`. Kinds the user has none of are
left out entirely; listing them would bury the entry someone is hunting for,
which is the problem the filter exists to solve. A kind requested through the
`type` option is kept even at a count of zero so it still reads as active. A
command that starts recording transactions before it is added to
`TRANSACTION_FILTERS` still gets a generated entry, so nothing is unreachable.

Choosing a filter resets to page one. Transaction numbers come from position in
the *unfiltered* history, so an entry keeps the same number however it was
reached. The footer names the active filter and how much of the whole it covers,
for example `Deposits • Page 1 of 2 • 2 of 127 transactions`.

The menu is hidden when the history holds fewer than two kinds, since there
would be nothing to switch between. Controls stay live for five minutes.
