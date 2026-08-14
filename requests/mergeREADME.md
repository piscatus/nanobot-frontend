M   M  EEEEE  RRRR   GGGG  EEEEE
MM MM  E      R   R  G     E    
M M M  EEEE   RRRR   G  GG EEEE 
M   M  E      R  R   G   G E    
M   M  EEEEE  R   R   GGG  EEEEE

--------------------------------

HEADER:
Key=Content-Type
Value=application/json

ENDPOINT:
Method=POST
URL=http://<container>:<port>/requests/merge

BODY:
{
    "confirmation": true,
    "guildId": "321",
    "userId": "231"
}

RESPONSE:
Status=200
Data=TransferResponseDto