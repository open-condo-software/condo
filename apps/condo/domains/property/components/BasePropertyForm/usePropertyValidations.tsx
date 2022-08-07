import { Rule } from 'rc-field-form/lib/interface'
import { useIntl } from '@condo/next/intl'

type IFormFieldsRuleMap = {
    [key: string]: Rule[]
}

export function usePropertyValidations (): IFormFieldsRuleMap {
    const intl = useIntl()

    return {
        address: [
            {
                required: true,
                message: intl.formatMessage({ id: 'field.Property.requiredError' }),
            },
        ],
    }
}
