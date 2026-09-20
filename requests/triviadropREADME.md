TTTTT  RRRR   III  V   V  III    A    DDDD   RRRR    OOO   PPPP
  T    R   R   I   V   V   I    A A   D   D  R   R  O   O  P   P
  T    RRRR    I   V   V   I   AAAAA  D   D  RRRR   O   O  PPPP
  T    R  R    I    V V    I   A   A  D   D  R  R   O   O  P
  T    R   R  III    V    III  A   A  DDDD   R   R   OOO   P

----------------------------------------------------------------

HEADER:
Key=Content-Type
Value=application/json

ENDPOINT:
Method=PUT
URL=http://<container>:<port>/requests/triviadrop

BODY:
{
    "category": "Science",
    "channelId": "123",
    "confirmation": false,
    "difficulty": "medium",
    "duration": 3,
    "seconds": 15,
    "guildId": "231",
    "input": "1 ban",
    "userId": "213",
    "username": "alice",
    "users": 2
}

RESPONSE:
Status=200
Data=TransferResponseDto

NOTES:
- There is no role or random option: the API forces both off.
- `users` is the maximum number of winners, not a cap on how many people may answer.
- `category` is optional; omit or leave blank for a question from any enabled category.
- `difficulty` is optional (`easy`, `medium`, or `hard`); omit or leave blank for a question of any difficulty.
- `seconds` is optional leftover seconds (0–59). Alone (no `duration` minutes), the floor is 10. Under 10 is allowed when minutes is greater than 0.
- Before confirmation the API fails fast on an unknown category, a difficulty that is not `easy`/`medium`/`hard`, or a filter pair with no enabled questions.
- The confirmation preview's `drop.trivia` carries only the requested `category` and `difficulty` so the embed can show Category, Difficulty, and "Maximum Winners". The real question is picked after confirmation.
- The attached question is on `drop.trivia`. Answers are already shuffled. `correctIndex` is write-only and is not returned in the JSON response.
