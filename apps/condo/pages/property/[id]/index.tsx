/** @jsx jsx */
import { DeleteFilled } from '@ant-design/icons'
import { TicketStatusTypeType as TicketStatusType } from '@app/condo/schema'
import { jsx } from '@emotion/react'
import { Row, Col, Space, RowProps } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isNull from 'lodash/isNull'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useMemo, useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import type { ListProps } from '@open-condo/ui'
import { List, Typography, Button } from '@open-condo/ui'

import ActionBar from '@condo/domains/common/components/ActionBar'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import {
    DeleteButtonWithConfirmModal,
    IDeleteActionButtonWithConfirmModal,
} from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PropertyPanels } from '@condo/domains/property/components/panels'
import { CustomScrollbarCss } from '@condo/domains/property/components/panels/Builder/BuildingPanelCommon'
import { PropertyReportCard } from '@condo/domains/property/components/PropertyReportCard'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { TicketStatus } from '@condo/domains/ticket/utils/clientSchema'


const PROPERTY_PAGE_CONTENT_ROW_GUTTER: RowProps['gutter'] = [12, 40]
const PROPERTY_PAGE_CONTENT_ROW_INFO_BLOCK_GUTTER: RowProps['gutter'] = [52, 24]
const PROPERTY_PAGE_CONTENT_ROW_INFO_BLOCK_STYLE: React.CSSProperties = { marginTop: '80px' }
const PROPERTY_PAGE_CONTENT_ROW_STYLE: React.CSSProperties = { marginTop: '60px' }
const PROPERTY_PAGE_ACTION_BAR_SPACE_STYLE: React.CSSProperties = { marginBottom: 0 }
const PROPERTY_PAGE_SPACE_STYLE: React.CSSProperties = { width: '100%' }
const DELETE_BUTTON_CUSTOM_PROPS: IDeleteActionButtonWithConfirmModal['buttonCustomProps'] = {
    type: 'sberDangerGhost',
    icon: <DeleteFilled />,
}

