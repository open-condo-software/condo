const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')

const { getLogger } = require('@open-condo/keystone/logging')
dayjs.extend(customParseFormat)

const DATE_FORMAT = 'DD.MM.YYYY'

const logger = getLogger()

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
    // Stores correctly parsed keys
    #parsedKeys
    // Keys that we store in the database. If you change them in the converter, you need to change here too.
    #requiredKeys
    // Determines whether #end marker or #endBodyKey was faced
    #isFinished

    // TODO(antonal): validate with Ajv after collecting all keys. Replace `bodyKeys` with Ajv validation schema
    /**
     *
     * @param {String/Regexp} begin - line, that determines beginning of this entity (exact match)
     * @param {String} [end] - line, that determines end-border of this entity (exact match)
     * @param {String} [endBodyKey] – some entities does not have end markers, but have last keys. After parsing this key, entity will be finished
     * @param {String[]} bodyKeys
     * @param {String[]} requiredKeys
     * @param {Function} [converter] - mapper to JSON object as a result of parsing this stream node
     */
    constructor ({ begin, end, endBodyKey, bodyKeys, requiredKeys, converter }) {
        this.#begin = begin
        this.#end = end
        this.#endBodyKey = endBodyKey
        this.#bodyKeys = bodyKeys
        this.#body = {}
        this.#parsedKeys = []
        this.#requiredKeys = requiredKeys
        this.#isFinished = false
        this.converter = converter
    }

    parse (line) {
        if (line === this.#end) {
            this.#isFinished = true
        } else {
            const [key, value] = line.split('=')
            this.#parsedKeys.push(key)
            if (this.#bodyKeys.includes(key)) {
                this.#body[key] = value
                if (this.#endBodyKey === key) {
                    this.#isFinished = true
                }
            } else {
                logger.warn({ msg: 'unexpected key in node', data: { node: this.name, key } })
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

    get parsedKeys () {
        return this.#parsedKeys
    }

    get requiredKeys () {
        return this.#requiredKeys
    }

}

function parseDate (str) {
    if (!str) return null
    return dayjs(str, DATE_FORMAT, true)
}

function initNode (line) {
    if (line === '1CClientBankExchange') {
        const keys = [
            'ВерсияФормата',
            'Кодировка',
            'Отправитель',
            'Получатель',
            'ДатаСоздания',
            'ВремяСоздания',
            'ДатаНачала',
            'ДатаКонца',
            'РасчСчет',
        ]
        return new StreamNode({
            begin: '1CClientBankExchange',
            endBodyKey: 'РасчСчет',
            requiredKeys: [
                'ВерсияФормата',
                'Кодировка',
                'Отправитель',
                'ДатаНачала',
                'ДатаКонца',
                'РасчСчет',
            ],
            bodyKeys: keys,
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
            requiredKeys: [
                'КонечныйОстаток',
                'ДатаКонца',
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
                'Получатель',
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
            requiredKeys: [
                'ДатаСписано',
                'Номер',
                'Дата',
                'Сумма',
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
                    const name = values['Получатель1'] || values['Получатель']
                    const number = values['ПолучательРасчСчет']
                    const bankName = values['ПолучательБанк1']
                    const routingNumber = values['ПолучательБИК']
                    const tin = values['ПолучательИНН']
                    if (name && number && bankName && routingNumber && tin) {
                        transactionData.contractorAccount = {
                            name,
                            tin,
                            number,
                            bankName,
                            routingNumber,
                        }
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
                logger.warn({ msg: 'unexpected node name', data: { line: i, node: line } })
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
                    for (let parsedKey of currentNode.requiredKeys) {
                        if (!currentNode.parsedKeys.includes(parsedKey)) {
                            throw new Error(`Line "${parsedKey}" not found in node "СекцияРасчСчет".`)
                        }
                    }
                    bankAccountData = currentNode.convert()
                    break
                case 'СекцияДокумент':
                    for (let key of currentNode.requiredKeys) {
                        if (!currentNode.parsedKeys.includes(key)) {
                            throw new Error(`Line "${key}" not found in node "СекцияДокумент".`)
                        }
                    }
                    bankTransactionsData.push(currentNode.convert())
                    break
                case '1CClientBankExchange':
                    for (let parsedKey of currentNode.requiredKeys) {
                        if (!currentNode.parsedKeys.includes(parsedKey)) {
                            throw new Error(`Line "${parsedKey}" not found in node "1CClientBankExchange".`)
                        }
                    }
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
