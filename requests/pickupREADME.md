PPPP   III  CCCC  K   K  U   U  PPPP 
P   P   I  C      K  K   U   U  P   P
PPPP    I  C      KKK    U   U  PPPP 
P       I  C      K  K   U   U  P    
P      III  CCCC  K   K   UUU   P    

-------------------------------------

HEADER:
Key=Content-Type
Value=application/json

ENDPOINT:
Method=POST
URL=http://<container>:<port>/requests/pickup

BODY:
{
    "dropId:": "123",
    "userId": "231",
    "userRoles": [ '123', '321', '231' ]
}

On a trivia drop the body also includes `answerIndex` (the 0-based button
that was pressed). Omit it on a plain drop.

BODY (trivia drop):
{
    "dropId": "123",
    "userId": "231",
    "userRoles": [ '123', '321', '231' ],
    "answerIndex": 2
}

RESPONSE:
Status=200
Data=BaseResponseDto