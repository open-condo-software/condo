/**
 * @jest-environment node
 */
const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')

const { createInstance } = require('@open-condo/clients/address-service-client')
const { setFakeClientMode, makeLoggedInAdminClient, expectToThrowGQLError } = require('@open-condo/keystone/test.utils')

const {
    createValidRuRoutingNumber,
    createValidRuNumber,
    createValidRuTin10,
} = require('@condo/domains/banking/utils/testSchema/bankAccount')
const { validateQRCodeByTestClient } = require('@condo/domains/billing/utils/testSchema')

function generateQrCodeObj (extraAttrs = {}) {
    const bic = createValidRuRoutingNumber()

    return {
        PersonalAcc: createValidRuNumber(bic),
        PayeeINN: createValidRuTin10(),
        PayerAddress: faker.address.streetAddress(true),
        Sum: faker.random.numeric(6),
        LastName: faker.random.alpha(10),
        PaymPeriod: `${faker.datatype.number({ min: 1, max: 12 })}.${faker.datatype.number({
            min: 2024,
            max: 2099,
        })}`,
        BIC: bic,
        PersAcc: faker.random.numeric(20),
        ...extraAttrs,
    }
}

function stringifyQrCode (qrCodeObj) {
    return Buffer.from(Object.keys(qrCodeObj).reduce((qrStr, field) => {
        return `${qrStr}|${field}=${qrCodeObj[field]}`
    }, 'ST00012')).toString('base64')
}

describe('ValidateQRCodeService spec', () => {
    setFakeClientMode(index)

    const instance = createInstance()

    test('should boost searching with tin', async () => {
        const adminClient = await makeLoggedInAdminClient()
        const qrObj = generateQrCodeObj()
        const spy = jest.spyOn(instance, 'search')

        // Yes, we will get an error, because no organization and no address, but ...
        await expectToThrowGQLError(
            async () => {
                await validateQRCodeByTestClient(adminClient, { qrCode: stringifyQrCode(qrObj) })
            },
            {
                mutation: 'validateQRCode',
                code: 'INTERNAL_ERROR',
                type: 'NOT_FOUND',
                message: 'Organization with provided TIN and having provided address is not registered',
            },
            'result',
        )

        // ... but here we only need to be sure that address service client's `search` function will be called with organization's tin
        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith(qrObj.PayerAddress, { extractUnit: true, helpers: JSON.stringify({ tin: qrObj.PayeeINN }) })
    })
})
