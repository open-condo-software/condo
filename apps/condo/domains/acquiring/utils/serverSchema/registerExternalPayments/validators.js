const Big = require('big.js')
const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')

const { GQLError } = require('@open-condo/keystone/errors')

const { PAYMENTS_LIMIT } = require('@condo/domains/acquiring/constants/registerExternalPayments')
const { REGISTER_EXTERNAL_PAYMENTS_ERRORS: ERRORS } = require('@condo/domains/acquiring/constants/registerExternalPaymentsErrors')
const { ISO_CODES } = require('@condo/domains/common/constants/currencies')

dayjs.extend(customParseFormat)

function validatePayments (payments, context) {
    for (const payment of payments) {
        const {
            accountNumber,
            tin,
            address,
            bankAccount,
            routingNumber,
            transactionId,
            amount,
            period,
            transactionDate,
            depositedDate,
            currencyCode,
            explicitFee,
            implicitFee,
            paymentOrder,
        } = payment

        // Should be the first. Used to identify payments with wrong format.
        validateTransactionId(transactionId, context)

        validateAccountNumber(accountNumber, transactionId, context)
        validateRoutingNumber(routingNumber, transactionId, context)
        validateBankAccount(bankAccount, transactionId, context)
        validatePaymentOrder(paymentOrder, transactionId, context)
        validateTin(tin, transactionId, context)
        validateAddress(address, transactionId, context)

        validateCurrencyCode(currencyCode, transactionId, context)
        validatePeriodFormat(period, transactionId, context)
        validateDateFormat(transactionDate, transactionId, context)
        validateDateFormat(depositedDate, transactionId, context)
        validateNumericValues(amount, explicitFee, implicitFee, transactionId, context)
        validatePositiveAmount(amount, transactionId, context)
    }
}

function validateAddress (address, transactionId, context) {
    if (!address) {
        throw new GQLError(
            { ...ERRORS.ADDRESS_REQUIRED, messageInterpolation: { transactionId } },
            context
        )
    }
}

function validateTin (tin, transactionId, context) {
    if (!tin) {
        throw new GQLError(
            { ...ERRORS.TIN_REQUIRED, messageInterpolation: { transactionId } },
            context
        )
    }
}

function validateBankAccount (bankAccount, transactionId, context) {
    if (!bankAccount) {
        throw new GQLError(
            { ...ERRORS.BANK_ACCOUNT_REQUIRED, messageInterpolation: { transactionId } },
            context
        )
    }

    if (bankAccount.length !== 20 || !/^[0-9]*$/.test(bankAccount)) {
        throw new GQLError(
            { ...ERRORS.INVALID_BANK_ACCOUNT, messageInterpolation: { transactionId } },
            context
        )
    }
}

function validateRoutingNumber (routingNumber, transactionId, context) {
    if (!routingNumber) {
        throw new GQLError(
            { ...ERRORS.ROUTING_NUMBER_REQUIRED, messageInterpolation: { transactionId } },
            context
        )
    }

    if (routingNumber.length !== 9 || !/^[0-9]*$/.test(routingNumber)) {
        throw new GQLError(
            { ...ERRORS.INVALID_ROUTING_NUMBER, messageInterpolation: { transactionId } },
            context
        )
    }
}

function validateAccountNumber (accountNumber, transactionId, context) {
    if (!accountNumber) {
        throw new GQLError(
            { ...ERRORS.ACCOUNT_NUMBER_REQUIRED, messageInterpolation: { transactionId } },
            context
        )
    }
}

function validatePaymentOrder (paymentOrder, transactionId, context) {
    if (!paymentOrder) {
        throw new GQLError(
            { ...ERRORS.PAYMENT_ORDER_REQUIRED, messageInterpolation: { transactionId } },
            context
        )
    }
}

function validateTransactionId (transactionId, context) {
    if (!transactionId) {
        throw new GQLError(ERRORS.TRANSACTION_ID_REQUIRED, context)
    }
}

function validateCurrencyCode (currencyCode, transactionId, context) {
    if (!ISO_CODES.includes(currencyCode)) {
        throw new GQLError(
            { ...ERRORS.INVALID_CURRENCY_CODE, messageInterpolation: { currencyCode, transactionId } },
            context
        )
    }
}

function validatePeriodFormat (period, transactionId, context) {
    if (!dayjs(period, 'YYYY-MM-01', true).isValid()) {
        throw new GQLError(
            { ...ERRORS.INVALID_PERIOD_FORMAT, messageInterpolation: { period, transactionId } },
            context
        )
    }
}

function validateDateFormat (date, transactionId, context) {
    if (typeof date !== 'string') return

    const parsed = dayjs(date)
    const isIsoString = parsed.toISOString() === date

    if (!parsed.isValid() || !isIsoString) {
        throw new GQLError(
            { ...ERRORS.INVALID_DATE_FORMAT, messageInterpolation: { date, transactionId } },
            context
        )
    }
}

function validateNumericValues (amount, explicitFee, implicitFee, transactionId, context) {
    const fieldsToValidate = [
        { name: 'amount', value: amount },
        ...(explicitFee ? [{ name: 'explicitFee', value: explicitFee }] : []),
        ...(implicitFee ? [{ name: 'implicitFee', value: implicitFee }] : []),
    ]

    for (const { name, value } of fieldsToValidate) {
        if (Number.isNaN(Number(value))) {
            throw new GQLError(
                {
                    ...ERRORS.INVALID_NUMERIC_FIELD,
                    messageInterpolation: {
                        field: name,
                        value,
                        transactionId,
                    },
                },
                context
            )
        }
    }
}

function validatePositiveAmount (amount, transactionId, context) {
    if (Big(amount).lte(0)) {
        throw new GQLError(
            { ...ERRORS.NON_POSITIVE_PAYMENT_AMOUNT, messageInterpolation: { amount, transactionId } },
            context
        )
    }
}

function validateDuplicatedTransactionIds (payments, context) {
    const externalIds = payments.map(({ transactionId }) => transactionId)
    
    if (new Set(externalIds).size !== externalIds.length) {
        const transactionIds = externalIds.slice(0, 10).join(', ')
        throw new GQLError({ ...ERRORS.DUPLICATED_PAYMENTS, messageInterpolation: { transactionIds } }, context)
    }
}

function validatePaymentsNumberLimits (payments, context) {
    if (payments.length === 0) {
        throw new GQLError(ERRORS.EMPTY_PAYMENTS_ARRAY, context)
    }

    if (payments.length > PAYMENTS_LIMIT) {
        throw new GQLError(ERRORS.PAYMENTS_LIMIT_EXCEEDED, context)
    }
}

function validateExistingMultiPayments (existing, context) {
    if (existing.length > 0) {
        const transactionIds = existing.map(p => p.transactionId).slice(0, 10).join(', ')
        throw new GQLError({ ...ERRORS.EXISTING_PAYMENTS, messageInterpolation: { transactionIds } }, context)
    }
}

module.exports = {
    validatePayments,
    validateCurrencyCode,
    validatePeriodFormat,
    validateDateFormat,
    validateNumericValues,
    validatePositiveAmount,
    validateDuplicatedTransactionIds,
    validatePaymentsNumberLimits,
    validateExistingMultiPayments,
    validateAccountNumber,
    validateRoutingNumber,
    validatePaymentOrder,
    validateBankAccount,
    validateTin,
    validateAddress,
}