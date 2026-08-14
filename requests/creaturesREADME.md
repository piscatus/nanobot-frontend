 CCCC  RRRR   EEEEE    AAA   TTTTT  U   U  RRRR   EEEEE  SSSS  
C      R   R  E       A   A    T    U   U  R   R  E      S     
C      RRRR   EEEE    AAAAA    T    U   U  RRRR   EEEE    SSS  
C      R  R   E       A   A    T    U   U  R  R   E          S 
 CCCC  R   R  EEEEE   A   A    T     UUU   R   R  EEEEE  SSSS  

--------------------------------------------------------------

HEADER:
Key=Content-Type
Value=application/json

ENDPOINT:
Method=POST
URL=http://<container>:<port>/requests/creatures

BODY:
{
    "guildId": "321",
    "userId": "213"
}

RESPONSE:
Status=200
Data=CreaturesResponseDto