import { MeterUnitTypeType } from '@app/condo/schema'
import { Dayjs } from 'dayjs'
import isEmpty from 'lodash/isEmpty'
import { Rule } from 'rc-field-form/lib/interface'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'


import { Meter, MeterResourceOwner, PropertyMeter } from '@condo/domains/meter/utils/clientSchema'

export const useMeterValidations = (isPropertyMeter: boolean, installationDate: Dayjs, verificationDate: Dayjs, propertyId: string, unitName: string | null, organizationId: string, initialNumber: string | null, addressKey: string, unitType: MeterUnitTypeType | null) => {
    const intl = useIntl()
    const MeterWithSameNumberIsExistMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterWithSameNumberIsExist' })
    const MeterWithSameAccountNumberIsExistMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterWithSameAccountNumberIsExist' })
    const CanNotBeEarlierThanInstallationMessage = intl.formatMessage({ id: 'pages.condo.meter.СanNotBeEarlierThanInstallation' })
    const CanNotBeEarlierThanFirstVerificationMessage = intl.formatMessage({ id: 'pages.condo.meter.CanNotBeEarlierThanFirstVerification' })
    const ResourceOwnedByAnotherOrganizationTitle = intl.formatMessage({ id: 'pages.condo.meter.create.resourceOwnedByAnotherOrganization' })

    const MeterIdentity = isPropertyMeter ? PropertyMeter : Meter
    const { refetch } = MeterIdentity.useObjects({
        where: {
            organization: { id: organizationId },
        },
    }, { skip: true })

    const { refetch: refetchMeterResourceOwners } = MeterResourceOwner.useObjects({
        where: { addressKey },
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
    }), [MeterWithSameNumberIsExistMessage, initialNumber, organizationId, refetch])

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
                        { unitType_not: unitType },
                        { property: { id_not: propertyId } },
                    ],
                },
            })

            if (!isEmpty(objs))
                return Promise.reject(MeterWithSameAccountNumberIsExistMessage)

            return Promise.resolve()
        },
    }), [MeterWithSameAccountNumberIsExistMessage, organizationId, propertyId, refetch, unitName, unitType])

    const meterResourceOwnerValidation: Rule = useMemo(() => ({
        validator: async (_, value) => {
            if (!value) return Promise.resolve()

            const { data: { objs } } = await refetchMeterResourceOwners({
                where: {
                    resource: { id: value },
                    addressKey,
                },
            })

            if (objs.length > 0) {
                if (objs[0].organization.id !== organizationId) {
                    return Promise.reject(ResourceOwnedByAnotherOrganizationTitle)
                }
            }

            return Promise.resolve()
        },
    }), [addressKey, refetchMeterResourceOwners, organizationId, ResourceOwnedByAnotherOrganizationTitle])

    return useMemo(() => ({
        meterWithSameAccountNumberInOtherUnitValidation,
        meterWithSameNumberValidator,
        earlierThanFirstVerificationDateValidator,
        earlierThanInstallationValidator,
        meterResourceOwnerValidation,
    }), [
        earlierThanFirstVerificationDateValidator,
        earlierThanInstallationValidator,
        meterWithSameAccountNumberInOtherUnitValidation,
        meterWithSameNumberValidator,
        meterResourceOwnerValidation,
    ])
}
