const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)

const DATE_FORMAT = 'DD.MM.YYYY'

/**
 * Represents entity, that starts at "begin" marker-line, has key-value body and ends with "end" marker
 * Example
 * ```
 * BeginSomeDocument
 * key1=value1
 * key2=value2
 * ...
 * EndSomeDocument
 * ```
 */
class StreamNode {
    // When Parser will face this marker, it will start handle lines below as a key-value body fields
    #begin
    // When parser will face this marker, it will handle all collected line as a finished body
    #end
    // Some nodes instead of end marker may have just last field in key-value format
    #endBodyKey
    // List of correct keys for this node. Everything else will be handled as an error
    #bodyKeys
    // Contains key-values parsed from lines between #begin and #end marker (or #endBodyKey).
    #body
    // Determines whether #end marker or #endBodyKey was faced
    #isFinished

    // TODO(antonal): validate with Ajv after collecting all keys. Replace `bodyKeys` with Ajv validation schema
    /**
     *
     * @param {String/Regexp} begin - line, that determines beginning of this entity (exact match)
     * @param {String} [end] - line, that determines end-border of this entity (exact match)
     * @param {String} [endBodyKey] – some entities does not have end markers, but have last keys. After parsing this key, entity will be finished
     * @param {String[]} bodyKeys
     * @param {Function} [converter] - mapper to JSON object as a result of parsing this stream node
     */
    constructor ({ begin, end, endBodyKey, bodyKeys, converter }) {
        this.#begin = begin
        this.#end = end
        this.#endBodyKey = endBodyKey
        this.#bodyKeys = bodyKeys
        this.#body = {}
        this.#isFinished = false
        this.converter = converter
    }

    parse (line) {
        if (line === this.#end) {
            this.#isFinished = true
        } else {
            const [key, value] = line.split('=')
            if (this.#bodyKeys.includes(key)) {
                this.#body[key] = value
                if (this.#endBodyKey === key) {
                    this.#isFinished = true
                }
            } else {
                throw new Error(`Unexpected key "${key}" in node "${this.name}"`)
            }
        }
    }

    convert () {
        return this.converter(this.#body)
    }

    get isFinished () {
        return this.#isFinished
    }

    get name () {
        return this.#begin
    }

}

function parseDate (str) {
    if (!str) return null
    return dayjs(str, DATE_FORMAT, true)
}

function initNode (line) {
    if (line === '1CClientBankExchange') {
        return new StreamNode({
            begin: '1CClientBankExchange',
            endBodyKey: 'РасчСчет',
            bodyKeys: [
                'ВерсияФормата',
                'Кодировка',
                'Отправитель',
                'Получатель',
                'ДатаСоздания',
                'ВремяСоздания',
                'ДатаНачала',
                'ДатаКонца',
                'РасчСчет',
            ],
        })
    }

    if (line === 'СекцияРасчСчет') {
        return new StreamNode({
            begin: 'СекцияРасчСчет',
            end: 'КонецРасчСчет',
            bodyKeys: [
                'ДатаНачала',
                'ДатаКонца',
                'РасчСчет',
                'НачальныйОстаток',
                'ВсегоПоступило',
                'ВсегоСписано',
                'КонечныйОстаток',
            ],
            converter: (values) => ({
                number: values['РасчСчет'],
                meta: {
                    amount: values['КонечныйОстаток'],
                    amountAt: parseDate(values['ДатаКонца']),
                    '1CClientBankExchange': {
                        v: '1.03',
                        data: values,
                    },
                },
            }),
        })
    }
    if (line.match(/^СекцияДокумент=Платежное ((требование)|(поручение))$/)) {
        return new StreamNode({
            begin: 'СекцияДокумент',
            end: 'КонецДокумента',
            bodyKeys: [
                'Номер',
                'Дата',
                'Сумма',
                'ПлательщикСчет',
                'ДатаСписано',
                'ПлательщикИНН',
                'Плательщик1',
                'ПлательщикРасчСчет',
                'ПлательщикБанк1',
                'ПлательщикБанк2',
                'ПлательщикБИК',
                'ПлательщикКорсчет',
                'ПолучательСчет',
                'ДатаПоступило',
                'ПолучательИНН',
                'Получатель1',
                'ПолучательРасчСчет',
                'ПолучательБанк1',
                'ПолучательБанк2',
                'ПолучательБИК',
                'ПолучательКорсчет',
                'ПоказательТипа',
                'ВидПлатежа',
                'ВидОплаты',
                'Код',
                'ПлательщикКПП',
                'ПолучательКПП',
                'СрокПлатежа',
                'Очередность',
                'НазначениеПлатежа',
            ],
            converter: (values) => {
                const isOutcome = parseDate(values['ДатаСписано']) !== null
                const transactionData = {
                    number: values['Номер'],
                    date: dayjs(values['Дата'], DATE_FORMAT, true),
                    amount: parseFloat(values['Сумма']),
                    purpose: values['НазначениеПлатежа'],
                    isOutcome,
                    meta: {
                        '1CClientBankExchange': {
                            v: '1.03',
                            data: values,
                        },
                    },
                }
                if (isOutcome) {
                    transactionData.contractorAccount = {
                        name: values['Получатель1'],
                        tin: values['ПолучательИНН'],
                        number: values['ПолучательРасчСчет'],
                        bankName: values['ПолучательБанк1'],
                        routingNumber: values['ПолучательБИК'],
                    }
                }
                return transactionData
            },
        })
    }
}


function convertFrom1CExchangeToSchema (stringContent) {
    let i = 0
    let currentNode

    let bankAccountData
    const bankTransactionsData = []

    for (const line of stringContent.split(/\r?\n/)) {
        i++
        if (line === 'КонецФайла') {
            break
        }
        if (line === '') {
            throw new Error(`Unexpected blank line ${i}`)
        }
        if (!currentNode) {
            const newNode = initNode(line)
            if (!newNode) {
                throw new Error(`Unexpected node name "${line}" at line ${i}`)
            }
            currentNode = newNode
            continue
        }

        if (i === 1) {
            if (line !== '1CClientBankExchange') {
                throw new Error('Invalid file format. First line should be "1CClientBankExchange"')
            }
        }

        try {
            currentNode.parse(line)
        } catch (e) {
            throw new Error(`Parse error at line ${i}: ${e.message}`)
        }

        if (currentNode.isFinished) {
            switch (currentNode.name) {
                case 'СекцияРасчСчет':
                    bankAccountData = currentNode.convert()
                    break
                case 'СекцияДокумент':
                    bankTransactionsData.push(currentNode.convert())
                    break
                case '1CClientBankExchange':
                    // do nothing
                    break
            }
            currentNode = null
        }
    }

    if (currentNode) {
        throw new Error(`Unexpected end of file having not finished node "${currentNode.name}"`)
    }

    // Routing number is missing in account section of the document, but it is presented in transactions
    // Find transactions, referencing the same account number and get it
    for (const { meta: { '1CClientBankExchange': { data } } } of bankTransactionsData) {
        if (data['ПолучательСчет'] === bankAccountData.number) {
            bankAccountData.routingNumber = data['ПолучательБИК']
            break
        }
        if (data['ПлательщикСчет'] === bankAccountData.number) {
            bankAccountData.routingNumber = data['ПлательщикБИК']
            break
        }
    }

    return {
        bankAccountData,
        bankTransactionsData,
    }
}


module.exports = {
    convertFrom1CExchangeToSchema,
}
