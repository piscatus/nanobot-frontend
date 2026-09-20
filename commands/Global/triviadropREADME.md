# Trivia Drop Command

**Key:** `triviadrop`  
**Description:** Transfer Currencies and Creatures to a Trivia Question  
**Executable from DM:** No (`setDMPermission(false)`)

A `/drop` variant: the executor escrows a reward and a random multiple-choice trivia question is attached. There is no `random` or `role` option — trivia drops are open to everyone, and speed plus knowledge decide.

## Interaction Types

- Confirmation (requires user confirmation before transfer)
- Autocomplete on `category` from `client.commandContext.triviaCategories` (loaded at startup and refreshed every 5 minutes, because a category only appears once at least one question in it is enabled; Discord discards a suggestion response after three seconds)
- Fixed choices on `difficulty` (`easy`, `medium`, `hard`); empty means any

## Logic Flow

1. Validate `duration_minutes` (1–60) and `duration_seconds` (0–59) via `computeAndValidateTriviaDuration`. Seconds under 10 are rejected only when minutes is not > 0. Neither option means the API default of 3 minutes.
2. Validate `users` via `validateNumericOption` — this is the **maximum number of winners**, not a cap on how many people may answer (default unlimited, still capped by divisibility like `/drop`)
3. Resolve `category` against the cached list (`resolveCategory`); empty means any category
4. Read `difficulty` from the fixed choice list; empty means any
5. Validate input via `getAndValidateInput`
6. `executeTransferWithConfirmation` → API: `triviadropAPI` with duration, users, input, username, category, difficulty, seconds
7. Send the live embed to the channel (value line + question; **answers are only on buttons**, never in the embed, and there is no footer)
8. `dropUpdateAPI` to link the message ID; edit in the `trivia:0`–`trivia:3` answer buttons; log to system and guild channels

The confirmation embed shows Category and Difficulty when those were specified, and labels the users cap **Maximum Winners**. The API fails fast before asking for confirmation when the category is unknown ("There are no trivia questions in the category `<typed>`, sorry! Pick a category from the suggestions."), the difficulty is not one of `easy`, `medium` or `hard` ("Trivia difficulty must be one of `easy`, `medium` or `hard`."), or no enabled question matches the filters.

Clicking an answer button records a pickup with `answerIndex`. The ephemeral reply only says the answer was locked in — never whether it was right. One answer per user.

The drop ends when the timer runs out **or** when the `users`-th correct answer arrives. At the end, the first `users` correct answers by timestamp share the reward evenly; if nobody was right the reward is refunded to the dropper. The end embed reveals the question, the correct answer, and `Answered: N (M correct)`.

Generated questions are imported with `enabled: false` and only used once a human enables them.

## Options

| Option | Key | Required | Description |
|--------|-----|----------|-------------|
| Input | `input` | Yes | Transfer amount/items |
| Category | `category` | No | Autocomplete from enabled trivia categories; empty = any |
| Difficulty | `difficulty` | No | Fixed choices: `easy`, `medium`, `hard`; empty = any |
| Duration (minutes) | `duration_minutes` | No | 1–60 minutes (default 3 when seconds is also empty) |
| Duration (seconds) | `duration_seconds` | No | 0–59 leftover seconds. Alone, 10–59. Under 10 is allowed when minutes > 0 |
| Users | `users` | No | Maximum number of winners (not max answerers) |
