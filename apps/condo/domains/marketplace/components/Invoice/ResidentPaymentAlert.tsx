import React, { useEffect, useState } from 'react'

import { useLazyQuery } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Alert, Typography } from '@open-condo/ui'

import { Loader } from '@condo/domains/common/components/Loader'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { GET_RESIDENT_EXISTENCE_BY_PHONE_AND_ADDRESS_QUERY } from '@condo/domains/resident/gql'


export const ResidentPaymentAlert = ({ propertyId, unitName, unitType, clientPhone, isCreatedByResident }) => {
    const intl = useIntl()
    const CreatedByResidentMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.message.createdByResident' })
    const CreatedByResidentDescription = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.description.createdByResident' })
    const HasAppMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.message.hasApp' })
    const LinkWillBeGeneratedMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.description.linkWillBeGeneratedMessage' })
    const HasAppOnAddressMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.description.hasAppOnAddress' })
    const HasAppOnOtherAddressMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.description.hasAppOnOtherAddress' })
    const PassPaymentLinkMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.message.passLinkToResident' })
    const NoAppMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.paymentAlert.description.hasNotApp' })

    const [residentExistence, setResidentExistence] = useState<{ hasResident: boolean, hasResidentOnAddress: boolean }>()

    const [getResidentExistenceByPhoneAndAddress, { loading }] = useLazyQuery(
        GET_RESIDENT_EXISTENCE_BY_PHONE_AND_ADDRESS_QUERY,
        {
            onCompleted: (data) => {
                const { result: { hasResident, hasResidentOnAddress } } = data
                setResidentExistence({ hasResident, hasResidentOnAddress })
            },
        },
    )

    useEffect(() => {
        if (isCreatedByResident || !propertyId || !unitName || !unitType || !clientPhone) return

        const sender = getClientSideSenderInfo()
        const meta = { dv: 1, sender }

        getResidentExistenceByPhoneAndAddress({
            variables: {
                data: {
                    propertyId,
                    unitName,
                    unitType,
                    phone: clientPhone,
                    ...meta,
                },
            },
        })
    }, [clientPhone, getResidentExistenceByPhoneAndAddress, isCreatedByResident, propertyId, unitName, unitType])

    if (loading) return <Loader />
    if (!residentExistence && !isCreatedByResident) return null

    let type: 'warning' | 'info'
    let message
    let description

    if (isCreatedByResident) {
        type = 'info'
        message = CreatedByResidentMessage
        description = CreatedByResidentDescription
    } else if (residentExistence.hasResidentOnAddress) {
        type = 'info'
        message = HasAppMessage
        description = (
            <>
                <Typography.Paragraph size='medium'>
                    {HasAppOnAddressMessage}
                </Typography.Paragraph>
                <Typography.Paragraph size='medium'>
                    {LinkWillBeGeneratedMessage}
                </Typography.Paragraph>
            </>
        )
    } else if (residentExistence.hasResident) {
        type = 'warning'
        message = HasAppMessage
        description = (
            <>
                <Typography.Paragraph size='medium'>
                    {HasAppOnOtherAddressMessage}
                </Typography.Paragraph>
                <Typography.Paragraph size='medium'>
                    {LinkWillBeGeneratedMessage}
                </Typography.Paragraph>
            </>
        )
    } else {
        type = 'warning'
        message = PassPaymentLinkMessage
        description = (
            <>
                <Typography.Paragraph size='medium'>
                    {NoAppMessage}
                </Typography.Paragraph>
                <Typography.Paragraph size='medium'>
                    {LinkWillBeGeneratedMessage}
                </Typography.Paragraph>
            </>
        )
    }

    return (
        <Alert
            type={type}
            message={message}
            description={description}
            showIcon
        />
    )
}