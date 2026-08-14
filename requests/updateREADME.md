U   U PPPP  DDDD   AAA TTTTT EEEEE
U   U P   P D   D A   A  T   E
U   U PPPP  D   D AAAAA  T   EEEE
U   U P     D   D A   A  T   E
 UUU  P     DDDD  A   A  T   EEEEE

-----------------------

HEADER:
Key=Content-Type
Value=application/json

ENDPOINT:
Method=POST
URL=http://<container>:<port>/requests/update

BODY:
{
    "address": "ban_123",
    "confirmation": true,
    "guildId": "321",
    "userId": "231"
}

RESPONSE:
Status=200
Data=TransferResponseDto