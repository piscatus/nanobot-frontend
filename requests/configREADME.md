 CCCC   OOO   N   N  FFFFF  III   GGG  
C      O   O  NN  N  F       I   G     
C      O   O  N N N  FFFF    I   G  GG 
C      O   O  N  NN  F       I   G   G 
 CCCC   OOO   N   N  F      III   GGGG 

--------------------------------------

HEADER:
Key=Content-Type
Value=application/json

ENDPOINT:
Method=PUT
URL=http://<container>:<port>/requests/config

BODY:
{
     "guildId": "321",
     "userId": "123",
     "status": "ACTIVE",
     "fishingLoggingChannelId": "1095914547730692551",
     "fishingChannelId": "957364171215896646",
     "fishingRole": "926034496980152363",
     "fishingBypassRoles": ["213"],
     "fishingError": "You need to vote first",
     "fishingFrequency": 15,
     "maximumMinutesActive": 30,
     "maximumActiveUsers": 40,
     "transferLoggingChannelId": "1095914547730692551",
}

RESPONSE:
Status=202
Data=ConfigResponseDto