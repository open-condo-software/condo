# condo-bicrypt-sign
npm package to create gost2012 eds for eps and sbbol (unix only)

# Install
```bash
yarn add https://github.com/open-condo-software/condo-bicrypt-sign
```

# Fixed bug
No need to run patchelf - Link to dynamic library is stored in relative path


# Usage
```js
const {
    CondoBicryptSign,
} = require('condo-bicrypt-sign')

const textToSign = `
<?xml version="1.0" encoding="UTF-8"?>
<order>
    <action>order_pay</action>
    <agent>A9038/01</agent>
    <terminal>903801V</terminal>
    <pay_type>ПЛАСТ_СПИС</pay_type>
    <summa>2115.37</summa>
    <commission>21.15</commission>
    <step>prepare</step>
    <services>
        <serv isClosed="0" hideBankDetail="0">
            <serv_id>112844314878</serv_id>
            <bic>044525256</bic>
            <schet>40702810996180000019</schet>
            <l_sc>960</l_sc>
            <inn>3328022709</inn>
            <name_schet>ООО  ЖСС</name_schet>
            <name_serv>ЖИЛИЩНО-СЕРВИСНАЯ СЛУЖБА</name_serv>
            <num_org>3863539688</num_org>
            <bank_name>ПАО РОСБАНК</bank_name>
            <corr_schet>30101810000000000256</corr_schet>
            <storno_disabled>0</storno_disabled>
            <type_payment>2</type_payment>
            <sys_message/>
            <kpp>332801001</kpp>
            <pars>
                <par step="1" name="ЛИЦЕВОЙ СЧЕТ" fullname="Лицевой счет" comment="Введите лицевой счет, не менее 3-х и не более 30-ти символов." type="T" min_length="0" max_length="30" isValidateOnLine="1" isRequired="1" isVisible="1" isScanable="1" isEditable="1" isPrinted="1" double_input="0" value="126" reg_exp="" from_debt="0"/>
                <par step="2" name="ФИО_ПЛАТЕЛЬЩИКА" fullname="ФИО" comment="Фамилия Имя Отчество полностью" type="T" min_length="2" max_length="60" isValidateOnLine="0" isRequired="1" isVisible="1" isScanable="0" isEditable="1" isPrinted="1" double_input="0" value="СОЛОВЬЕВ ВЛАДИМИР ЕВГЕНЬЕВИЧ" reg_exp="" from_debt="0"/>
                <par step="2" name="АДРЕС" fullname="Адрес" comment="Город или населенный пункт, улица, номер дома, номер квартиры" type="C" min_length="1" max_length="50" isValidateOnLine="0" isRequired="1" isVisible="1" isScanable="0" isEditable="1" isPrinted="1" double_input="0" value="ВЛАДИМИР Г, МАЛЫЕ РЕМЕННИКИ УЛ, ДОМ № 11, ОФ. 1" reg_exp="" from_debt="0"/>
                <par step="2" name="ПЕРИОД ОПЛАТЫ" fullname="Период оплаты" comment="Введите период оплаты в формате ММГГ, например 0915." type="N" min_length="0" max_length="4" isValidateOnLine="0" isRequired="1" isVisible="1" isScanable="0" isEditable="1" isPrinted="1" double_input="0" value="0821" reg_exp="^(0[1-9]|1[0-2])(1[0-9]|0[0-9]|2[0-9])$" from_debt="0"/>
                <par step="2" name="EXCLUDE_REQS" fullname="EXCLUDE_REQS" comment="" type="C" min_length="0" max_length="250" isValidateOnLine="0" isRequired="0" isVisible="1" isScanable="0" isEditable="0" isPrinted="1" double_input="0" value="@EXCLUDE_REQS@ФИО_ПЛАТЕЛЬЩИКА@@EXCLUDE_REQS@" reg_exp="" from_debt="0"/>
                <par step="1" name="НОМЕРА" fullname="Номер" comment="Выберите самое прикольное значение" type="M" min_length="0" max_length="20" isValidateOnLine="0" isRequired="1" isVisible="1" isScanable="0" isEditable="1" isPrinted="1" double_input="0" value="" reg_exp="" from_debt="0">
                    <par_list value="ПУСТО"/>
                    <par_list value="федеральный"/>
                    <par_list value="городской"/>
                </par>
            </pars>
        </serv>
    </services>
    <suip>100774028265ZVFL</suip>
    <unicum_code>20210928A903801000903801VZ</unicum_code>
    <agent_date>2021-09-28T10:58:18</agent_date>
    <err>
        <code>3</code>
        <description>Платеж уже сохранен в УФО в состоянии  Не подтвержден)</description>
        <need_confirm/>
    </err>
    <version_protocol>1.3.7</version_protocol>
