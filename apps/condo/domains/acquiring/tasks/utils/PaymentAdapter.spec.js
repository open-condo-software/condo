const { faker } = require('@faker-js/faker')

const {
    RECURRENT_PAYMENT_PROCESS_ERROR_ACQUIRING_PAYMENT_PROCEED_FAILED_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_CARD_TOKEN_NOT_VALID_CODE,
} = require('@condo/domains/acquiring/constants/recurrentPayment')
const { PaymentAdapter } = require('@condo/domains/acquiring/tasks/utils/PaymentAdapter')

const cardId = faker.datatype.uuid()
const getCardTokensUrl = 'http://testHost/api/clients/xxx/card-tokens'
const directPaymentUrl = 'http://testHost/api/pay/xxx'
const multiPaymentId = faker.datatype.uuid()
const successBindingPaymentUrl = 'http://testHost/api/payment/success'
const successNonBindingPaymentUrl = 'http://testHost/payment/form'

describe('PaymentAdapter', () => {
    describe('checkCardToken', () => {
        it('return true for active card', async () => {
            const adapter = new PaymentAdapter({
                multiPaymentId, directPaymentUrl, getCardTokensUrl,
            })

            adapter.doCall = async (url) => {
                expect(url).toEqual(getCardTokensUrl)
                return {
                    status: 200,
                    data: { cardTokens: [{ id: cardId }] },
                }
            }

            const check = await adapter.checkCardToken(cardId)
            expect(check).toBeTruthy()
        })

        it('return false for not active card', async () => {
            const adapter = new PaymentAdapter({
                multiPaymentId, directPaymentUrl, getCardTokensUrl,
            })
            adapter.doCall = async (url) => {
                expect(url).toEqual(getCardTokensUrl)
                return { cardTokens: [{ id: faker.datatype.uuid() }] }
            }

            expect(await adapter.checkCardToken(cardId)).not.toBeTruthy()
        })

        it('return false for wrong status', async () => {
            const adapter = new PaymentAdapter({
                multiPaymentId, directPaymentUrl, getCardTokensUrl,
            })

            adapter.doCall = async (url) => {
                expect(url).toEqual(getCardTokensUrl)
                return {
                    status: 404,
                }
            }

            const check = await adapter.checkCardToken(cardId)
            expect(check).not.toBeTruthy()
        })

        it('return false for connection issue', async () => {
            const adapter = new PaymentAdapter({
                multiPaymentId, directPaymentUrl, getCardTokensUrl,
            })
            adapter.doCall = async () => {
                throw new Error()
            }

            expect(await adapter.checkCardToken(cardId)).not.toBeTruthy()
        })
    })

    describe('proceedPayment', () => {
        it('return with success payment', async () => {
            const adapter = new PaymentAdapter({
                multiPaymentId, directPaymentUrl, getCardTokensUrl,
            })

            adapter.doCall = async (url) => {
                expect(url).toEqual(directPaymentUrl)
                return {
                    status: 200,
                    data: { orderId: faker.datatype.uuid(), url: successBindingPaymentUrl },
                }
            }
            const result  = await adapter.proceedPayment(cardId)
            expect(result).toBeDefined()
            expect(result).toHaveProperty('paid')
            expect(result).not.toHaveProperty('errorMessage')
            expect(result).not.toHaveProperty('errorCode')
            expect(result.paid).toBeTruthy()
        })

        it('return with failed payment - token not applied', async () => {
            const adapter = new PaymentAdapter({
                multiPaymentId, directPaymentUrl, getCardTokensUrl,
            })

            adapter.doCall = async (url) => {
                expect(url).toEqual(directPaymentUrl)
                return {
                    status: 200,
                    data: { orderId: faker.datatype.uuid(), url: successNonBindingPaymentUrl },
                }
            }
            const result  = await adapter.proceedPayment(cardId)
            expect(result).toBeDefined()
            expect(result).toHaveProperty('paid')
            expect(result).toHaveProperty('errorMessage')
            expect(result).toHaveProperty('errorCode')
            expect(result.paid).not.toBeTruthy()
            expect(result.errorCode).toEqual(RECURRENT_PAYMENT_PROCESS_ERROR_CARD_TOKEN_NOT_VALID_CODE)
            expect(result.errorMessage).toEqual('CardToken is not valid')
        })

        it('return with failed error message', async () => {
            const error = 'Unable to createAcquiringPayment'
            const adapter = new PaymentAdapter({
                multiPaymentId, directPaymentUrl, getCardTokensUrl,
            })

            adapter.doCall = async (url) => {
                expect(url).toEqual(directPaymentUrl)
                return {
                    status: 200,
                    data: { error },
                }
            }
            const result  = await adapter.proceedPayment(cardId)
            expect(result).toBeDefined()
            expect(result).toHaveProperty('paid')
            expect(result).toHaveProperty('errorMessage')
            expect(result).toHaveProperty('errorCode')
            expect(result.paid).not.toBeTruthy()
            expect(result.errorCode).toEqual(RECURRENT_PAYMENT_PROCESS_ERROR_ACQUIRING_PAYMENT_PROCEED_FAILED_CODE)
            expect(result.errorMessage).toEqual(error)
        })

        it('return with failed with 404 status', async () => {
            const error = 'Unable to createAcquiringPayment'
            const adapter = new PaymentAdapter({
                multiPaymentId, directPaymentUrl, getCardTokensUrl,
            })

            adapter.doCall = async (url) => {
                expect(url).toEqual(directPaymentUrl)
                return {
                    status: 404,
                    data: { orderId: faker.datatype.uuid(), error },
                }
            }
            const result  = await adapter.proceedPayment(cardId)
            expect(result).toBeDefined()
            expect(result).toHaveProperty('paid')
            expect(result).toHaveProperty('errorMessage')
            expect(result).toHaveProperty('errorCode')
            expect(result.paid).not.toBeTruthy()
            expect(result.errorCode).toEqual(RECURRENT_PAYMENT_PROCESS_ERROR_ACQUIRING_PAYMENT_PROCEED_FAILED_CODE)
            expect(result.errorMessage).toEqual(error)
        })
    })
})