export const PropertyPageContent = ({ property, role = null, organizationId = null }) => {
    const intl = useIntl()
    const UnitsCountTitle = intl.formatMessage({ id: 'pages.condo.property.id.UnitsCount' })
    const UninhabitedUnitsCountTitle = intl.formatMessage({ id: 'pages.condo.property.id.UninhabitedUnitsCountTitle' })
    const TicketsClosedTitle = intl.formatMessage({ id: 'pages.condo.property.id.TicketsClosed' })
    const TicketsInWorkTitle = intl.formatMessage({ id: 'pages.condo.property.id.TicketsInWork' })
    const TicketsDeferredTitle = intl.formatMessage({ id: 'pages.condo.property.id.TicketsDeferred' })
    const DeletePropertyLabel = intl.formatMessage({ id: 'pages.condo.property.form.DeleteLabel' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'pages.condo.property.form.ConfirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'pages.condo.property.form.ConfirmDeleteMessage' })
    const AreaTitle = intl.formatMessage({ id: 'pages.condo.property.form.AreaTitle' })
    const YearOfConstructionTitle = intl.formatMessage({ id: 'pages.condo.property.form.YearOfConstructionTitle' })
    const EditPropertyTitle = intl.formatMessage({ id: 'pages.condo.property.id.EditPropertyTitle' })
    const EditPropertyMapTitle = intl.formatMessage({ id: 'pages.condo.property.id.EditPropertyMapTitle' })
    const UnknownValueTitle = intl.formatMessage({ id: 'pages.condo.property.id.UnknownMessage' })
    const TicketsTitle = intl.formatMessage({ id: 'global.section.tickets' })
    const PropertyInformationTitle = intl.formatMessage({ id: 'pages.condo.property.id.propertyInformationTitle' })
    const ParkingTitle = intl.formatMessage({ id: 'field.sectionType.parking' })
    const ParkingAvailableTitle = intl.formatMessage({ id: 'global.available' })
    const ParkingNotAvailableTitle = intl.formatMessage({ id: 'global.notAvailable' })

    const { push } = useRouter()

    const softDeleteAction = Property.useSoftDelete( () => push('/property/'))
    const { objs: ticketStatuses, loading: ticketStatusLoading } = TicketStatus.useObjects({})

    const yearOfConstructionCardLabel = property.yearOfConstruction
        ? dayjs(property.yearOfConstruction).format('YYYY')
        : UnknownValueTitle

    const ticketInWorkClick = useCallback(() => {
        if (typeof window !== 'undefined' && !ticketStatusLoading && Number(property.ticketsInWork)) {
            const inWorkStatus = ticketStatuses.find(status => status.type === TicketStatusType.Processing)
            if (inWorkStatus) {
                window.open(`/ticket?filters={"status":"${inWorkStatus.id}","property":"${property.id}"}`, '_blank')
            }
        }
    }, [property, ticketStatusLoading, ticketStatuses])
    const ticketDeferredClick = useCallback(() => {
        if (typeof window !== 'undefined' && !ticketStatusLoading && Number(property.ticketsDeferred)) {
            const deferredTicketStatus = ticketStatuses.find(status => status.type === TicketStatusType.Deferred)
            if (deferredTicketStatus) {
                window.open(`/ticket?filters={"status":"${deferredTicketStatus.id}","property":"${property.id}"}`, '_blank')
            }
        }
    }, [property, ticketStatusLoading, ticketStatuses])
    const ticketClosedClick = useCallback(() => {
        if (typeof window !== 'undefined' && !ticketStatusLoading && Number(property.ticketsClosed)) {
            const closedTicketStatus = ticketStatuses.find(status => status.type === TicketStatusType.Closed)
            if (closedTicketStatus) {
                window.open(`/ticket?filters={"status":"${closedTicketStatus.id}","property":"${property.id}"}`, '_blank')
            }
        }
    }, [property, ticketStatusLoading, ticketStatuses])

    const propertyInfoDataSource = useMemo<ListProps['dataSource']>(() => [
        {
            label: AreaTitle,
            value: property.area ? property.area : UnknownValueTitle,
        },
        {
            label: YearOfConstructionTitle,
            value: yearOfConstructionCardLabel,
        },
        {
            label: UnitsCountTitle,
            value: property.unitsCount,
        },
        {
            label: UninhabitedUnitsCountTitle,
            value: property.uninhabitedUnitsCount,
        },
        {
            label: ParkingTitle,
            value: get(property, ['map', 'parking', 'length']) ? ParkingAvailableTitle : ParkingNotAvailableTitle,
        },
    ], [AreaTitle, property, ParkingTitle, UnitsCountTitle, UninhabitedUnitsCountTitle, yearOfConstructionCardLabel,
        UnknownValueTitle, YearOfConstructionTitle, ParkingAvailableTitle, ParkingNotAvailableTitle])
    const propertyTicketDataSource = useMemo<ListProps['dataSource']>(() => [
        {
            label: TicketsInWorkTitle,
            value: property.ticketsInWork,
            valueTextType: 'warning',
            valueClick: Number(property.ticketsInWork) ? ticketInWorkClick : undefined,
        },
        {
            label: TicketsDeferredTitle,
            value: property.ticketsDeferred,
            valueTextType: 'info',
            valueClick: Number(property.ticketsDeferred) ? ticketDeferredClick : undefined,
        },
        {
            label: TicketsClosedTitle,
            value: property.ticketsClosed,
            valueTextType: 'success',
            valueClick: Number(property.ticketsClosed) ? ticketClosedClick : undefined,
        },
    ], [TicketsDeferredTitle, TicketsInWorkTitle, TicketsClosedTitle, property,
        ticketDeferredClick, ticketInWorkClick, ticketClosedClick])

    const canManageProperties = get(role, 'canManageProperties', false)

    return (
        <>
            <Row gutter={PROPERTY_PAGE_CONTENT_ROW_GUTTER} align='top'>
                <Col span={24}>
                    <Space direction='vertical' size={20}>
                        <Typography.Title level={1}>{property.address}</Typography.Title>
                        {
                            property.name ?
                                <Typography.Title level={3} type='secondary'>«{property.name}»</Typography.Title> :
                                null
                        }
                    </Space>
                </Col>
            </Row>
            <Row
                gutter={PROPERTY_PAGE_CONTENT_ROW_INFO_BLOCK_GUTTER}
                style={PROPERTY_PAGE_CONTENT_ROW_INFO_BLOCK_STYLE}
            >
                <Col xl={12} md={24} sm={24} xs={24}>
                    <Space direction='vertical' size={40} style={PROPERTY_PAGE_SPACE_STYLE}>
                        <List title={PropertyInformationTitle} dataSource={propertyInfoDataSource} />
                        <List title={TicketsTitle} dataSource={propertyTicketDataSource} />
                    </Space>
                </Col>
                <Col xl={12} md={24} sm={24} xs={24}>
                    <PropertyReportCard property={property} organizationId={organizationId} role={role} />
                </Col>
            </Row>
            <Row gutter={PROPERTY_PAGE_CONTENT_ROW_GUTTER} style={PROPERTY_PAGE_CONTENT_ROW_STYLE}>
                <Col span={24} css={CustomScrollbarCss}>
                    <PropertyPanels
                        mode='view'
                        map={property.map}
                        address={property.address}
                        canManageProperties={canManageProperties}
                    />
                </Col>
            </Row>
            {
                canManageProperties ? (
                    <ActionBar>
                        <Space size={20} wrap style={PROPERTY_PAGE_ACTION_BAR_SPACE_STYLE}>
                            <Link href={`/property/${property.id}/update`}>
                                <span>
                                    <Button
                                        type='primary'
                                    >
                                        {EditPropertyTitle}
                                    </Button>
                                </span>
                            </Link>
                            {
                                !isNull(get(property, 'map')) && (
                                    <Link href={`/property/${property.id}/map/update`}>
                                        <Button
                                            color='green'
                                            type='secondary'
                                            data-cy='property-map__update-button'
                                        >
                                            {EditPropertyMapTitle}
                                        </Button>
                                    </Link>
                                )
                            }
                            <DeleteButtonWithConfirmModal
                                title={ConfirmDeleteTitle}
                                message={ConfirmDeleteMessage}
                                okButtonLabel={DeletePropertyLabel}
                                action={() => softDeleteAction(property)}
                                buttonCustomProps={DELETE_BUTTON_CUSTOM_PROPS}
                                buttonContent={<span>{DeletePropertyLabel}</span>}
                            />
                        </Space>
                    </ActionBar>
                ) : null
            }
        </>
    )
}

interface IPropertyIdPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const PropertyIdPage: IPropertyIdPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.property.id.PageTitle' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })

    const { query: { id } } = useRouter()
    const { loading, obj: property, error } = Property.useObject({ where: { id: id as string } })
    const { link } = useOrganization()

    if (error || loading) {
        return <LoadingOrErrorPage title={PageTitleMsg} loading={loading} error={error ? ServerErrorMsg : null}/>
    }

    return <>
        <Head>
            <title>{PageTitleMsg}</title>
        </Head>
        <PageWrapper>
            <PageContent>
                <PropertyPageContent
                    property={property}
                    role={link.role}
                    organizationId={link.organization.id}
                />
            </PageContent>
        </PageWrapper>
    </>
}

PropertyIdPage.requiredAccess = OrganizationRequired

export default PropertyIdPage
