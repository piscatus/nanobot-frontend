 CCCC   U   U  RRRR   RRRR    EEEEE  N   N   CCCC  III  EEEEE  SSSS  
 C      U   U  R   R  R   R   E      NN  N  C       I   E      S    
 C      U   U  RRRR   RRRR    EEEE   N N N  C       I   EEEE    SSS  
 C      U   U  R   R  R   R   E      N  NN  C       I   E          S 
  CCCC   UUUU  R   R  R   R   EEEEE  N   N   CCCC  III  EEEEE  SSSS

--------------------------------------------------------------------

HEADER:
Key=Content-Type
Value=application/json

---

ENDPOINT:
Method=POST
URL=http://<container>:<port>/requests/currencies

BODY:
{
    "dropId": "321",
    "userId": "213"
}

RESPONSE:
Status=200
Data=CurrenciesResponseDto