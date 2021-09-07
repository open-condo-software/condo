const GROUP_LIST_XML = `
    <?xml version="1.0" encoding="UTF-8"?>
    <order>
        <action>group_list</action>
        <agent>{{agent}}</agent>
        <terminal>{{terminal}}</terminal>
        <version_protocol>{{protocolVersion}}</version_protocol>
    </order>
`

const SERVICE_LIST = `
    <?xml version="1.0" encoding="UTF-8"?>
    <order>
        <action>service_list</action>
        <agent>{{agent}}</agent>
        <terminal>{{terminal}}</terminal>
        <version_protocol>{{protocolVersion}}</version_protocol>
        <pay_type>ПЛАСТ_СПИС</pay_type>
        <find_pars>
            <gr_code>1</gr_code>
        </find_pars>
    </order>
`

const CHECK_PAY = `
    <?xml version="1.0" encoding="UTF-8"?>
    <order>
        <action>check_pay</action>
        <agent>{{agent}}</agent>
        <terminal>{{terminal}}</terminal>
        <pay_type>ПЛАСТ_СПИС</pay_type>
        <step>0</step>
        <services>
            <serv isClosed="0">
                <serv_id>187436043887</serv_id>
                <bic>044525000</bic>
                <schet>40101810045250010041</schet>
                <l_sc>993030</l_sc>
                <inn>7726639745</inn>
                <name_schet>УФК ПО Г.МОСКВЕ (УПРАВЛЕНИЕ ФЕДЕРАЛЬНОЙ СЛУЖБЫ ГОСУДАРСТВЕННОЙ
    РЕГИСТРАЦИИ, КАДАСТРА И КАРТОГРАФИИ ПО Г.МОСКВЕ)</name_schet>
    7
                <name_serv>ГОСУДАРСТВЕННАЯ РЕГИСТРАЦИЯ ЧЕРЕЗ МФЦ</name_serv>
                <num_org>10207</num_org>
                <bank_name>ГУ БАНКА РОССИИ ПО ЦФО</bank_name>
                <corr_schet/>
                <storno_disabled>0</storno_disabled>
                <type_payment>3</type_payment>
                <sys_message/>
                <kpp>772601001</kpp>
            </serv>
        </services>
        <version_protocol>{{protocolVersion}}</version_protocol>
    </order>
`




module.exports = {
    GROUP_LIST_XML,
    SERVICE_LIST,
    CHECK_PAY,
}
