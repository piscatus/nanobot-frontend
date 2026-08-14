DDDD   RRRR    OOO   PPPP
D   D  R   R  O   O  P   P
D   D  RRRR   O   O  PPPP
D   D  R  R   O   O  P
DDDD   R   R   OOO   P

 U   U  PPPP   DDDD    AAA   TTTTT  EEEEE
 U   U  P   P  D   D  A   A    T    E    
 U   U  PPPP   D   D  AAAAA    T    EEEE 
 U   U  P      D   D  A   A    T    E    
  UUU   P      DDDD   A   A    T    EEEEE

-----------------------------------------

HEADER:
Key=Content-Type
Value=application/json

ENDPOINT:
Method=POST
URL=http://<container>:<port>/drops/dropUpdate

BODY:
{
    "dropId": "123",
    "messageId": "321",
}

RESPONSE:
Status=200
Data=BaseResponseDto