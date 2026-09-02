# Receive Command

**Key:** `receive`  
**Description:** Deposit Addresses  
**Executable from DM:** Yes (default)

## Interaction Types

- Read-only
- Paged (one button per enabled currency)

## Logic Flow

1. API call: `receiveAPI(guildId, userId)`
2. Status check via `executeWithStatusCheck`
3. `buildReceivePanels` builds one panel per enabled currency
4. `carousel` renders the panels with a button per currency

Panels are ordered by ticker rather than by the order the API returned them, so
adding a currency cannot quietly reshuffle the buttons.

A currency renders as unavailable when deposits are disabled for it, or when the
backend returned no address (for example a wallet being unreachable), rather than
showing an address that cannot receive funds.

Each panel states how many confirmations that currency settles after, via
`formatConfirmationRequirement`. This is not cosmetic: deposits range from one
block on Nano to ten on Monero, and without it a user watching a confirmed
transaction with no credited balance has no way to tell whether anything is
wrong.

Where the address comes from differs by protocol, though nothing here needs to
know that. Nano and Banano derive it from the user's seed; Monero and Bitcoin
allocate one from a hot wallet and store the mapping. The one visible
consequence is that a currency with no account explorer, such as Monero, renders
its title unlinked.

## Options

None. Uses `getInteractionContext` for userId; addresses from API.
