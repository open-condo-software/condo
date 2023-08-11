import get from 'lodash/get'
import Head from 'next/head'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import bridge from '@open-condo/bridge'
import type { CondoBridgeSubscriptionListener } from '@open-condo/bridge'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography, Tag, Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { PageWrapper, PageHeader, TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'

import { useBillingAndAcquiringContexts } from './ContextProvider'
import { EmptyContent } from './EmptyContent'
import { MainContent } from './MainContent'


export const BillingPageContent: React.FC = () => {
    const { billingContext, refetchBilling } = useBillingAndAcquiringContexts()
    const billingName = get(billingContext, ['integration', 'name'], '')

    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.accrualsAndPayments' })
    const ConnectedStatusMessage = intl.formatMessage({ id: 'accrualsAndPayments.billing.statusTag.connected' }, { name: billingName })
    const ErrorStatusMessage = intl.formatMessage({ id: 'accrualsAndPayments.billing.statusTag.error' }, { name: billingName })
    const DefaultUploadMessage = intl.formatMessage({ id: 'accrualsAndPayments.billing.uploadReceiptsAction.defaultMessage' })
    const NoPermissionMessage = intl.formatMessage({ id:'global.noPageViewPermission' })

    const userOrganization = useOrganization()
    const canReadBillingReceipts = get(userOrganization, ['link', 'role', 'canReadBillingReceipts'], false)
    const canReadPayments = get(userOrganization, ['link', 'role', 'canReadPayments'], false)

    const currentProblem = get(billingContext, 'currentProblem')
    const uploadUrl = get(billingContext, ['integration', 'uploadUrl'])
    const uploadMessage = get(billingContext, ['integration', 'uploadMessage'])
    const lastReport = get(billingContext, 'lastReport')

    const tagBg = currentProblem ? colors.red['5'] : colors.green['5']
    const tagMessage = currentProblem ? ErrorStatusMessage : ConnectedStatusMessage

    const [uploadModalId, setUploadModalId] = useState<string | null>(null)

    const handleUploadClick = useCallback(() => {
        if (uploadUrl) {
            // NOTE: Open bridge modal since it will register handlers and modalId automatically
            // Then update state to start monitoring that modal from condo side
            bridge
                .send('CondoWebAppShowModalWindow', { url: uploadUrl, size: 'big', title: '' })
                .then(data => setUploadModalId(data.modalId))
                .catch(console.error)
        }
    }, [uploadUrl])

    useEffect(() => {
        if (uploadModalId) {
            const handleClose: CondoBridgeSubscriptionListener = (event) => {
                if (event.type !== 'CondoWebAppCloseModalWindowResult' ||
                    event.data.requestId ||
                    !('modalId' in event.data) ||
                    event.data.modalId !== uploadModalId) {
                    return
                }
                setUploadModalId(null)
                refetchBilling()
            }
            bridge.subscribe(handleClose)

            return () => bridge.unsubscribe(handleClose)
        }
    }, [uploadModalId, refetchBilling])

    const UploadAction = useMemo(() => {
        if (!uploadUrl) {
            return null
        }

        return (
            <Button type='primary' onClick={handleUploadClick}>
                {uploadMessage || DefaultUploadMessage}
            </Button>
        )
    }, [handleUploadClick, uploadUrl, uploadMessage, DefaultUploadMessage])

    if (!canReadBillingReceipts || !canReadPayments) {
        return <LoadingOrErrorPage error={NoPermissionMessage}/>
    }

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} extra={<Tag bgColor={tagBg} textColor={colors.white}>{tagMessage}</Tag>}/>
                <TablePageContent>
                    {
                        lastReport
                            ? (
                                <MainContent uploadComponent={UploadAction}/>
                            ) : (
                                <EmptyContent uploadComponent={UploadAction}/>
                            )
                    }
                </TablePageContent>
            </PageWrapper>
        </>
    )
}
