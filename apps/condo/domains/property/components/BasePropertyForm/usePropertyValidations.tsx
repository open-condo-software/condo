import { get } from 'lodash'
import { Rule } from 'rc-field-form/lib/interface'

import { useIntl } from '@open-condo/next/intl'

type ValidatorTypes = {
    changeMessage: (rule: Rule, message: string) => Rule
    requiredValidator: Rule
    addressValidator: (selectedPropertyId, isMatchSelectedProperty) => Rule
}

const changeMessage = (rule: Rule, message: string) => {
    return { ...rule, message }
}

type ValidationSettings = {
    allowLandLine?: boolean;
}

type UseValidations = (settings?: ValidationSettings) => ValidatorTypes

// TODO(DOMA-1588): Add memoization for hook members to prevent unnecessary rerenders
export const usePropertyValidations: UseValidations = (settings = {}) => {
    const intl = useIntl()
    const PropertyFieldIsRequiredMessage = intl.formatMessage({ id: 'field.property.requiredError' })
    const AddressNotSelected = intl.formatMessage({ id: 'field.property.nonSelectedError' })

    const { allowLandLine } = settings

    const requiredValidator: Rule = {
        required: true,
        message: PropertyFieldIsRequiredMessage,
    }

    const addressValidator: (selectedPropertyId, isMatchSelectedProperty) => Rule =
        (selectedPropertyId, isMatchSelectedProperty) => {
            return {
                validator: (_, value) => {
                    const searchValueLength = get(value, 'length', 0)
                    const isPropertyMatched = selectedPropertyId !== undefined && isMatchSelectedProperty

                    if (searchValueLength < 1 || isPropertyMatched) return Promise.resolve()

                    return Promise.reject(AddressNotSelected)
                },
            }
        }

    return {
        changeMessage,
        requiredValidator,
        addressValidator,
    }
}