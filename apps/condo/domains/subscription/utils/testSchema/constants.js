const faker = require('faker')

const randomAlphaNumeric = faker.random.alphaNumeric(10)
const currentState = 'ACTIVE'

const rightSbbolOfferAccept =  {
    'data': [
        {
            'active': false,
            'bundles': [{
                'code': randomAlphaNumeric,
                'name': randomAlphaNumeric,
                'sinceDate': randomAlphaNumeric,
                'untilDate': randomAlphaNumeric,
                'currentState': currentState,
            }],
            'payerAccount': randomAlphaNumeric,
            'payerBankBic': randomAlphaNumeric,
            'payerBankCorrAccount': randomAlphaNumeric,
            'payerInn': randomAlphaNumeric,
            'payerName': randomAlphaNumeric,
            'payerOrgIdHash': randomAlphaNumeric,
            'purpose': randomAlphaNumeric,
            'sinceDate': randomAlphaNumeric,
            'untilDate': randomAlphaNumeric,
        },
    ],
}

const wrongSbbolOfferAccept = {
    'data': [
        {
            'bundles': [{
                'currentState': faker.random.alphaNumeric(10),
            }],
        },
    ],
}

module.exports = {
    rightSbbolOfferAccept,
    wrongSbbolOfferAccept
}