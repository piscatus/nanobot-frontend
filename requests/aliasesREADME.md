 AAA   L      III   AAA   SSSS  EEEEE  SSSS
A   A  L       I   A   A  S     E      S   
AAAAA  L       I   AAAAA   SSS  EEEE    SSS 
A   A  L       I   A   A      S E          S
A   A  LLLLL  III  A   A  SSSS  EEEEE  SSSS 

--------------------------------------------

HEADER:
Key=Content-Type
Value=application/json

ENDPOINT:
Method=POST
URL=http://<container>:<port>/requests/aliases

BODY:
{
     "global": true,
     "guildId": "321",
     "userId": "123"
}

RESPONSE:
Status=200
Data=AliasesResponseDto