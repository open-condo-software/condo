import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { 
    ActionBar, 
    Button,
    Typography,
} from '@open-condo/ui'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import {
    DeleteButtonWithConfirmModal,
} from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { Loader } from '@condo/domains/common/components/Loader'
import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { PageComponentType } from '@condo/domains/common/types'
import { SettingsReadPermissionRequired } from '@condo/domains/settings/components/PageAccess'
import { TicketPropertyHintContent } from '@condo/domains/ticket/components/TicketPropertyHint/TicketPropertyHintContent'
import { TicketPropertyHint, TicketPropertyHintProperty } from '@condo/domains/ticket/utils/clientSchema'
import { getAddressRender } from '@condo/domains/ticket/utils/clientSchema/Renders'


const BIG_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 60]
const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 24]

const TicketPropertyHintIdPage: PageComponentType = () => {
    const intl = useIntl()
    const TicketPropertyHintTitleMessage = intl.formatMessage({ id: 'Hint' })
    const NameMessage  = intl.formatMessage({ id: 'pages.condo.property.section.form.name' })
    const BuildingsMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Buildings' })
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'pages.condo.settings.hint.form.ConfirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'pages.condo.property.form.ConfirmDeleteMessage' })

    const router = useRouter()
    const { link } = useOrganization()
    const canManageTicketPropertyHints = useMemo(() => get(link, ['role', 'canManageTicketPropertyHints']), [link])

    const hintId = get(router, ['query', 'id'], null)
    const { loading, obj: ticketPropertyHint } = TicketPropertyHint.useObject({
        where: { id: hintId },
    })

    const handleDeleteAction = TicketPropertyHint.useSoftDelete(() => router.push('/settings/hint'))

    const { objs: ticketPropertyHintProperties } = TicketPropertyHintProperty.useObjects({
        where: {
            ticketPropertyHint: { id: hintId },
        },
    })
    const properties = useMemo(() => ticketPropertyHintProperties.map(ticketPropertyHintProperty => ticketPropertyHintProperty.property), [ticketPropertyHintProperties])
    const ticketPropertyHintName = useMemo(() => get(ticketPropertyHint, 'name'), [ticketPropertyHint])

    const renderTicketPropertyHintProperties = useMemo(() => properties.map(property => (
        <Typography.Paragraph key={property.id}>
            <Typography.Link
                href={`/property/${get(property, 'id')}`}
            >
                {getAddressRender(property)}
            </Typography.Link>
        </Typography.Paragraph>
    )), [properties])

    const handleDeleteButtonClick = useCallback(async () => {
        await handleDeleteAction(ticketPropertyHint)
    }, [handleDeleteAction, ticketPropertyHint])

    const ticketPropertyHintContent = useMemo(() => get(ticketPropertyHint, 'content'), [ticketPropertyHint])

    if (loading) {
        return <Loader />
    }

    return (
        <>
            <Head>
                <title>{TicketPropertyHintTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={BIG_VERTICAL_GUTTER}>
                        <Col span={24}>
                            <Typography.Title>{TicketPropertyHintTitleMessage}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <Row gutter={MEDIUM_VERTICAL_GUTTER}>
                                <Col span={24}>
                                    <PageFieldRow title={BuildingsMessage}>
                                        {renderTicketPropertyHintProperties}
                                    </PageFieldRow>
                                </Col>
                                <Col span={24}>
                                    <PageFieldRow title={NameMessage}>
                                        {ticketPropertyHintName}
                                    </PageFieldRow>
                                </Col>
                                <Col span={24}>
                                    <PageFieldRow title={TicketPropertyHintTitleMessage}>
                                        <TicketPropertyHintContent
                                            html={ticketPropertyHintContent}
                                        />
                                    </PageFieldRow>
                                </Col>
                            </Row>
                        </Col>
                        {
                            canManageTicketPropertyHints && (
                                <Col span={24}>
                                    <ActionBar
                                        actions={[
                                            <Link key='update' href={`/settings/hint/${hintId}/update`}>
                                                <Button
                                                    type='primary'
                                                >
                                                    {UpdateMessage}
                                                </Button>
                                            </Link>,
                                            <DeleteButtonWithConfirmModal
                                                key='delete'
                                                title={ConfirmDeleteTitle}
                                                message={ConfirmDeleteMessage}
                                                okButtonLabel={DeleteMessage}
                                                action={handleDeleteButtonClick}
                                                buttonContent={DeleteMessage}
                                            />,
                                        ]}
                                    />
                                </Col>
                            )
                        }
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

TicketPropertyHintIdPage.requiredAccess = SettingsReadPermissionRequired

export default TicketPropertyHintIdPage
