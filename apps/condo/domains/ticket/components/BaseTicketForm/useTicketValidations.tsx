import { Rule } from 'rc-field-form/lib/interface'
import { useIntl } from '@core/next/intl'

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
                    const phone = value.replace(/\D/g, '')

                    if (phone.length > 15) {
                        return Promise.reject(new Error(intl.formatMessage({ id: 'field.Phone.lengthError' })))
                    }

                    return Promise.resolve()
                },
            },
        ],
        clientEmail: [
            {
                type: 'email',
                message: intl.formatMessage({ id: 'pages.auth.EmailIsNotValid' }),
            },
        ],
        details: [
            {
                required: false,
                message: intl.formatMessage({ id: 'field.Description.lengthError' }),
            },
        ],
        classifier: [
            {
                required: true,
                message: intl.formatMessage({ id: 'field.Classifier.requiredError' }),
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
