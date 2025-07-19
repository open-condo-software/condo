import get from 'lodash/get'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import type { FormRule as Rule } from 'antd'


type ValidatorTypes = {
    changeMessage: (rule: Rule, message: string) => Rule
    requiredValidator: Rule
    addressValidator: (selectedPropertyId, isMatchSelectedProperty) => Rule
}

const changeMessage = (rule: Rule, message: string) => {
    return { ...rule, message }
}

type UseValidations = () => ValidatorTypes

// TODO(DOMA-1588): Add memoization for hook members to prevent unnecessary rerenders
export const usePropertyValidations: UseValidations = () => {
    const intl = useIntl()
    const PropertyFieldIsRequiredMessage = intl.formatMessage({ id: 'field.Property.requiredError' })
    const AddressNotSelected = intl.formatMessage({ id: 'field.Property.nonSelectedError' })

    const requiredValidator: Rule = useMemo(() => ({
        required: true,
        message: PropertyFieldIsRequiredMessage,
    }), [PropertyFieldIsRequiredMessage])

    const addressValidator: (selectedPropertyId, isMatchSelectedProperty) => Rule =
        useCallback((selectedPropertyId, isMatchSelectedProperty) => {
            return {
                validator: (_, value) => {
                    const searchValueLength = get(value, 'length', 0)
                    const isPropertyMatched = selectedPropertyId !== undefined && isMatchSelectedProperty

                    if (searchValueLength < 1 || isPropertyMatched) return Promise.resolve()

                    return Promise.reject(AddressNotSelected)
                },
            }
        }, [AddressNotSelected])

    return useMemo(() => ({
        changeMessage,
        requiredValidator,
        addressValidator,
    }), [addressValidator, requiredValidator])
}
