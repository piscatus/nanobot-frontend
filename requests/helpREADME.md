H   H  EEEEE  L      PPPP 
H   H  E      L      P   P
HHHHH  EEEE   L      PPPP 
H   H  E      L      P    
H   H  EEEEE  LLLLL  P    

--------------------------

HEADER:
Key=Content-Type
Value=application/json

ENDPOINT:
Method=POST
URL=http://<container>:<port>/requests/help

BODY:
{
    "guildId": "321",
    "userId": "231"
}

RESPONSE:
Status=200
Data=HelpResponseDto