L      EEEEE   AAA   DDDD   EEEEE  RRRR   BBBB   OOO     AAA   RRRR   DDDD    SSS 
L      E      A   A  D   D  E      R   R  B   B  O   O  A   A  R   R  D   D  S    
L      EEEE   AAAAA  D   D  EEEE   RRRR   BBBB   O   O  AAAAA  RRRR   D   D   SSS 
L      E      A   A  D   D  E      R  R   B   B  O   O  A   A  R  R   D   D     S 
LLLLL  EEEEE  A   A  DDDD   EEEEE  R   R  BBBB   OOO    A   A  R   R  DDDD   SSS  

---------------------------------------------------------------------------------

HEADER:
Key=Content-Type
Value=application/json

ENDPOINT:
Method=POST
URL=http://<container>:<port>/requests/leaderboards

BODY:
{
    "guildId": "321",
    "userId": "231"
}

RESPONSE:
Status=200
Data=LeaderboardsResponseDto