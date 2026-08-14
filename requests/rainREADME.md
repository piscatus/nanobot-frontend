RRRR    AAA   IIIII N   N
R   R  A   A    I   NN  N
RRRR   AAAAA    I   N N N
R  R   A   A    I   N  NN
R   R  A   A  IIIII N   N

-------------------------

HEADER:
Key=Content-Type
Value=application/json

ENDPOINT:
Method=POST
URL=http://<container>:<port>/requests/rain

BODY:
{
    "channelId": "123",
    "confirmation": false,
    "duration": 60,
    "guildId": "321",
    "input": "1 Nano",
    "random": 0,
    "userId": "231",
    "userIdsWithRole": [ '0' ],
    "users": 0
}

RESPONSE:
Status=200
Data=TransferResponseDto