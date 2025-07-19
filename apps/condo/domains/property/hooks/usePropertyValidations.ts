import dayjs from 'dayjs'
import isEmpty from 'lodash/isEmpty'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { Property } from '@condo/domains/property/utils/clientSchema'

import type { FormRule as Rule } from 'antd'


const MIN_YEAR_OF_CONSTRUCTION = 1500

export const usePropertyValidations = ({ organizationId, addressValidatorError, address }) => {
    const intl = useIntl()
    const SamePropertyErrorMsg = intl.formatMessage({ id: 'pages.condo.property.warning.modal.SamePropertyErrorMsg' })
    const WrongYearErrorMsg = intl.formatMessage({ id: 'pages.condo.property.form.YearValidationError' })

    const { refetch } = Property.useObjects({
        where: {
            organization: { id: organizationId },
        },
    })

    const addressValidator: Rule = useMemo(() => ({
        validator: async (_, value) => {
            if (isEmpty(value)) return Promise.resolve()
            if (!isEmpty(address) && address === value) return Promise.resolve()
            if (addressValidatorError) return Promise.reject(addressValidatorError)

            const { data: { objs } } = await refetch({
                where: {
                    organization: { id: organizationId },
                    address: value,
                },
            })

            if (!isEmpty(objs)) {
                return Promise.reject(SamePropertyErrorMsg)
            }
            return Promise.resolve()
        },
    }), [addressValidatorError, SamePropertyErrorMsg, refetch, organizationId, address])

    const yearOfConstructionValidator: Rule = useMemo(() => ({
        validator: (_, value) => {
            if (value === null || value === '') return Promise.resolve()

            const receivedDate = dayjs().year(value)
            const isValidDate = receivedDate.isValid()
                && receivedDate.isBefore(dayjs().add(1, 'day'))
                && receivedDate.isAfter(dayjs().year(MIN_YEAR_OF_CONSTRUCTION).subtract(1, 'day'))

            if (isValidDate) {
                return Promise.resolve()
            }

            return Promise.reject(WrongYearErrorMsg)
        },
    }), [WrongYearErrorMsg])

    return useMemo(() => ({
        addressValidator,
        yearOfConstructionValidator,
    }), [addressValidator, yearOfConstructionValidator])
}
