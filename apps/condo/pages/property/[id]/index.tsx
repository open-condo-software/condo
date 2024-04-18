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
import React, { useMemo, useCallback, useState, useRef } from 'react'

import { Plus, PlusCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, ListProps, Tabs } from '@open-condo/ui'
import { List, Typography, Button } from '@open-condo/ui'

import { PageContent, PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import {
    DeleteButtonWithConfirmModal,
} from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { useUploadDocumentsModal } from '@condo/domains/document/hooks/useUploadDocumentsModal'
import { Document } from '@condo/domains/document/utils/clientSchema'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PropertyPanels } from '@condo/domains/property/components/panels'
import { CustomScrollbarCss } from '@condo/domains/property/components/panels/Builder/BuildingPanelCommon'
import { PropertyDocuments } from '@condo/domains/property/components/PropertyDocuments/PropertyDocuments'
import { PropertyReportCard } from '@condo/domains/property/components/PropertyReportCard'
import { Property } from '@condo/domains/property/utils/clientSchema'


const PROPERTY_PAGE_CONTENT_ROW_GUTTER: RowProps['gutter'] = [12, 40]
const PROPERTY_PAGE_CONTENT_ROW_INFO_BLOCK_GUTTER: RowProps['gutter'] = [52, 24]
const PROPERTY_PAGE_CONTENT_ROW_INFO_BLOCK_STYLE: React.CSSProperties = { marginTop: '80px', marginRight: '-20px' }
const PROPERTY_PAGE_CONTENT_ROW_STYLE: React.CSSProperties = { marginTop: '60px' }
const PROPERTY_PAGE_SPACE_STYLE: React.CSSProperties = { width: '100%' }


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
    const canReadPropertyDocuments = get(role, 'canReadDocuments', false)

    const [currentTab, setCurrentTab] = useState<'map' | 'documents'>('map')

    const propertyId = get(property, 'id')
    const { count: propertyDocumentsCount, refetch: refetchDocumentsCount } = Document.useCount({
        where: {
            property: { id: propertyId },
        },
    }, { skip: !propertyId })

    const tabItems = [
        breakpoints.TABLET_LARGE && {
            key: 'map',
            label: 'Шахматка',
            children: (
                <PropertyPanels
                    mode='view'
                    map={property.map}
                    address={property.address}
                    canManageProperties={canManageProperties}
                />
            ),
        },
        canReadPropertyDocuments && {
            key: 'documents',
            label: propertyDocumentsCount > 0 ? `Документы (${propertyDocumentsCount})` : 'Документы',
            children: (
                <PropertyDocuments
                    organizationId={organizationId}
                    propertyId={get(property, 'id')}
                    role={role}
                    refetchDocumentsCount={refetchDocumentsCount}
                    propertyDocumentsCount={propertyDocumentsCount}
                />
            ),
        },
    ]

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
            <Row gutter={[0, 24]} style={PROPERTY_PAGE_CONTENT_ROW_STYLE}>
                <Col span={24} css={CustomScrollbarCss}>
                    <Tabs
                        activeKey={currentTab}
                        onChange={(key: 'map' | 'documents') => setCurrentTab(key)}
                        items={tabItems}
                    />
                </Col>
            </Row>
            {
                currentTab === 'map' && canManageProperties ? (
                    <Col span={24} style={PROPERTY_PAGE_CONTENT_ROW_STYLE}>
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
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.property.id.PageTitle' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const PropertyNotFoundTitle = intl.formatMessage({ id: 'pages.condo.property.id.NotFound.PageTitle' })
    const PropertyNotFoundMessage = intl.formatMessage({ id: 'pages.condo.property.id.NotFound.Message' })

    const { query: { id } } = useRouter()
    const { link, organization } = useOrganization()

    const organizationId = get(organization, 'id', null)

    const { loading, obj: property, error } = Property.useObject({
        where: {
            id: id as string,
            organization: {
                id: organizationId,
            },
        },
    })

    if (error || loading) {
        return <LoadingOrErrorPage title={PageTitleMsg} loading={loading} error={error ? ServerErrorMsg : null}/>
    }

    if (!property) {
        return <LoadingOrErrorPage title={PropertyNotFoundTitle} loading={false} error={PropertyNotFoundMessage}/>
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
