import { Rule } from 'rc-field-form/lib/interface'

import { useIntl } from '@open-condo/next/intl'

import {
    MAX_PHONE_LENGTH,
    MIN_PHONE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
} from '@condo/domains/ticket/constants/restrictions'

export const NON_DIGITS_REGEXP = /\D/g

type IFormFieldsRuleMap = {
    [key: string]: Rule[]
}

export function useTicketValidations (): IFormFieldsRuleMap {
    const intl = useIntl()

    return {
        property: [
            {
                required: true,
                message: intl.formatMessage({ id: 'field.Property.requiredError' }),
            },
        ],
        unitName: [],
        source: [
            {
                required: true,
                message: intl.formatMessage({ id: 'SelectIsRequired' }),
            },
        ],
        clientName: [
            {
                required: true,
                min: 2,
                type: 'string',
                message: intl.formatMessage({ id: 'field.ClientName.minLengthError' }),
            },
        ],
        clientPhone: [
            {
                required: true,
                message: intl.formatMessage({ id: 'field.Phone.requiredError' }),
            },
            {
                validator: (_, value) => {
                    const phone = value.replace(NON_DIGITS_REGEXP, '')

                    if (phone.length > MAX_PHONE_LENGTH || phone.length < MIN_PHONE_LENGTH) {
                        return Promise.reject(new Error(intl.formatMessage({ id: 'field.Phone.lengthError' })))
                    }

                    return Promise.resolve()
                },
            },
        ],
        clientEmail: [
            {
                type: 'email',
                message: intl.formatMessage({ id: 'auth.EmailIsNotValid' }),
            },
        ],
        placeClassifier: [
            {
                required: true,
                message: intl.formatMessage({ id: 'field.Classifier.requiredError' }),
            },
        ],
        classifierRule: [
            {
                required: true,
                message: intl.formatMessage({ id: 'field.Classifier.requiredError' }),
            },
        ],
        categoryClassifier: [
            {
                required: true,
                message: intl.formatMessage({ id: 'field.Classifier.requiredError' }),
            },
        ],
        details: [
            {
                whitespace: true,
                required: true,
                min: MIN_DESCRIPTION_LENGTH,
                message: intl.formatMessage({ id: 'field.Description.lengthError' }),
            },
        ],
        executor: [],
        assignee: [
            {
                required: true,
                message: intl.formatMessage({ id: 'field.Assignee.requiredError' }),
            },
        ],
    }
}
