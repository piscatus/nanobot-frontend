 GGGG  III  FFFFF TTTTT
G       I   F       T  
G  GG   I   FFFF    T  
G   G   I   F       T  
 GGGG  III  F       T  

-----------------------

HEADER:
Key=Content-Type
Value=application/json

ENDPOINT:
Method=PUT
URL=http://<container>:<port>/requests/gift

BODY:
{
    "channelId": "123",
    "confirmation": false,
    "guildId": "321",
    "input": "1 Banano",
    "receiverIds": "0",
    "userId": "123"
}

RESPONSE:
Status=200
Data=TransferResponseDto