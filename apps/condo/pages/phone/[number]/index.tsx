import {
    GetTicketsForClientCardQuery,
    useGetContactForClientCardQuery,
    useGetEmployeesForClientCardQuery,
    useGetTicketsForClientCardQuery,
} from '@app/condo/gql'
import {
    BuildingUnitSubType,
    Contact as ContactType,
    Organization as OrganizationType,
    Property,
    SortTicketsBy,
} from '@app/condo/schema'
import { Col, ColProps, Row, RowProps } from 'antd'
import { CarouselRef } from 'antd/es/carousel'
import { EllipsisConfig } from 'antd/lib/typography/Base'
import uniqBy from 'lodash/uniqBy'
import Head from 'next/head'
import { useRouter } from 'next/router'
import qs from 'qs'
import React, { CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'


import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { ExternalLink, History, Mail, PlusCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Carousel, Space, Tabs, Typography } from '@open-condo/ui'

import { PageContent, PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { BuildingIcon } from '@condo/domains/common/components/icons/BuildingIcon'
import { Loader } from '@condo/domains/common/components/Loader'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { Tag } from '@condo/domains/common/components/Tag'
import { PageComponentType } from '@condo/domains/common/types'
import { renderPhone } from '@condo/domains/common/utils/Renders'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { ClientType, getClientCardTabKey, redirectToForm } from '@condo/domains/contact/utils/clientCard'
import { getPropertyAddressParts } from '@condo/domains/property/utils/helpers'
import { IncidentHints } from '@condo/domains/ticket/components/IncidentHints'
import { TicketReadPermissionRequired } from '@condo/domains/ticket/components/PageAccess'
import { TicketResidentFeatures } from '@condo/domains/ticket/components/TicketId/TicketResidentFeatures'
import { TicketPropertyHintCard } from '@condo/domains/ticket/components/TicketPropertyHint/TicketPropertyHintCard'
import { useTicketVisibility } from '@condo/domains/ticket/contexts/TicketVisibilityContext'
import { useClientCardTicketTableColumns } from '@condo/domains/ticket/hooks/useClientCardTicketTableColumns'
import { CallRecordFragment } from '@condo/domains/ticket/utils/clientSchema'
import { getSectionAndFloorByUnitName } from '@condo/domains/ticket/utils/unit'
import './index.css'

//#region Constants, types and styles
type TabDataType = {
    type: ClientType
    property: Property
    unitName: string
    unitType: string
    sectionType: string
    sectionName: string
    organization: OrganizationType
    contact?: Pick<ContactType, 'name' | 'id'>
}

type ClientContactPropsType = {
    phone: string
    lastTicket: GetTicketsForClientCardQuery['tickets'][number]
    contact?: ContactType & { isEmployee?: boolean }
    type: ClientType
    showOrganizationMessage: boolean
}

export type TabKey = 'contactPropertyTickets' | 'residentsEntranceTickets' | 'residentsPropertyTickets'
type TabsItems = { key: TabKey, label: string }[]

const MAX_TABLE_SIZE = 20

export const CONTACT_PROPERTY_TICKETS_TAB = 'contactPropertyTickets'
const RESIDENTS_PROPERTY_TICKETS_TAB = 'residentsPropertyTickets'
const RESIDENTS_ENTRANCE_TICKETS_TAB = 'residentsEntranceTickets'
const tableTabs: Array<TabKey> =  [CONTACT_PROPERTY_TICKETS_TAB, RESIDENTS_ENTRANCE_TICKETS_TAB, RESIDENTS_PROPERTY_TICKETS_TAB]
const ADDRESS_STREET_ONE_ROW_HEIGHT = 25
const ADDRESS_POSTFIX_ONE_ROW_HEIGHT = 22

const TAG_STYLE: CSSProperties = { borderRadius: '100px' }
const ROW_BIG_GUTTER: RowProps['gutter'] = [0, 60]
const ROW_MEDIUM_GUTTER: RowProps['gutter'] = [0, 40]
const ROW_MEDIUM_SMALL_GUTTER: RowProps['gutter'] = [0, 24]
const HINT_CARD_STYLE = { maxHeight: '3em' }
const TICKET_SORT_BY = [SortTicketsBy.CreatedAtDesc]
const HINTS_COL_PROPS: ColProps = { span: 24 }

const getMapData = async (cardsData) => {
    return cardsData.map((tab) => {
        if (tab.unitName && tab.unitType && tab.floorName) return tab

        const section = getSectionAndFloorByUnitName(tab.property, tab.unitName, tab.unitType)

        return { ...tab, ...section }
    })
}

const ClientAddressCard = ({ onClick, active, property, organization, unitName, floorName, unitType, sectionName }) => {
    const intl = useIntl()
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const FlatMessage = intl.formatMessage({ id: 'field.ShortFlatNumber' })
    const ParkingMessage = intl.formatMessage({ id: 'field.UnitType.prefix.parking' })
    const FloorMessage = intl.formatMessage({ id: 'field.ShortFloorName' })
    const SectionMessage = intl.formatMessage({ id: 'field.ShortSectionName' })

    const addressStreetRef = useRef<HTMLDivElement>()
    const addressPostfixRef = useRef<HTMLDivElement>()

    const [addressStreetEllipsis, setAddressStreetEllipsis] = useState<EllipsisConfig>({ rows: 2 })
    const [addressPostfixEllipsis, setAddressPostfixEllipsis] = useState<EllipsisConfig>({ rows: 2 })

    useLayoutEffect(() => {
        const addressStreetTextHeight = addressStreetRef.current.clientHeight
        const addressPostfixTextHeight = addressPostfixRef.current.clientHeight

        if (addressStreetTextHeight > ADDRESS_STREET_ONE_ROW_HEIGHT) {
            setAddressStreetEllipsis({ rows: 2 })
            setAddressPostfixEllipsis({ rows: 1 })
        } else if (addressPostfixTextHeight > ADDRESS_POSTFIX_ONE_ROW_HEIGHT) {
            setAddressStreetEllipsis({ rows: 1 })
            setAddressPostfixEllipsis({ rows: 2 })
        }
    }, [])

    const { text, postfix } = getPropertyAddressParts(property, DeletedMessage)
    const unitNamePrefix = unitType === BuildingUnitSubType.Parking ? ParkingMessage : FlatMessage
    const streetMessage = unitName ? text : text.substring(0, text.length - 1)

    return (
        <div data-active={active} className='address-tab-wrapper' onClick={onClick}>
            <div className='address-tab-content'>
                <Space size={8} direction='vertical'>
                    <Typography.Paragraph
                        size='large'
                        ellipsis={{ rows: 2 }}
                        type='secondary'
                    >
                        {organization.name}
                    </Typography.Paragraph>

                    <Typography.Text
                        ref={addressStreetRef}
                        ellipsis={addressStreetEllipsis}
                        title={streetMessage}
                        strong
                    >
                        {streetMessage}
                    </Typography.Text>

                    { floorName || sectionName || unitName ? (
                        <Row style={{ gap: 4 }}>
                            <Typography.Text
                                ref={addressStreetRef}
                                ellipsis={addressStreetEllipsis}
                                title={streetMessage}
                                strong
                            >
                                {unitNamePrefix} {unitName}
                            </Typography.Text>

                            {sectionName && floorName && (
                                <Typography.Text type='secondary'>
                                    ({SectionMessage} {sectionName}, {FloorMessage} {floorName})
                                </Typography.Text>
                            )}
                        </Row>
                    ) : null}

                    <Typography.Paragraph
                        size='medium'
                        ref={addressPostfixRef}
                        ellipsis={addressPostfixEllipsis}
                        title={postfix}
                        type='secondary'
                    >
                        {postfix}
                    </Typography.Paragraph>
                </Space>
            </div>
        </div>
    )
}
//#endregion

//#region Contact and Not resident client Tab content
const ClientContent: React.FC<ClientContactPropsType> = ({ lastTicket, contact, type, phone, showOrganizationMessage }) => {
    const intl = useIntl()
    const CallRecordsLogMessage = intl.formatMessage({ id: 'pages.clientCard.callRecordsLog' })
    const ContactMessage = intl.formatMessage({ id: 'Contact' })
    const NotResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.isResidentContact.false' })
    const EmployeeMessage = intl.formatMessage({ id: 'Employee' })

    const isEmployee = contact?.isEmployee

    const name = useMemo(
        () => contact?.name ?? lastTicket?.clientName,
        [contact?.name, lastTicket?.clientName]
    )

    const email = useMemo(
        () => contact?.email ?? lastTicket?.clientEmail,
        [contact?.email, lastTicket?.clientEmail]
    )

    const propertyId = useMemo(
        () => contact?.property?.id ?? lastTicket?.property?.id,
        [contact?.property?.id, lastTicket?.property?.id]
    )

    const organizationName = useMemo(
        () => contact?.organization?.name ?? lastTicket?.organization?.name,
        [contact?.organization?.name, lastTicket?.organization?.name]
    )

    const {
        count,
    } = CallRecordFragment.useCount({
        where: {
            callRecord: {
                OR: [{ callerPhone: phone, destCallerPhone: phone }],
            },
            OR: [
                { ticket_is_null: true },
                { ticket: { property: { id: propertyId } } },
            ],
        },
    })

    const handleCallRecordLinkClick = useCallback(() => {
        if (typeof window !== 'undefined') {
            const query = qs.stringify({
                filters: JSON.stringify({
                    phone,
                    property: [propertyId],
                }),
            }, { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true })

            window.open(`/callRecord${query}`, '_blank')
        }
    }, [phone, propertyId])

    const typeToMessage = useMemo(() => ({
        [ClientType.Resident]: ContactMessage,
        [ClientType.NotResident]: isEmployee ? EmployeeMessage : NotResidentMessage,
    }), [ContactMessage, EmployeeMessage, NotResidentMessage, isEmployee])

    return (
        <Row gutter={ROW_MEDIUM_SMALL_GUTTER}>
            <Col span={24}>
                <Space size={12} direction='vertical' >
                    <Space size={24} direction='horizontal' >
                        <Typography.Title level={2}>
                            {name}
                        </Typography.Title>
                        <Tag type='gray' style={TAG_STYLE}>
                            {typeToMessage[type]}
                        </Tag>
                        {
                            lastTicket && (
                                <TicketResidentFeatures ticket={lastTicket}/>
                            )
                        }
                        {
                            showOrganizationMessage && (
                                <Typography.Text strong type='secondary' size='medium'>
                                    {organizationName}
                                </Typography.Text>
                            )
                        }
                    </Space>
                </Space>
            </Col>
            {
                (email || count > 0) && (
                    <Col span={24}>
                        <Space size={60}>
                            {
                                email && (
                                    <Typography.Link size='large' href={`mailto:${email}`}>
                                        <Space size={8}>
                                            <Mail size='medium'/>
                                            {email}
                                        </Space>
                                    </Typography.Link>
                                )
                            }
                            {
                                count > 0 && (
                                    <Typography.Link
                                        size='large'
                                        onClick={handleCallRecordLinkClick}
                                        target='_blank'
                                    >
                                        <Space size={8} align='center'>
                                            <History size='medium'/>
                                            {CallRecordsLogMessage}
                                        </Space>
                                    </Typography.Link>
                                )
                            }
                        </Space>
                    </Col>
                )
            }
        </Row>
    )
}

const ClientCardTabContent = ({
    phone,
    property,
    searchTicketsQuery = null,
    handleTicketCreateClick,
    canManageContacts,
    showOrganizationMessage = false,
    handleContactEditClick = null,
    contact = null,
    organization,
    sectionName,
    type,
    sectionType,
    unitName,
    unitType,
}) => {
    const intl = useIntl()
    const ShowAllPropertyTicketsMessage = intl.formatMessage({ id: 'pages.clientCard.showAllPropertyTickets' })
    const CreateTicketMessage = intl.formatMessage({ id: 'CreateTicket' })
    const EditContactMessage = intl.formatMessage({ id: 'pages.clientCard.editContact' })
    const LastTicketsLoadedMessage = intl.formatMessage({ id: 'pages.clientCard.lastTicketsLoaded' }, { count: MAX_TABLE_SIZE })
    const OpenAllTicketsMessage = intl.formatMessage({ id: 'pages.clientCard.openAllTickets' })

    const tabsItems: TabsItems = useMemo(()=>tableTabs.map(el => ({
        label: intl.formatMessage({ id: `pages.clientCard.table.tabs.${el}` }),
        key: el,
    })), [intl])

    const [currentTableTab, setCurrentTableTab] = useState<TabKey>('contactPropertyTickets')

    const router = useRouter()

    const { offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const searchQuery = useMemo(() => {
        if (currentTableTab === RESIDENTS_ENTRANCE_TICKETS_TAB) {
            return {
                property: { id: property?.id },
                sectionName,
                sectionType,
            }
        }

        if (currentTableTab === RESIDENTS_PROPERTY_TICKETS_TAB) {
            return { property: { id: property?.id } }
        }

        return {
            ...searchTicketsQuery,
            property: { id: property?.id },
            unitName,
            unitType,
            contact: { id: contact?.id },
        }
    }, [searchTicketsQuery, currentTableTab, unitType, unitName, property?.id, sectionName, sectionType ])

    const { data: ticketsQuery, loading: isTicketsFetching } = useGetTicketsForClientCardQuery({
        variables: {
            where: searchQuery,
            first: MAX_TABLE_SIZE,
            sortBy: TICKET_SORT_BY,
            skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
        },
    })
    const tickets = ticketsQuery?.tickets

    const total = tickets?.length

    const lastCreatedTicket = tickets?.filter(el=>el?.clientPhone === phone)?.[0]
    const propertyId = useMemo(() => property?.id, [property])
    const organizationId = useMemo(() => organization?.id, [organization])

    const columns = useClientCardTicketTableColumns(tickets, currentTableTab, MAX_TABLE_SIZE)

    const handleShowAllPropertyTicketsMessage = useCallback(async () => {
        if (typeof window !== 'undefined') {
            window.open(`/ticket?filters={"property":"${property.id}"}`, '_blank')
        }
    }, [property])

    const handleRowAction = useCallback((record) => {
        return {
            onClick: async () => {
                if (typeof window !== 'undefined') {
                    window.open(`/ticket/${record.id}/`, '_blank')
                }
            },
        }
    }, [])

    const handleCreateTicket = useCallback(() => {
        const dataForTicketForm = property ? lastCreatedTicket : { clientPhone: phone }
        handleTicketCreateClick(dataForTicketForm)
    },
    [handleTicketCreateClick, lastCreatedTicket, phone, property])

    const redirectToTicketPage = useCallback(async () => await redirectToForm({
        router,
        formRoute: '/ticket',
        initialValues: searchQuery,
    }), [router, searchQuery])

    return (
        <Row gutter={ROW_BIG_GUTTER}>
            {
                property && (
                    <>
                        <Col span={24}>
                            <Row gutter={ROW_BIG_GUTTER}>
                                <Col span={24}>
                                    <Typography.Link size='large' onClick={handleShowAllPropertyTicketsMessage}>
                                        <Space size={12}>
                                            <BuildingIcon/>
                                            {ShowAllPropertyTicketsMessage}
                                        </Space>
                                    </Typography.Link>
                                </Col>
                                <Col span={24}>
                                    <ClientContent
                                        phone={phone}
                                        type={type}
                                        lastTicket={lastCreatedTicket}
                                        showOrganizationMessage={showOrganizationMessage}
                                        contact={contact}
                                    />
                                </Col>
                                <TicketPropertyHintCard
                                    propertyId={propertyId}
                                    hintContentStyle={HINT_CARD_STYLE}
                                    colProps={HINTS_COL_PROPS}
                                />
                                {
                                    propertyId && organizationId && (
                                        <IncidentHints
                                            organizationId={organizationId}
                                            propertyId={propertyId}
                                            colProps={HINTS_COL_PROPS}
                                        />
                                    )
                                }
                            </Row>
                        </Col>
                        <Col span={24}>
                            <Row>
                                <Tabs
                                    onChange={(tab: TabKey) => setCurrentTableTab(tab)}
                                    items={tabsItems}
                                />

                                <Row gutter={[0, 24]}>
                                    <Col span={24}>
                                        <Table
                                            totalRows={total}
                                            loading={isTicketsFetching}
                                            dataSource={tickets}
                                            columns={columns}
                                            onRow={handleRowAction}
                                            data-cy='ticket__table'
                                        />
                                    </Col>


                                    {tickets?.length >= MAX_TABLE_SIZE && (
                                        <Row gutter={[0, 8]}>
                                            <Col span={24}>
                                                <Typography.Paragraph size='large' >
                                                    {LastTicketsLoadedMessage}
                                                </Typography.Paragraph>
                                            </Col>
                                            <Col>
                                                <Typography.Link size='large' onClick={redirectToTicketPage}>
                                                    <Col className='link-wrapper'>
                                                        <ExternalLink size='auto'/>

                                                        {OpenAllTicketsMessage}
                                                    </Col>
                                                </Typography.Link>
                                            </Col>
                                        </Row>
                                    )}
                                </Row>
                            </Row>
                        </Col>
                    </>
                )
            }
            <Col span={24}>
                <ActionBar
                    actions={[
                        <Button
                            key='submit'
                            onClick={handleCreateTicket}
                            type='primary'
                            id='ClientCardCreateTicketClick'
                        >
                            {CreateTicketMessage}
                        </Button>,
                        canManageContacts && handleContactEditClick && (
                            <Button
                                key='edit'
                                onClick={handleContactEditClick}
                                type='secondary'
                                id='ClientCardEditContactClick'
                            >
                                {EditContactMessage}
                            </Button>
                        ),
                    ]}
                />
            </Col>
        </Row>
    )
}

const ContactClientTabContent = ({
    contact,
    property,
    unitName,
    unitType,
    phone,
    type,
    showOrganizationMessage = false,
    sectionName,
    sectionType,
    canManageContacts,
    organization,
}) => {
    const router = useRouter()

    const handleTicketCreateClick = useCallback(async () => {
        const initialValues = {
            property: property?.id,
            unitName,
            unitType,
            sectionName,
            sectionType,
            contact: contact?.id,
            clientName: contact?.name,
            clientPhone: contact?.phone,
            clientEmail: contact?.email,
            isResidentTicket: true,
        }

        await redirectToForm({
            router,
            formRoute: '/ticket/create',
            initialValues,
        })
    }, [contact, property, router, unitName, unitType])

    const handleContactEditClick = useCallback(async () => {
        await redirectToForm({
            router,
            formRoute: `/contact/${contact.id}/update`,
        })
    }, [contact, router])

    return (
        <ClientCardTabContent
            phone={phone}
            unitName={unitName}
            unitType={unitType}
            type={type}
            showOrganizationMessage={showOrganizationMessage}
            sectionType={sectionType}
            sectionName={sectionName}
            property={property}
            handleTicketCreateClick={handleTicketCreateClick}
            handleContactEditClick={handleContactEditClick}
            canManageContacts={canManageContacts}
            contact={contact}
            organization={organization}
        />
    )
}

const NotResidentClientTabContent = ({
    property,
    unitName,
    unitType,
    sectionName,
    sectionType,
    phone,
    type,
    showOrganizationMessage = false,
    organization,
}) => {
    const router = useRouter()

    const searchTicketsQuery = useMemo(() => ({
        clientPhone: phone,
        clientName_not: null,
        isResidentTicket: false,
    }), [phone])

    const handleTicketCreateClick = useCallback(async (ticket) => {
        const initialValues = {
            property: property.id,
            unitName,
            unitType,
            clientName: ticket.clientName,
            clientPhone: ticket.clientPhone,
            isResidentTicket: false,
        }

        await redirectToForm({
            router,
            formRoute: '/ticket/create',
            initialValues,
        })
    }, [property, router, unitName, unitType])

    return (
        <ClientCardTabContent
            unitName={unitName}
            unitType={unitType}
            phone={phone}
            property={property}
            type={type}
            showOrganizationMessage={showOrganizationMessage}
            sectionName={sectionName}
            sectionType={sectionType}
            searchTicketsQuery={searchTicketsQuery}
            handleTicketCreateClick={handleTicketCreateClick}
            canManageContacts={false}
            organization={organization}
        />
    )
}

const parseCardDataFromQuery = (stringCard) => {
    try {
        return JSON.parse(stringCard)
    } catch (e) {
        return {}
    }
}

const ClientTabContent = ({ tabData, phone, canManageContacts, showOrganizationMessage = false }) => {
    const property = tabData?.property
    const unitName = tabData?.unitName
    const unitType = tabData?.unitType
    const sectionType = tabData?.sectionType
    const sectionName = tabData?.sectionName
    const type = tabData?.type
    const organization = tabData?.organization
    const contact = tabData?.contact

    return type === ClientType.Resident ? (
        <ContactClientTabContent
            contact={contact}
            phone={phone}
            type={ClientType.Resident}
            property={property}
            unitName={unitName}
            unitType={unitType}
            sectionType={sectionType}
            sectionName={sectionName}
            canManageContacts={canManageContacts}
            showOrganizationMessage={showOrganizationMessage}
            organization={organization}
        />
    ) : (
        <NotResidentClientTabContent
            phone={phone}
            type={type}
            property={property}
            unitName={unitName}
            unitType={unitType}
            sectionType={sectionType}
            sectionName={sectionName}
            showOrganizationMessage={showOrganizationMessage}
            organization={organization}
        />
    )
}
//#endregion

//#region Page Content
const ClientCardPageContent = ({
    phoneNumber,
    tabsData,
    canManageContacts,
    loading,
    showOrganizationMessage = false,
    phoneNumberPrefix,
}) => {
    const intl = useIntl()
    const ClientCardTitle = intl.formatMessage({ id: 'pages.clientCard.Title' }, {
        phone: renderPhone(phoneNumber),
    })
    const phoneLink = phoneNumberPrefix ? `tel:${phoneNumberPrefix}${phoneNumber}` : `tel:${phoneNumber}`
    const ClientCardHeader = intl.formatMessage({ id: 'pages.clientCard.Title' }, {
        phone: (
            <Typography.Link href={phoneLink}>
                {renderPhone(phoneNumber)}
            </Typography.Link>
        ),
    })
    const AddAddressMessage = intl.formatMessage({ id: 'pages.clientCard.addAddress' })

    const router = useRouter()
    const { tab } = parseQuery(router.query)

    const carouselRef = useRef<CarouselRef>()
    const activeTabIndexRef = useRef<number>()

    const [activeTabData, setActiveTabData] = useState<TabDataType>()
    const [isInitialSlideScrolled, setIsInitialSlideScrolled] = useState<boolean>()

    const { breakpoints } = useLayoutContext()

    const slidesToShow = useMemo(() => {
        if (breakpoints.DESKTOP_SMALL) {
            return 4
        }
        if (breakpoints.TABLET_LARGE) {
            return 3
        }
        if (breakpoints.TABLET_SMALL) {
            return 2
        }
        return 1
    }, [breakpoints.TABLET_SMALL, breakpoints.DESKTOP_SMALL, breakpoints.TABLET_LARGE])

    useDeepCompareEffect(() => {
        if (carouselRef.current && !isInitialSlideScrolled) {
            let slideToGo = slidesToShow - (activeTabIndexRef.current + 1)
            if (slideToGo > 0) {
                slideToGo = 0
            }
            if (slideToGo < 0) {
                slideToGo = -slideToGo
            }

            carouselRef.current.goTo(slideToGo, true)
            setIsInitialSlideScrolled(true)
        }
    }, [tabsData, slidesToShow, carouselRef.current])

    useEffect(() => {
        const { type, property: propertyId, unitName, unitType, sectionType, sectionName } = parseCardDataFromQuery(tab)
        const tabDataWithProperty = tabsData.find(({ property, unitName: tabUnitName, unitType: tabUnitType }) =>
            property.id === propertyId && tabUnitName === unitName && tabUnitType === unitType)
        const property = tabDataWithProperty?.property
        const organization = tabDataWithProperty?.organization
        const contact = tabDataWithProperty?.contact
        const tabSectionType = sectionType ?? tabDataWithProperty?.sectionType
        const tabSectionName = sectionName ?? tabDataWithProperty?.sectionName

        if (property) {
            const key = getClientCardTabKey(property?.id, type, unitName, unitType, tabSectionName, tabSectionType)
            const newRoute = `${router.route.replace('[number]', phoneNumber)}?tab=${key}`
            router.push(newRoute, undefined, { shallow: true })

            setActiveTabData({ type, property, unitName, unitType, organization, contact, sectionType: tabSectionType, sectionName: tabSectionName })
        }
    }, [tab, tabsData, phoneNumber])

    const handleTabChange = useCallback(async (newKey) => {
        const newRoute = `${router.route.replace('[number]', phoneNumber)}?tab=${newKey}`

        return router.push(newRoute, undefined, { shallow: true })
    }, [phoneNumber, router])

    const renderedCards = useMemo(() => {
        const addressTabs = tabsData.map(({ type, property, unitName, floorName, unitType, organization, sectionType, sectionName }, index) => {
            const key = getClientCardTabKey(property?.id, type, unitName, unitType, sectionName, sectionType)
            const initialKey = getClientCardTabKey(property?.id, type, unitName, unitType)
            const isActive = tab && (tab === initialKey || tab === key)

            if (isActive) {
                activeTabIndexRef.current = canManageContacts ? index + 1 : index
            }

            return <ClientAddressCard
                onClick={() => handleTabChange(key)}
                organization={organization}
                key={key}
                floorName={floorName}
                property={property}
                unitName={unitName}
                unitType={unitType}
                sectionName={sectionName}
                active={isActive}
            />
        })

        return addressTabs.filter(Boolean)
    }, [canManageContacts, handleTabChange, tabsData])

    const redirectToCreateContact = useCallback(()=>redirectToForm({
        router,
        formRoute: '/contact/create',
        initialValues: {
            phone: phoneNumber,
        },
    }), [phoneNumber, router])

    return (
        <>
            <Head>
                <title>{ClientCardTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={ROW_MEDIUM_GUTTER}>
                        <Col span={24}>
                            <Row justify='space-between' align='bottom' >
                                <Typography.Title>{ClientCardHeader}</Typography.Title>

                                <Typography.Link size='large' onClick={redirectToCreateContact}>
                                    <Col className='link-wrapper'>
                                        <PlusCircle/>

                                        {AddAddressMessage}
                                    </Col>
                                </Typography.Link>
                            </Row>
                        </Col>
                        <Col span={24}>
                            <Row gutter={[0, 20]}>
                                {
                                    loading ? <Loader/> : (
                                        <Col span={24}>
                                            <Carousel
                                                infinite={false}
                                                ref={carouselRef}
                                                slidesToShow={slidesToShow}
                                                dots={false}
                                            >
                                                {renderedCards}
                                            </Carousel>
                                        </Col>
                                    )
                                }
                                <Col span={24}>
                                    <ClientTabContent
                                        tabData={activeTabData}
                                        phone={phoneNumber}
                                        showOrganizationMessage={showOrganizationMessage}
                                        canManageContacts={canManageContacts}
                                    />
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

export const ClientCardPageContentWrapper = ({
    organizationQuery,
    ticketsQuery,
    canManageContacts,
    showOrganizationMessage = false,
    usePhonePrefix = false,
}) => {
    const router = useRouter()
    const phoneNumber = router?.query.number

    const { data: contactsQueryData, loading: contactsLoading } = useGetContactForClientCardQuery({
        variables: {
            where: {
                ...organizationQuery,
                phone: phoneNumber,
            },
            first: MAX_TABLE_SIZE,
        },
    })

    const { data: ticketsQueryData, loading: ticketsLoading } = useGetTicketsForClientCardQuery({
        variables: {
            where: {
                ...ticketsQuery,
                clientPhone: phoneNumber,
                isResidentTicket: false,
                contact_is_null: true,
            },
            first: MAX_TABLE_SIZE,
        },
    })

    const { data: employeesQueryData, loading: employeesLoading } = useGetEmployeesForClientCardQuery({
        variables: {
            where: {
                ...organizationQuery,
                phone: phoneNumber,
            },
            first: MAX_TABLE_SIZE,
        },
    })

    const employeeTickets = useMemo(() =>
        ticketsQueryData?.tickets.filter(ticket => !!employeesQueryData?.employees?.find(employee => employee.phone === ticket.clientPhone)),
    [employeesQueryData, ticketsQueryData])
    const notResidentTickets = useMemo(() =>
        ticketsQueryData?.tickets.filter(ticket => !employeeTickets.find(employeeTicket => employeeTicket.id === ticket.id)),
    [employeeTickets, ticketsQueryData])

    const [tabsData, setTabsData] = useState([])

    useEffect(() => {
        const contactsData = contactsQueryData?.contacts?.map(contact => ({
            type: ClientType.Resident,
            property: contact.property,
            unitName: contact.unitName,
            unitType: contact.unitType,
            organization: contact.organization,
            contact: contact,
        })) || []
        const notResidentData = uniqBy(notResidentTickets?.map(ticket => ({
            type: ClientType.NotResident,
            property: ticket.property,
            unitName: ticket.unitName,
            unitType: ticket.unitType,
            sectionName: ticket.sectionName,
            sectionType: ticket.sectionType,
            floorName: ticket.floorName,
            organization: ticket.organization,
        })), 'property.id') || []
        const employeesData = uniqBy(employeeTickets?.map(ticket => ({
            type: ClientType.NotResident,
            isEmployee: true,
            property: ticket.property,
            unitName: ticket.unitName,
            unitType: ticket.unitType,
            organization: ticket.organization,
        })), 'property.id') || []

        const concatData =  [...contactsData, ...notResidentData, ...employeesData]
            .filter(tabsData => tabsData.organization && tabsData.property)

        getMapData(concatData).then(res => setTabsData(res))
    }, [contactsQueryData, notResidentTickets, employeeTickets])

    const phoneNumberPrefixFromContacts = contactsQueryData?.contacts?.[0]?.organization?.phoneNumberPrefix
    const phoneNumberPrefixFromEmployees = employeesQueryData?.employees?.[0]?.organization?.phoneNumberPrefix
    const phoneNumberPrefixFromTickets = ticketsQueryData?.tickets?.[0]?.organization?.phoneNumberPrefix

    let phoneNumberPrefix
    if (usePhonePrefix) {
        phoneNumberPrefix = phoneNumberPrefixFromContacts || phoneNumberPrefixFromEmployees || phoneNumberPrefixFromTickets
    }

    return (
        <ClientCardPageContent
            phoneNumber={phoneNumber}
            phoneNumberPrefix={phoneNumberPrefix}
            tabsData={tabsData}
            canManageContacts={canManageContacts}
            showOrganizationMessage={showOrganizationMessage}
            loading={ticketsLoading || contactsLoading || employeesLoading}
        />
    )
}

const ClientCardPage: PageComponentType = () => {
    const { organization, role } = useOrganization()
    const organizationId = organization?.id
    const canManageContacts = role.canManageContacts

    const { ticketFilterQuery } = useTicketVisibility()
    const organizationQuery = { organization: { id: organizationId } }
    const ticketsQuery = { ...organizationQuery, ...ticketFilterQuery, property: { deletedAt: null } }

    return (
        <ClientCardPageContentWrapper
            organizationQuery={organizationQuery}
            ticketsQuery={ticketsQuery}
            canManageContacts={canManageContacts}
        />
    )
}
//#endregion

ClientCardPage.requiredAccess = TicketReadPermissionRequired

export default ClientCardPage
