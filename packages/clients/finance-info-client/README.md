Client to get information about Organization and Bank
==

Based on dadata search with caching in redis

***

## How to use:
tin = ИНН,
iec = КПП,
territoryCode = ОКТМО,
psrn = ОГРН

```js
const { getOrganizationInfo } = require('@open-condo/clients/finance-info-client')

getOrganizationInfo('2721112498').then(console.log)
```

```json
{
    "error": null,
    "result": {
        "timezone": "UTC+10",
        "territoryCode": "08701000001",
        "iec": "272101001",
        "tin": "2721112498",
        "psrn": "1042700134179",
        "name": "ТСЖ \"ЛЕРМОНТОВА\"",
        "country": "ru"
    }
}


```
offsettingAccount = кор/с, routingNumber = БИК,
```js
const { getBankInfo } = require('@open-condo/clients/finance-info-client')

getBankInfo('040813608').then(console.log)
```
```json
{
  "error": null,
  "result": {
    "routingNumber": "040813608",
    "bankName": "ДАЛЬНЕВОСТОЧНЫЙ БАНК ПАО СБЕРБАНК",
    "offsettingAccount": "30101810600000000608",
    "territoryCode": "08701000001"
  }
}

```