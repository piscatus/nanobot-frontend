FFFFF  III   SSS  H   H
F       I   S     H   H
FFFF    I    SSS  HHHHH
F       I      S  H   H
F      III  SSS   H   H

-----------------------

HEADER:
Key=Content-Type
Value=application/json

ENDPOINT:
Method=PUT
URL=http://<container>:<port>/requests/fish

BODY:
{
    "guildId": "231",
    "userId": "213",
    "userRoles": [ '123', '321', '231' ],
    "ticker": "XNO"
}

TICKER:
Omitted or null = fish with the user's saved default for this guild
"XNO"            = fish that currency and save it as the default
"ANY"            = clear the saved default and fish for anything

RESPONSE:
Status=200
Data=FishResponseDto

The response carries defaultTicker (the default after this request, null for
any) and defaultTickerChanged (whether this request changed it).