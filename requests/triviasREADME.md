TTTTT  RRRR   III  V   V  III    A     SSSS
  T    R   R   I   V   V   I    A A   S
  T    RRRR    I   V   V   I   AAAAA   SSS
  T    R  R    I    V V    I   A   A      S
  T    R   R  III    V    III  A   A  SSSS

-------------------------------------------

HEADER:
Key=Content-Type
Value=application/json

ENDPOINT:
Method=GET
URL=http://<container>:<port>/trivias/categories

RESPONSE:
Status=200
Data=["General Knowledge", "History", "Science"]

NOTES:
- Distinct categories that have at least one enabled question, sorted.
- Used at bot startup to fill `client.commandContext.triviaCategories` for `/triviadrop` autocomplete.
