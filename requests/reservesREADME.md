RRRR  EEEEE SSSS  EEEEE RRRR  V   V EEEEE SSSS 
R   R E     S     E     R   R V   V E     S    
RRRR  EEEE   SSS  EEEE  RRRR  V   V EEEE   SSS 
R  R  E         S E     R  R   V V  E         S
R   R EEEEE SSSS  EEEEE R   R   V   EEEEE SSSS 

------------------------------------

HEADER:
Key=Content-Type
Value=application/json

ENDPOINT:
Method=POST
URL=http://<container>:<port>/requests/reserves

BODY:
{
    "guildId": "321",
    "userId": "231"
}

RESPONSE:
Status=200
Data=ServerResponseDto