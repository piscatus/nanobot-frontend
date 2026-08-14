 SSS  EEEEE L     L     
S     E     L     L     
 SSS  EEEE  L     L     
    S E     L     L     
SSSS  EEEEE LLLLL LLLLL 

-----------------------

HEADER:
Key=Content-Type
Value=application/json

ENDPOINT:
Method=POST
URL=http://<container>:<port>/requests/sell

BODY:
{
    "confirmation": false,
    "guildId": "321",
    "input": "10 fish",
    "userId": "231"
}

RESPONSE:
Status=200
Data=TransferResponseDto