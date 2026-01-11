import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { MIN_DESCRIPTION_LENGTH } from '@condo/domains/ticket/constants/restrictions'

import type { FormRule as Rule } from 'antd'


type TicketFieldsKeys = 'property'
| 'unitName'
| 'source'
| 'clientName'
| 'clientPhone'
| 'clientEmail'
| 'classifierRule'
| 'placeClassifier'
| 'categoryClassifier'
| 'details'
| 'executor'
| 'assignee'
| 'observers'
type ITicketFieldsRuleMap = {
    [Key in TicketFieldsKeys]: Rule[]
}

export function useTicketValidations (): ITicketFieldsRuleMap {
    const intl = useIntl()

    const FullNameInvalidCharMessage = intl.formatMessage({ id:'field.FullName.invalidChar' })
    const FullNameRequiredMessage = intl.formatMessage({ id: 'field.FullName.requiredError' })
    const EmailErrorMessage = intl.formatMessage({ id: 'pages.auth.EmailIsNotValid' })
    const ClassifierIsRequiredMessage = intl.formatMessage({ id: 'field.Classifier.requiredError' })
    const SelectIsRequiredMessage = intl.formatMessage({ id: 'SelectIsRequired' })
    const PropertyIsRequired = intl.formatMessage({ id: 'field.Property.requiredError' })
    const DescriptionInvalidLengthMessage = intl.formatMessage({ id: 'field.Description.lengthError' })

    const { changeMessage, phoneValidator, emailValidator, requiredValidator, specCharValidator, trimValidator } = useValidations({ allowLandLine: true })

    return useMemo(() => ({
        property: [changeMessage(requiredValidator, PropertyIsRequired)],
        unitName: [],
        source: [changeMessage(requiredValidator, SelectIsRequiredMessage)],
        clientName: [
            changeMessage(trimValidator, FullNameRequiredMessage),
            changeMessage(specCharValidator, FullNameInvalidCharMessage),
        ],
        clientPhone: [requiredValidator, phoneValidator],
        clientEmail: [changeMessage(emailValidator, EmailErrorMessage)],
        classifierRule: [changeMessage(requiredValidator, ClassifierIsRequiredMessage)],
        placeClassifier: [changeMessage(requiredValidator, ClassifierIsRequiredMessage)],
        categoryClassifier: [changeMessage(requiredValidator, ClassifierIsRequiredMessage)],
        details: [
            {
                whitespace: true,
                required: true,
                min: MIN_DESCRIPTION_LENGTH,
                message: DescriptionInvalidLengthMessage,
            },
        ],
        executor: [],
        assignee: [],
        observers: [],
    }), [ClassifierIsRequiredMessage, DescriptionInvalidLengthMessage, EmailErrorMessage, FullNameInvalidCharMessage, FullNameRequiredMessage, PropertyIsRequired, SelectIsRequiredMessage, changeMessage, emailValidator, phoneValidator, requiredValidator, specCharValidator, trimValidator])
}
