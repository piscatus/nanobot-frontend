 CCC  U   U  TTTTT  EEEEE
C     U   U    T    E    
C     U   U    T    EEEE 
C     U   U    T    E    
 CCC   UUU     T    EEEEE

-------------------------

HEADER:
Key=Content-Type
Value=application/json

ENDPOINT:
Method=POST
URL=http://<container>:<port>/requests/cute

BODY:
{
    "dropId": "321",
    "userId": "213"
}

RESPONSE:
Status=200
Data=BaseResponseDto