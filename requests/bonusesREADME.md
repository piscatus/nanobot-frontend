 BBBB   OOO   N   N  U   U  SSSS  EEEEE  SSSS
B   B  O   O  NN  N  U   U  S     E      S   
BBBB   O   O  N N N  U   U  SSS   EEEE   SSS 
B   B  O   O  N  NN  U   U     S  E         S
BBBBB   OOO   N   N   UUU   SSSS  EEEEE  SSSS

---------------------------------------------

HEADER:
Key=Content-Type
Value=application/json

ENDPOINT:
Method=POST
URL=http://<container>:<port>/requests/bonuses

BODY:
{
     "guildId": "321",
     "userId": "123"
}

RESPONSE:
Status=200
Data=BonusesResponseDto