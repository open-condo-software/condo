import { useMemo, useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { getCountrySpecificValidator } from '@condo/domains/banking/utils/validate/countrySpecificValidators'
import { RUSSIA_COUNTRY } from '@condo/domains/common/constants/countries'
import { useValidations } from '@condo/domains/common/hooks/useValidations'

import type { FormRule as Rule } from 'antd'

type useBankAccountValidationOutput = {
    numberValidator: Rule[]
    tinValidator: Rule[]
    routingNumberValidator: Rule[]
    bankAccountCheck: (number: string, bankAccount: string) => boolean
}

type useBankAccountValidationInput = {
    country: string
}

export function useBankAccountValidation ({ country }: useBankAccountValidationInput): useBankAccountValidationOutput {
    const intl = useIntl()
    const { requiredValidator } = useValidations()

    const TransitBankAccountErrorMessage = intl.formatMessage({ id: 'pages.condo.marketplace.transitBankAccountErrorMessage' })
    const BankAccountErrorMessage = intl.formatMessage({ id: 'pages.condo.marketplace.bankAccountErrorMessage' })
    const TinValidationErrorMessage = intl.formatMessage({ id: 'pages.condo.marketplace.tinValidationErrorMessage' })
    const RoutingNumberValidationErrorMessage = intl.formatMessage({ id: 'pages.condo.marketplace.routingNumberValidationErrorMessage' })

    const validators = useMemo(() => {
        return {
            tin: getCountrySpecificValidator('tin', country),
            number: getCountrySpecificValidator('number', country), // Only control sum check
            routingNumber: getCountrySpecificValidator('routingNumber', country),
        }
    }, [country])

    const numberValidator = useMemo(() => {
        const isTransitBankAccountValidator: Rule = {
            validator: (_, value: string) => {
                if (value && value.startsWith('409')  && country === RUSSIA_COUNTRY) {
                    return Promise.reject()
                }
                return Promise.resolve()
            },
            message: TransitBankAccountErrorMessage,
        }
        const isValidBankAccount: Rule = {
            validator: (_, value: string) => {
                if (value && country === RUSSIA_COUNTRY) {
                    const numberWithoutSpaces = value.toString().trim()
                    if (!numberWithoutSpaces.length ||
                        !/^[0-9]*$/.test(numberWithoutSpaces) ||
                        numberWithoutSpaces.length !== 20
                    ) {
                        return Promise.reject()
                    }
                }
                return Promise.resolve()
            },
            message: BankAccountErrorMessage,
        }
        return [requiredValidator, isTransitBankAccountValidator, isValidBankAccount]
    }, [TransitBankAccountErrorMessage, BankAccountErrorMessage, requiredValidator, country])

    const tinValidator = useMemo(() => {
        const isValidTin: Rule = {
            validator: (_, value: string) => {
                if (value) {
                    const errors = []
                    validators.tin(value, errors)
                    if (errors.length) {
                        return Promise.reject()
                    }
                }
                return Promise.resolve()
            },
            message: TinValidationErrorMessage,
        }
        return [requiredValidator, isValidTin]
    }, [validators, TinValidationErrorMessage, requiredValidator])

    const routingNumberValidator = useMemo(() => {
        const isValidRoutingNumber: Rule = {
            validator: (_, value: string) => {
                if (value) {
                    const errors = []
                    validators.routingNumber(value, errors)
                    if (errors.length) {
                        return Promise.reject()
                    }
                }
                return Promise.resolve()
            },
            message: RoutingNumberValidationErrorMessage,
        }
        return [requiredValidator, isValidRoutingNumber]
    }, [RoutingNumberValidationErrorMessage, requiredValidator, validators])

    const bankAccountCheck = useCallback((number, routingNumber) => {
        const errors = []
        validators.number(number, routingNumber, errors)
        return !!errors.length
    }, [validators])

    return {
        tinValidator,
        numberValidator,
        routingNumberValidator,
        bankAccountCheck,
    }
}