import Head from 'next/head'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography, Tag, Modal, Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { PageWrapper, PageHeader, TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'

import { EmptyContent } from './EmptyContent'
import { MainContent } from './MainContent'


import type { BillingIntegrationProblem } from '@app/condo/schema'

type BillingPageContentProps = {
    billingName: string
    instructionLink?: string
    connectedMessage?: string
    uploadUrl?: string
    uploadMessage?: string
    hasReceipts: boolean
    extendsBillingPage: boolean
    billingPageTitle?: string
    appUrl?: string
    problem?: Pick<BillingIntegrationProblem, 'title' | 'message'>
}

export const BillingPageContent: React.FC<BillingPageContentProps> = ({
    billingName,
    connectedMessage,
    instructionLink,
    uploadUrl,
    uploadMessage,
    problem,
    hasReceipts,
    extendsBillingPage,
    billingPageTitle,
    appUrl,
}) => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.accrualsAndPayments' })
    const ConnectedStatusMessage = intl.formatMessage({ id: 'accrualsAndPayments.billing.statusTag.connected' }, { name: billingName })
    const ErrorStatusMessage = intl.formatMessage({ id: 'accrualsAndPayments.billing.statusTag.error' }, { name: billingName })
    const DefaultUploadMessage = intl.formatMessage({ id: 'accrualsAndPayments.billing.uploadReceiptsAction.defaultMessage' })

    const [spawnModal, ModalContextHandler] = Modal.useModal()

    const tagBg = problem ? colors.red['5'] : colors.green['5']
    const tagMessage = problem ? ErrorStatusMessage : ConnectedStatusMessage

    const handleUploadClick = useCallback(() => {
        if (uploadUrl) {
            spawnModal({
                children: <IFrame src={uploadUrl} reloadScope='organization' withResize withPrefetch withLoader/>,
            })
        }
    }, [uploadUrl, spawnModal])

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

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} extra={<Tag bgColor={tagBg} textColor={colors.white}>{tagMessage}</Tag>}/>
                <TablePageContent>
                    {
                        hasReceipts
                            ? (
                                <MainContent
                                    billingName={billingName}
                                    extendsBillingPage={extendsBillingPage}
                                    billingPageTitle={billingPageTitle}
                                    appUrl={appUrl}
                                />
                            ) : (
                                <EmptyContent
                                    problem={problem}
                                    connectedMessage={connectedMessage}
                                    uploadComponent={UploadAction}
                                    instructionUrl={instructionLink}
                                />
                            )
                    }
                </TablePageContent>
                {ModalContextHandler}
            </PageWrapper>
        </>
    )
}