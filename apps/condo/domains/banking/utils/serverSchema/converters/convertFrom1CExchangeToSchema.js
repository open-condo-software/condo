const readline = require('readline')

const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)

const DATE_FORMAT = 'DD.MM.YYYY'

/**
 * Parses `key=value` string to JSON
 */
function getKeyValueFrom (line) {
    return line.split('=')
}

/**
 * Represents entity, that starts at "begin" marker-line, has key-value body and ends with "end" marker
 */
class StreamNode {
    // TODO(antonal): validate with Ajv after collecting all keys. Replace `bodyKeys` with Ajv validation schema
    /**
     *
     * @param {String/Regexp} begin - line, that determines beginning of this entity (exact match)
     * @param {String} [end] - line, that determines end-border of this entity (exact match)
     * @param {String} [endBodyKey] – some entities does not have end markers, but have last keys. After parsing this key, entity will be finished
     * @param {String[]} bodyKeys
     */
    constructor ({ begin, end, endBodyKey, bodyKeys, converter }) {
        this.begin = begin
        this.end = end
        this.endBodyKey = endBodyKey
        this.bodyKeys = bodyKeys
        this.body = {}
        this.finished = false
        this.valid = true
        this.converter = converter
    }

    parse (line) {
        if (line === this.end) {
            this.finished = true
        } else {
            const [key, value] = getKeyValueFrom(line)
            if (this.bodyKeys.includes(key)) {
                this.body[key] = value
                if (this.endBodyKey === key) {
                    this.finished = true
                }
            } else {
                this.valid = false
            }
        }
    }

    convert () {
        return this.converter(this.body)
    }

    get isFinished () {
        return this.finished
    }

    get isValid () {
        return this.valid
    }

    get name () {
        return this.begin
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


async function convertFrom1CExchangeToSchema (fileStream) {
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    })

    let i = 0
    let currentNode

    let bankAccountData
    const bankTransactionsData = []

    for await (const line of rl) {
        i++
        if (line === 'КонецФайла') {
            rl.close()
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
                rl.close()
                throw new Error('Invalid file format. First line should be "1CClientBankExchange"')
            }
        }

        currentNode.parse(line)

        if (!currentNode.isValid) {
            throw new Error(`Invalid node "${currentNode.name}" at line ${i}`)
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

    rl.close()

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