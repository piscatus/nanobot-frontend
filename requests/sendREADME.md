 SSS  EEEEE N   N DDDD 
S     E     NN  N D   D
 SSS  EEEE  N N N D   D
    S E     N  NN D   D
SSSS  EEEEE N   N DDDD 

-----------------------

HEADER:
Key=Content-Type
Value=application/json

ENDPOINT:
Method=POST
URL=http://<container>:<port>/requests/send

BODY:
{
    "address": "ban_123",
    "confirmation": true,
    "guildId": "321",
    "input": "2.5 BAN",
    "userId": "231"
}

RESPONSE:
Status=200
Data=TransferResponseDto