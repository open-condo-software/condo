/** @jsx jsx */
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
import { ActionBar, ListProps } from '@open-condo/ui'
import { List, Typography, Button } from '@open-condo/ui'

import { PageContent, PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import {
    DeleteButtonWithConfirmModal,
} from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PropertyPanels } from '@condo/domains/property/components/panels'
import { CustomScrollbarCss } from '@condo/domains/property/components/panels/Builder/BuildingPanelCommon'
import { PropertyReportCard } from '@condo/domains/property/components/PropertyReportCard'
import { Property } from '@condo/domains/property/utils/clientSchema'


const PROPERTY_PAGE_CONTENT_ROW_GUTTER: RowProps['gutter'] = [12, 40]
const PROPERTY_PAGE_CONTENT_ROW_INFO_BLOCK_GUTTER: RowProps['gutter'] = [52, 24]
const PROPERTY_PAGE_CONTENT_ROW_INFO_BLOCK_STYLE: React.CSSProperties = { marginTop: '80px', marginRight: '-20px' }
const PROPERTY_PAGE_CONTENT_ROW_STYLE: React.CSSProperties = { marginTop: '60px' }
const PROPERTY_PAGE_SPACE_STYLE: React.CSSProperties = { width: '100%' }

export const PropertyPageContent = ({ property, role = null, organizationId = null }) => {
    const intl = useIntl()
    const UnitsCountTitle = intl.formatMessage({ id: 'property.id.unitsCount' })
    const UninhabitedUnitsCountTitle = intl.formatMessage({ id: 'property.id.uninhabitedUnitsCountTitle' })
    const TicketsClosedTitle = intl.formatMessage({ id: 'property.id.ticketsClosed' })
    const TicketsInWorkTitle = intl.formatMessage({ id: 'property.id.ticketsInWork' })
    const TicketsDeferredTitle = intl.formatMessage({ id: 'property.id.ticketsDeferred' })
    const DeletePropertyLabel = intl.formatMessage({ id: 'property.form.deleteLabel' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'property.form.confirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'property.form.confirmDeleteMessage' })
    const AreaTitle = intl.formatMessage({ id: 'property.form.areaTitle' })
    const YearOfConstructionTitle = intl.formatMessage({ id: 'property.form.yearOfConstructionTitle' })
    const EditPropertyTitle = intl.formatMessage({ id: 'property.id.editPropertyTitle' })
    const EditPropertyMapTitle = intl.formatMessage({ id: 'property.id.editPropertyMapTitle' })
    const UnknownValueTitle = intl.formatMessage({ id: 'property.id.unknownMessage' })
    const TicketsTitle = intl.formatMessage({ id: 'global.section.tickets' })
    const PropertyInformationTitle = intl.formatMessage({ id: 'property.id.propertyInformationTitle' })
    const ParkingTitle = intl.formatMessage({ id: 'field.sectionType.parking' })
    const ParkingAvailableTitle = intl.formatMessage({ id: 'global.available' })
    const ParkingNotAvailableTitle = intl.formatMessage({ id: 'global.notAvailable' })

    const { push } = useRouter()
    const { breakpoints } = useLayoutContext()

    const softDeleteAction = Property.useSoftDelete( async () => await push('/property'))

    const yearOfConstructionCardLabel = property.yearOfConstruction
        ? dayjs(property.yearOfConstruction).format('YYYY')
        : UnknownValueTitle

    const ticketInWorkClick = useCallback(() => {
        if (typeof window !== 'undefined' && Number(property.ticketsInWork)) {
            window.open(`/ticket?filters={"status":["${TicketStatusType.Processing}"],"property":"${property.id}"}`, '_blank')
        }
    }, [property])
    const ticketDeferredClick = useCallback(() => {
        if (typeof window !== 'undefined' && Number(property.ticketsDeferred)) {
            window.open(`/ticket?filters={"status":["${TicketStatusType.Deferred}"],"property":"${property.id}"}`, '_blank')
        }
    }, [property])
    const ticketClosedClick = useCallback(() => {
        if (typeof window !== 'undefined' && Number(property.ticketsClosed)) {
            window.open(`/ticket?filters={"status":["${TicketStatusType.Closed}"],"property":"${property.id}"}`, '_blank')
        }
    }, [property])

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
            {
                breakpoints.TABLET_LARGE && (
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
                )
            }
            {
                canManageProperties ? (
                    <Col span={24} style={!breakpoints.TABLET_LARGE && PROPERTY_PAGE_CONTENT_ROW_STYLE}>
                        <ActionBar
                            actions={[
                                <Link key='editProperty' href={`/property/${property.id}/update`}>
                                    <Button
                                        type='primary'
                                    >
                                        {EditPropertyTitle}
                                    </Button>
                                </Link>,
                                !isNull(get(property, 'map')) && breakpoints.TABLET_LARGE && (
                                    <Link key='editPropertyMap' href={`/property/${property.id}/map/update`}>
                                        <Button
                                            type='secondary'
                                            data-cy='property-map__update-button'
                                        >
                                            {EditPropertyMapTitle}
                                        </Button>
                                    </Link>
                                ),
                                <DeleteButtonWithConfirmModal
                                    key='delete'
                                    title={ConfirmDeleteTitle}
                                    message={ConfirmDeleteMessage}
                                    okButtonLabel={DeletePropertyLabel}
                                    action={() => softDeleteAction(property)}
                                    buttonContent={DeletePropertyLabel}
                                />,
                            ]}
                        />
                    </Col>
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
    const PageTitleMsg = intl.formatMessage({ id: 'property.id.pageTitle' })
    const ServerErrorMsg = intl.formatMessage({ id: 'serverError' })

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
