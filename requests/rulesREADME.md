RRRR   U   U L     EEEEE  SSSS 
R   R  U   U L     E     S     
RRRR   U   U L     EEEE   SSS  
R  R   U   U L     E         S 
R   R   UUU  LLLLL EEEEE SSSS  

------------------------------

HEADER:
Key=Content-Type
Value=application/json

ENDPOINT:
Method=POST
URL=http://<container>:<port>/requests/rules

BODY:
{
    "guildId": "321",
    "userId": "231"
}

RESPONSE:
Status=200
Data=BaseResponseDto