import { green } from '@ant-design/colors'
import { Col, Row, Typography } from 'antd'
import get from 'lodash/get'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'
import xss from 'xss'

import { useIntl } from '@core/next/intl'

import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import {
    DeleteButtonWithConfirmModal,
    IDeleteActionButtonWithConfirmModal,
} from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { Loader } from '@condo/domains/common/components/Loader'
import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { TicketHint } from '@condo/domains/ticket/utils/clientSchema'


const DELETE_BUTTON_CUSTOM_PROPS: IDeleteActionButtonWithConfirmModal['buttonCustomProps'] = {
    type: 'sberDangerGhost',
}

const TicketHintIdPage = () => {
    const intl = useIntl()
    const TicketHintTitleMessage = intl.formatMessage({ id: 'Hint' })
    const ApartmentComplexNameMessage  = intl.formatMessage({ id: 'ApartmentComplexName' })
    const BuildingsMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Buildings' })
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'pages.condo.settings.hint.form.ConfirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'pages.condo.property.form.ConfirmDeleteMessage' })

    const router = useRouter()

    const hintId = get(router, ['query', 'id'], null)
    const { loading, obj: ticketHint, error } = TicketHint.useObject({
        where: { id: hintId },
    }, {
        fetchPolicy: 'network-only',
    })

    const handleDeleteAction = TicketHint.useSoftDelete({},
        () => router.push('/settings?tab=hint'))

    const ticketHintProperties = get(ticketHint, 'properties', [])
    const renderTicketHintProperties = useMemo(() => ticketHintProperties.map(property => (
        <Link
            key={property.id}
            href={`/property/${get(property, 'id')}`}
        >
            <Typography.Link style={{ color: green[6], display: 'block' }}>
                {property.name || property.address}
            </Typography.Link>
        </Link>
    )), [ticketHintProperties])

    const handleDeleteButtonClick = useCallback(async () => {
        await handleDeleteAction({}, ticketHint)
    }, [handleDeleteAction, ticketHint])

    if (loading) {
        return <Loader />
    }

    return (
        <>
            <Head>
                <title>{TicketHintTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={[0, 60]}>
                        <Col span={24}>
                            <Typography.Title>{TicketHintTitleMessage}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <Row>
                                <PageFieldRow title={BuildingsMessage}>
                                    {renderTicketHintProperties}
                                </PageFieldRow>
                                <PageFieldRow title={ApartmentComplexNameMessage}>
                                    {ticketHint.name}
                                </PageFieldRow>
                                <PageFieldRow title={TicketHintTitleMessage}>
                                    <div dangerouslySetInnerHTML={{
                                        __html: xss(ticketHint.content),
                                    }}/>
                                </PageFieldRow>
                            </Row>
                        </Col>
                        <Col span={24}>
                            <ActionBar>
                                <Link href={`/settings/hint/${hintId}/update`}>
                                    <Button
                                        color={'green'}
                                        type={'sberDefaultGradient'}
                                    >
                                        {UpdateMessage}
                                    </Button>
                                </Link>
                                <DeleteButtonWithConfirmModal
                                    title={ConfirmDeleteTitle}
                                    message={ConfirmDeleteMessage}
                                    okButtonLabel={DeleteMessage}
                                    action={handleDeleteButtonClick}
                                    buttonCustomProps={DELETE_BUTTON_CUSTOM_PROPS}
                                    buttonContent={<span>{DeleteMessage}</span>}
                                />
                            </ActionBar>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

TicketHintIdPage.requiredAccess = OrganizationRequired

export default TicketHintIdPage
