# Cute Command

**Key:** `cute`  
**Description:** Post a Cute Picture  
**Executable from DM:** Yes (default)

## Interaction Types

- Read-only (displays image; no transfer)

## Logic Flow

1. API call: `cute(guildId, userId)` for command status
2. Status check via `executeWithStatusCheck`
3. Get category from options; select random image from `cute/<category>` directory
4. If guild: `sendWithFile` to channel; if DM: send file to user
5. Reply with success embed

## Options

| Option | Key | Required | Description |
|--------|-----|----------|-------------|
| Category | `category` | No | Animal: Bird, Bunny, Cat, Dog, Rat, Random |
