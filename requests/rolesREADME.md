RRRR   OOO   L     EEEEE  SSSS 
R   R O   O  L     E     S     
RRRR  O   O  L     EEEE   SSS  
R  R  O   O  L     E         S 
R   R  OOO   LLLLL EEEEE SSSS  

------------------------------

HEADER:
Key=Content-Type
Value=application/json

ENDPOINT:
Method=POST
URL=http://<container>:<port>/requests/roles

BODY:
{
    "guildId": "321",
    "userId": "231"
}

RESPONSE:
Status=200
Data=BaseResponseDto