</order>
`

const demoKeys = [
    ['A005LP01', '3m2zpx'],
    ['A005LP02', 'aAKw5a'],
]

function testSign() {
    console.time('signatureCreate')
    const [keyName, passPhrase] = demoKeys[1]
    const instance = new CondoBicryptSign(keyName, passPhrase)
    const signature = instance.sign(textToSign, false)
    console.timeEnd('signatureCreate')
    console.log(`::signature:: ${signature}`)
}


```

# Output
```bash
signatureCreate: 64.247ms
::signature:: IQzuJvL7JF6iUi5rm/sX/2pHP+vpD4QIfeGtgR1QPAj42flkfwve6P5aOUqiX5q+EKRiOh27P2pYoUC5BZ36Wg==
```

For developing on macos (on Linux it will work without docker)

1. Add real password and path for eds key to .env in current folder
```
BICRYPT='{"passPhrase":"***","keyPath":"./****.key"}'
```
2. Add key to this folder (Get it from kubernetes dashboard)
3. Build docker image and start it
```
docker build --platform linux/amd64 . -t bicrypt
docker run --expose 7777 --name bicrypt bicrypt
```
4. Add record to .env file in eps folder
```
USE_DOCKER_TO_SIGN_WITH_BICRYPT='{"port":"7777"}'
```
Run docker image on 7777 port name it bicrypt and turn on logging
```
docker logs -f bicrypt
```

You will see something like this as it works in debug mode

```
[STEP] INIT = 0
[STEP] INIT RANDOM = 0
[STEP] READ KEY = 0
A3QZTT04sA9905_��⮭���� = 0
<order><action>group_list</action><agent>A9905</agent><terminal>990510V</terminal><pay_type>ПЛАСТ_СПИС</pay_type><version_protocol>1.3.7</version_protocol></order> = 172
b����D�iܔ��%�BA���a����
�+'-�>�Y[}�4�u�Hq�� = 0ދ�+�V�����L��u
[STEP] PUT SIGNATURE STRUCTURE = 0
 * EMPTY-BUFFER-START = 0
нb����D�iܔ��%�BA���a����
�+'-�>�Y[}�4�u�HqA3QZTT04sA9905_��⮭����BICS = 95
 * EMPTY-BUFFER-END = 0
 * SIGNATURE-LENGTH = 95
[STEP] SIGNATURE CHECK = 0
 * SIGNATURE INFO = 0
A3QZTT04sA9905_��⮭���� = 24
b����D�iܔ��%�BA���a����
�+'-�>�Y[}�4�u�Hq�� = 64�+�V�����L��u
 * STRUCTURE LENGTH = 95
[STEP] CLOSE KEY = 0
[STEP] CLOSE CONTEXT = 0
{
  xml: '<order><action>group_list</action><agent>A9905</agent><terminal>990510V</terminal><pay_type>ПЛАСТ_СПИС</pay_type><version_protocol>1.3.7</version_protocol></order>',
  signature: '0L0fYo6O6dZEj2kZ3JTirSXMQkHj4aZhieO/2gzx3ouqK/xWmZKHk+RMmfJ1DZArJy37Hj68WVt9EwObNJ51gUhxQTNRWlRUMDRzQTk5MDVfka7irq2orYiRGEJJQ1M='
}
```
