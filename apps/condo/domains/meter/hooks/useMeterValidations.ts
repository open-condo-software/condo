import { Dayjs } from 'dayjs'
import isEmpty from 'lodash/isEmpty'
import { Rule } from 'rc-field-form/lib/interface'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'


import { Meter } from '@condo/domains/meter/utils/clientSchema'

export const useMeterValidations = (installationDate: Dayjs, verificationDate: Dayjs, propertyId: string, unitName: string, organizationId: string, initialNumber: string | null ) => {
    const intl = useIntl()
    const MeterWithSameNumberIsExistMessage = intl.formatMessage({ id: 'meter.MeterWithSameNumberIsExist' })
    const MeterWithSameAccountNumberIsExistMessage = intl.formatMessage({ id: 'meter.MeterWithSameAccountNumberIsExist' })
    const CanNotBeEarlierThanInstallationMessage = intl.formatMessage({ id: 'meter.СanNotBeEarlierThanInstallation' })
    const CanNotBeEarlierThanFirstVerificationMessage = intl.formatMessage({ id: 'meter.CanNotBeEarlierThanFirstVerification' })

    const { refetch } = Meter.useObjects({
        where: {
            organization: { id: organizationId },
        },
    }, { skip: true })

    const earlierThanInstallationValidator: Rule = useMemo(() => ({
        validator: async (_, value) => {
            if (!value || !installationDate)
                return Promise.resolve()

            if (value.toDate() < installationDate.toDate()) {
                return Promise.reject(CanNotBeEarlierThanInstallationMessage)
            }

            return Promise.resolve()
        },
    }), [CanNotBeEarlierThanInstallationMessage, installationDate])

    const earlierThanFirstVerificationDateValidator: Rule = useMemo(() => ({
        validator: async (_, value) => {
            if (!value || !verificationDate)
                return Promise.resolve()

            if (value.toDate() < verificationDate.toDate()) {
                return Promise.reject(CanNotBeEarlierThanFirstVerificationMessage)
            }

            return Promise.resolve()
        },
    }), [CanNotBeEarlierThanFirstVerificationMessage, verificationDate])

    const meterWithSameNumberValidator: Rule = useMemo(() => ({
        validator: async (_, value) => {
            if (!value) return Promise.resolve()

            const trimmedValue = value.trim()

            if (!trimmedValue) return Promise.resolve()
            if (initialNumber && initialNumber === trimmedValue) return Promise.resolve()

            const { data: { objs } } = await refetch({
                where: {
                    organization: { id: organizationId },
                    number: trimmedValue,
                },
            })

            if (!isEmpty(objs))
                return Promise.reject(MeterWithSameNumberIsExistMessage)

            return Promise.resolve()
        },
    }), [MeterWithSameNumberIsExistMessage, initialNumber, organizationId])

    const meterWithSameAccountNumberInOtherUnitValidation: Rule = useMemo(() => ({
        validator: async (_, value) => {
            if (!value) return Promise.resolve()

            const { data: { objs } } = await refetch({
                where: {
                    accountNumber: value,
                    organization: { id: organizationId },
                    deletedAt: null,
                    OR: [
                        { unitName_not: unitName },
                        { property: { id_not: propertyId } },
                    ],
                },
            })

            if (!isEmpty(objs))
                return Promise.reject(MeterWithSameAccountNumberIsExistMessage)

            return Promise.resolve()
        },
    }), [MeterWithSameNumberIsExistMessage, organizationId, propertyId, refetch, unitName])

    return useMemo(() => ({
        meterWithSameAccountNumberInOtherUnitValidation,
        meterWithSameNumberValidator,
        earlierThanFirstVerificationDateValidator,
        earlierThanInstallationValidator,
    }), [
        earlierThanFirstVerificationDateValidator,
        earlierThanInstallationValidator,
        meterWithSameAccountNumberInOtherUnitValidation,
        meterWithSameNumberValidator,
    ])
}
