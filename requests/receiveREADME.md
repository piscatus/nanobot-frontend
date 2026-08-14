RRRR   EEEEE  CCCC  EEEEE IIIII V   V EEEEE
R   R  E     C      E       I   V   V E    
RRRR   EEEE  C      EEEE    I   V   V EEEE 
R  R   E     C      E       I    V V  E    
R   R  EEEEE  CCCC  EEEEE IIIII   V   EEEEE

-------------------------------------------

HEADER:
Key=Content-Type
Value=application/json

ENDPOINT:
Method=POST
URL=http://<container>:<port>/requests/receive

BODY:
{
    "guildId": "321",
    "userId": "231"
}

RESPONSE:
Status=200
Data=ReceiveResponseDto