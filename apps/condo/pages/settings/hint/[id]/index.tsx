import { Gutter } from 'antd/es/grid/row'
import React, { useCallback, useMemo } from 'react'
import { Col, Row, Typography } from 'antd'
import get from 'lodash/get'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
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
import { TicketPropertyHint, TicketPropertyHintProperty } from '@condo/domains/ticket/utils/clientSchema'
import { getAddressRender } from '@condo/domains/division/utils/clientSchema/Renders'
import { useOrganization } from '@core/next/organization'

const DELETE_BUTTON_CUSTOM_PROPS: IDeleteActionButtonWithConfirmModal['buttonCustomProps'] = {
    type: 'sberDangerGhost',
}

const BIG_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 60]
const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 24]

const TicketPropertyHintIdPage = () => {
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
    }, {
        fetchPolicy: 'network-only',
    })

    const handleDeleteAction = TicketPropertyHint.useSoftDelete({},
        () => router.push('/settings?tab=hint'))

    const { objs: ticketPropertyHintProperties } = TicketPropertyHintProperty.useObjects({
        where: {
            ticketPropertyHint: { id: hintId },
        },
    })
    const softDeleteTicketPropertyHintPropertyAction = TicketPropertyHintProperty.useSoftDelete({}, () => Promise.resolve())
    const properties = useMemo(() => ticketPropertyHintProperties.map(ticketPropertyHintProperty => ticketPropertyHintProperty.property), [ticketPropertyHintProperties])
    const ticketPropertyHintName = useMemo(() => get(ticketPropertyHint, 'name'), [ticketPropertyHint])

    const renderTicketPropertyHintProperties = useMemo(() => properties.map(property => (
        <Link
            key={property.id}
            href={`/property/${get(property, 'id')}`}
        >
            <Typography.Link>
                {property.name || getAddressRender(property)}
            </Typography.Link>
        </Link>
    )), [properties])

    const handleDeleteButtonClick = useCallback(async () => {
        await handleDeleteAction({}, ticketPropertyHint)
        for (const ticketPropertyHintProperty of ticketPropertyHintProperties) {
            await softDeleteTicketPropertyHintPropertyAction({}, ticketPropertyHintProperty)
        }
    }, [handleDeleteAction, softDeleteTicketPropertyHintPropertyAction, ticketPropertyHint, ticketPropertyHintProperties])

    const ticketPropertyHintContent = useMemo(() => ({
        __html: xss(get(ticketPropertyHint, 'content')),
    }), [ticketPropertyHint])

    const deleteButtonContent = useMemo(() => <span>{DeleteMessage}</span>, [DeleteMessage])

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
                                        <div dangerouslySetInnerHTML={ticketPropertyHintContent}/>
                                    </PageFieldRow>
                                </Col>
                            </Row>
                        </Col>
                        {
                            canManageTicketPropertyHints && (
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
                                            buttonContent={deleteButtonContent}
                                        />
                                    </ActionBar>
                                </Col>
                            )
                        }
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

TicketPropertyHintIdPage.requiredAccess = OrganizationRequired

export default TicketPropertyHintIdPage
