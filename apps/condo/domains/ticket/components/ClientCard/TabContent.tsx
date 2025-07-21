import {
    GetTicketsForClientCardQuery,
    useGetPropertyByIdQuery,
    useGetTicketsForClientCardQuery,
} from '@app/condo/gql'
import {
    Contact as ContactType,
    SortTicketsBy,
} from '@app/condo/schema'
import { Col, ColProps, Form, Row, RowProps } from 'antd'
import { useRouter } from 'next/router'
import qs from 'qs'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { ExternalLink, History, Mail } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Space, Tabs, Typography, Tag } from '@open-condo/ui'

import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { METER_TAB_TYPES } from '@condo/domains/meter/utils/clientSchema'
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'
import { UnitInfo, UnitInfoMode } from '@condo/domains/property/components/UnitInfo'
import { IncidentHints } from '@condo/domains/ticket/components/IncidentHints'
import { TicketResidentFeatures } from '@condo/domains/ticket/components/TicketId/TicketResidentFeatures'
import { TicketPropertyHintCard } from '@condo/domains/ticket/components/TicketPropertyHint/TicketPropertyHintCard'
import { useClientCardTicketTableColumns } from '@condo/domains/ticket/hooks/useClientCardTicketTableColumns'
import { CallRecordFragment } from '@condo/domains/ticket/utils/clientSchema'
import {
    ClientCardTab,
    CONTACT_PROPERTY_TICKETS_TAB,
    DEFAULT_TABLE_TABS,
    redirectToForm,
    RESIDENTS_ENTRANCE_TICKETS_TAB,
    RESIDENTS_PROPERTY_TICKETS_TAB,
    TabKey,
    TabsItems,
} from '@condo/domains/ticket/utils/clientSchema/clientCard'


const MAX_TABLE_SIZE = 20

const TAG_STYLE: CSSProperties = { borderRadius: '100px' }
const ROW_BIG_GUTTER: RowProps['gutter'] = [0, 60]
const ROW_MEDIUM_SMALL_GUTTER: RowProps['gutter'] = [0, 24]
const HINT_CARD_STYLE = { maxHeight: '3em' }
const TICKET_SORT_BY = [SortTicketsBy.OrderAsc, SortTicketsBy.CreatedAtDesc]
const HINTS_COL_PROPS: ColProps = { span: 24 }


type ClientInfoPropsType = {
    phone: string
    lastTicket?: GetTicketsForClientCardQuery['tickets'][number]
    name: string
    email?: string
    contact?: ContactType & { isEmployee?: boolean }
    type: ClientCardTab
    showOrganizationMessage: boolean
}

const ClientInfo: React.FC<ClientInfoPropsType> = ({ lastTicket, name, email, contact, type, phone, showOrganizationMessage }) => {
    const intl = useIntl()
    const CallRecordsLogMessage = intl.formatMessage({ id: 'pages.clientCard.callRecordsLog' })
    const ContactMessage = intl.formatMessage({ id: 'Contact' })
    const NotResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.isResidentContact.false' })
    const EmployeeMessage = intl.formatMessage({ id: 'Employee' })

    const isEmployee = useMemo(() => contact?.isEmployee, [contact?.isEmployee])
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
    }, { skip: !propertyId })

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
        [ClientCardTab.Resident]: ContactMessage,
        [ClientCardTab.NotResident]: isEmployee ? EmployeeMessage : NotResidentMessage,
    }), [ContactMessage, EmployeeMessage, NotResidentMessage, isEmployee])

    return (
        <Row gutter={ROW_MEDIUM_SMALL_GUTTER}>
            <Col span={24}>
                <Space size={12} direction='vertical' >
                    <Space size={24} direction='horizontal' >
                        <Typography.Title level={2}>
                            {name}
                        </Typography.Title>
                        <Tag style={TAG_STYLE}>
                            {typeToMessage[type]}
                        </Tag>
                        {
                            lastTicket && (
                                <TicketResidentFeatures ticket={lastTicket} />
                            )
                        }
                        {
                            showOrganizationMessage && organizationName && (
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
                                            <Mail size='medium' />
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
                                            <History size='medium' />
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
    tabData,
    searchTicketsQuery = null,
    handleTicketCreateClick,
    getQueryForCreatingMeterReading = null,
    canManageContacts,
    showOrganizationMessage = false,
    handleContactEditClick = null,
    hideMeterReadingButton = false,
    tableTabs = DEFAULT_TABLE_TABS,
}) => {
    const intl = useIntl()
    const CreateTicketMessage = intl.formatMessage({ id: 'CreateTicket' })
    const CreateMeterReadingMessage = intl.formatMessage({ id: 'CreateMeterReading' })
    const EditContactMessage = intl.formatMessage({ id: 'pages.clientCard.editContact' })
    const LastTicketsLoadedMessage = intl.formatMessage({ id: 'pages.clientCard.lastTicketsLoaded' }, { count: MAX_TABLE_SIZE })
    const OpenAllTicketsMessage = intl.formatMessage({ id: 'pages.clientCard.openAllTickets' })

    const {
        property,
        unitName,
        unitType,
        sectionType,
        sectionName,
        type,
        organization,
        contact,
        name,
        email,
    } = tabData

    const tabsItems: TabsItems = useMemo(() => tableTabs.map(tab => ({
        label: intl.formatMessage({ id: `pages.clientCard.table.tabs.${tab}` }),
        key: tab,
    })), [intl, tableTabs])

    const [currentTableTab, setCurrentTableTab] = useState<TabKey>(tableTabs?.[0])

    const router = useRouter()
    const phone = router?.query.number as string
    const { offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const { persistor } = useCachePersistor()

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
    }, [currentTableTab, searchTicketsQuery, property?.id, unitName, unitType, contact?.id, sectionName, sectionType])

    const { data: ticketsData, loading: isTicketsFetching } = useGetTicketsForClientCardQuery({
        variables: {
            where: searchQuery,
            first: MAX_TABLE_SIZE,
            sortBy: TICKET_SORT_BY,
            skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
        },
        skip: !persistor,
    })
    const tickets = ticketsData?.tickets

    const total = tickets?.length

    const lastCreatedTicket = tickets?.filter(el => el?.clientPhone === phone)?.[0]
    const propertyId = useMemo(() => property?.id, [property])
    const organizationId = useMemo(() => organization?.id, [organization])

    const columns = useClientCardTicketTableColumns(tickets, currentTableTab, MAX_TABLE_SIZE)

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
        // Это работает неправильно! У нас есть табы, где показываются заявки по подъезду и дому.
        // А в initialData формы должны подставляться данные по клиенту, а не по последней заявке.
        // Аналогично в handleCreateMeterReading
        const dataForTicketForm = property ? lastCreatedTicket : { clientPhone: phone }
        handleTicketCreateClick(dataForTicketForm)
    }, [handleTicketCreateClick, lastCreatedTicket, phone, property])

    const handleCreateMeterReading = useCallback(async () => {
        if (!getQueryForCreatingMeterReading) return

        const dataForMeterReadingForm = property ? lastCreatedTicket : { clientPhone: phone }
        const query = qs.stringify(
            getQueryForCreatingMeterReading(dataForMeterReadingForm),
            { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
        )

        const newUrl = `/meter/create${query}`

        if (typeof window !== 'undefined') {
            window.open(newUrl, '_blank')
        } else {
            await router.push(newUrl)
        }

    }, [lastCreatedTicket, phone, property, router, getQueryForCreatingMeterReading])

    const redirectToTicketPage = useCallback(async () => {
        let filters = {}
        if (currentTableTab === RESIDENTS_ENTRANCE_TICKETS_TAB) {
            filters = {
                property: property?.id,
                sectionName,
                sectionType,
            }
        }

        if (currentTableTab === RESIDENTS_PROPERTY_TICKETS_TAB) {
            filters = { property: property?.id }
        }

        if (currentTableTab === CONTACT_PROPERTY_TICKETS_TAB) {
            filters = {
                clientPhone: phone,
                property: property?.id,
                unitName,
                unitType,
            }
        }

        if (typeof window !== 'undefined') {
            window.open(`/ticket?filters=${encodeURIComponent(JSON.stringify(filters))}`, '_blank')
        }
    }, [phone, unitName, unitType, property, sectionName, sectionType, currentTableTab])

    return (
        <Row gutter={ROW_BIG_GUTTER}>
            {
                property && (
                    <>
                        <Col span={24}>
                            <Row gutter={ROW_MEDIUM_SMALL_GUTTER}>
                                {
                                    type !== ClientCardTab.SearchByAddress && (
                                        <Col span={24}>
                                            <ClientInfo
                                                phone={phone}
                                                name={name}
                                                email={email}
                                                type={type}
                                                lastTicket={lastCreatedTicket}
                                                showOrganizationMessage={showOrganizationMessage}
                                                contact={contact}
                                            />
                                        </Col>
                                    )
                                }
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
                                <Col span={24}>
                                    <Tabs
                                        onChange={(tab: TabKey) => setCurrentTableTab(tab)}
                                        items={tabsItems}
                                    />
                                </Col>

                                <Row gutter={ROW_MEDIUM_SMALL_GUTTER}>
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
                                                <Button 
                                                    onClick={redirectToTicketPage}
                                                    type='primary'
                                                    id='ClientCardOpenAllTicketsButton'
                                                    minimal
                                                    compact
                                                    icon={<ExternalLink />}
                                                >
                                                    {OpenAllTicketsMessage}
                                                </Button>
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
                        !hideMeterReadingButton && (
                            <Button
                                key='submit'
                                onClick={handleCreateMeterReading}
                                type='secondary'
                                id='ClientCardCreateMeterReadingClick'
                            >
                                {CreateMeterReadingMessage}
                            </Button>
                        ),
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

export const ResidentClientTabContent = ({
    showOrganizationMessage = false,
    canManageContacts,
    tabData,
}) => {
    const router = useRouter()
    const {
        property,
        unitName,
        unitType,
        sectionType,
        sectionName,
        contact,
    } = tabData

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
    }, [contact?.email, contact?.id, contact?.name, contact?.phone, property?.id, router, sectionName, sectionType, unitName, unitType])

    const getQueryForCreatingMeterReadingWithContact = useCallback(() => ({
        tab: METER_TAB_TYPES.meterReading,
        propertyId: property?.id,
        unitName,
        unitType,
        sectionName,
        sectionType,
        contact: contact?.id,
        clientName: contact?.name,
        clientPhone: contact?.phone,
    }), [property, unitName, unitType, sectionName, sectionType, contact])

    const handleContactEditClick = useCallback(async () => {
        await redirectToForm({
            router,
            formRoute: `/contact/${contact.id}/update`,
        })
    }, [contact, router])

    return (
        <ClientCardTabContent
            tabData={tabData}
            showOrganizationMessage={showOrganizationMessage}
            handleTicketCreateClick={handleTicketCreateClick}
            getQueryForCreatingMeterReading={getQueryForCreatingMeterReadingWithContact}
            handleContactEditClick={handleContactEditClick}
            canManageContacts={canManageContacts}
        />
    )
}

export const NotResidentClientTabContent = ({
    showOrganizationMessage = false,
    tabData,
}) => {
    const router = useRouter()
    const phone = router?.query.number as string

    const {
        property,
        unitName,
        unitType,
    } = tabData

    const searchTicketsQuery = useMemo(() => ({
        clientPhone: phone,
        clientName_not: null,
        isResidentTicket: false,
    }), [phone])

    const handleTicketCreateClick = useCallback(async (ticket) => {
        const initialValues = {
            property: property?.id,
            unitName,
            unitType,
            clientName: ticket?.clientName,
            clientPhone: ticket?.clientPhone,
            isResidentTicket: false,
        }

        await redirectToForm({
            router,
            formRoute: '/ticket/create',
            initialValues,
        })
    }, [property, router, unitName, unitType])

    const getQueryForCreatingMeterReadingWithoutContact = useCallback((ticket) => ({
        tab: METER_TAB_TYPES.meterReading,
        propertyId: property?.id,
        unitName,
        unitType,
        clientName: ticket?.clientName,
        clientPhone: ticket?.clientPhone,
    }), [property, unitName, unitType])

    return (
        <ClientCardTabContent
            tabData={tabData}
            showOrganizationMessage={showOrganizationMessage}
            searchTicketsQuery={searchTicketsQuery}
            handleTicketCreateClick={handleTicketCreateClick}
            getQueryForCreatingMeterReading={getQueryForCreatingMeterReadingWithoutContact}
            canManageContacts={false}
        />
    )
}

export const SearchByAddressTabContent = ({ firstClientData, canManageContacts, showOrganizationMessage }) => {
    const intl = useIntl()
    const EmptyClientContentDescription = intl.formatMessage({ id: 'pages.clientCard.emptyClientContent.description' })
    const PropertySelectPlaceholder = intl.formatMessage({ id: 'pages.clientCard.emptyClientContent.propertySelect.placeholder' })

    const router = useRouter()
    const phoneNumber = router?.query?.number as string

    const { organization } = useOrganization()
    const organizationId = useMemo(() => organization?.id, [organization])

    const [propertyId, setPropertyId] = useState<string>()
    const [unitName, setUnitName] = useState<string>()
    const [sectionType, setSectionType] = useState<string>()

    const [form] = Form.useForm()
    const sectionName = Form.useWatch('sectionName', form)
    const unitType = Form.useWatch('unitType', form)

    const { loading: propertyLoading, data: propertyData } = useGetPropertyByIdQuery({
        variables: {
            id: propertyId,
        },
        skip: !propertyId,
    })
    const property = useMemo(() => propertyData?.properties?.[0], [propertyData])

    const handleTicketCreateClick = useCallback(async () => {
        const initialValues = {
            property: propertyId,
            unitName,
            unitType,
            sectionName,
            sectionType,
            clientPhone: phoneNumber,
        }

        await redirectToForm({
            router,
            formRoute: '/ticket/create',
            initialValues,
        })
    }, [propertyId, unitName, unitType, sectionName, sectionType, phoneNumber, router])

    const tabData = useMemo(() => ({
        unitName,
        unitType,
        sectionType,
        sectionName,
        property,
        type: ClientCardTab.SearchByAddress,
        organization,
    }), [unitName, unitType, sectionType, sectionName, property, organization])

    const getQueryForCreatingMeterReading = useCallback(() => ({
        tab: METER_TAB_TYPES.meterReading,
        propertyId: property?.id,
        unitName,
        unitType,
        sectionName,
        sectionType,
        contact: firstClientData?.contact?.id,
        clientName: firstClientData?.name,
        clientPhone: phoneNumber,
    }), [
        property?.id, unitName, unitType, sectionName, 
        sectionType, firstClientData?.contact?.id, firstClientData?.name, phoneNumber,
    ])

    return (
        <Row gutter={[0, 40]}>
            <Col span={24}>
                <ClientInfo
                    name={firstClientData?.name}
                    email={firstClientData?.email}
                    phone={phoneNumber}
                    type={firstClientData?.type}
                    showOrganizationMessage={showOrganizationMessage}
                    contact={firstClientData}
                />
            </Col>
            <Col span={24}>
                <Row gutter={ROW_MEDIUM_SMALL_GUTTER}>
                    {
                        !firstClientData && (
                            <Col span={24}>
                                <Typography.Text type='secondary'>
                                    {EmptyClientContentDescription}
                                </Typography.Text>
                            </Col>
                        )
                    }
                    <Col span={18}>
                        <Form
                            form={form}
                            layout='vertical'
                            colon
                        >
                            <PropertyAddressSearchInput
                                style={{ width: '100%' }}
                                organizationId={organizationId}
                                onChange={(_, option) => {
                                    if (Array.isArray(option)) return
                                    setPropertyId(option?.key)
                                }}
                                placeholder={PropertySelectPlaceholder}
                                showSearch
                            />
                            {
                                propertyId && (
                                    <Row>
                                        <Col span={20}>
                                            <UnitInfo
                                                property={property}
                                                loading={propertyLoading}
                                                selectedUnitName={unitName}
                                                setSelectedUnitName={setUnitName}
                                                selectedSectionType={sectionType}
                                                setSelectedSectionType={setSectionType}
                                                form={form}
                                                mode={UnitInfoMode.All}
                                            />
                                        </Col>
                                    </Row>
                                )
                            }
                        </Form>
                    </Col>
                </Row >
            </Col>
            <Col span={24}>
                <ClientCardTabContent
                    tabData={tabData}
                    handleTicketCreateClick={handleTicketCreateClick}
                    getQueryForCreatingMeterReading={getQueryForCreatingMeterReading}
                    showOrganizationMessage={showOrganizationMessage}
                    canManageContacts={canManageContacts}
                    hideMeterReadingButton={!firstClientData}
                    tableTabs={[RESIDENTS_ENTRANCE_TICKETS_TAB, RESIDENTS_PROPERTY_TICKETS_TAB]}
                />
            </Col>
        </Row>
    )
}