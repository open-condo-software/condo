import {
    GetTicketsForClientCardQuery,
    useGetClientCallRecordsExistenceQuery,
    useGetPropertyByIdQuery,
    useGetTicketsForClientCardQuery,
} from '@app/condo/gql'
import {
    BuildingSectionType,
    BuildingUnitSubType,
    SortTicketsBy,
    TicketWhereInput,
} from '@app/condo/schema'
import { Col, ColProps, Form, Row, RowProps } from 'antd'
import isNil from 'lodash/isNil'
import { useRouter } from 'next/router'
import qs from 'qs'
import React, { useCallback, useMemo, useState } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { ExternalLink, History, Mail } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button, Space, Tabs, Typography, Tag } from '@open-condo/ui'

import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { METER_TAB_TYPES } from '@condo/domains/meter/utils/clientSchema'
import { UnitInfo, UnitInfoMode } from '@condo/domains/property/components/UnitInfo'
import { IncidentHints } from '@condo/domains/ticket/components/IncidentHints'
import { TicketResidentFeatures } from '@condo/domains/ticket/components/TicketId/TicketResidentFeatures'
import { TicketPropertyHintCard } from '@condo/domains/ticket/components/TicketPropertyHint/TicketPropertyHintCard'
import { useClientCardTicketTableColumns } from '@condo/domains/ticket/hooks/useClientCardTicketTableColumns'
import {
    ClientCardAddressSearchInputType,
    ClientCardTab,
    CONTACT_PROPERTY_TICKETS_TAB,
    DEFAULT_TABLE_TABS,
    redirectToForm,
    RESIDENTS_ENTRANCE_TICKETS_TAB,
    RESIDENTS_PROPERTY_TICKETS_TAB,
    TabDataType,
    TabKey,
    TabsItems,
} from '@condo/domains/ticket/utils/clientSchema/clientCard'

import styles from './TabContent.module.css'


const MAX_TABLE_SIZE = 20

const ROW_BIG_GUTTER: RowProps['gutter'] = [0, 60]
const ROW_BIG_MEDIUM_GUTTER: RowProps['gutter'] = [0, 40]
const ROW_MEDIUM_SMALL_GUTTER: RowProps['gutter'] = [0, 24]
const TICKET_SORT_BY = [SortTicketsBy.OrderAsc, SortTicketsBy.CreatedAtDesc]
const HINTS_COL_PROPS: ColProps = { span: 24 }

interface IClientInfoProps {
    phone: string
    lastTicket?: GetTicketsForClientCardQuery['tickets'][number]
    name: string
    email?: string
    type: ClientCardTab
    propertyId?: string
    organizationName?: string
    isEmployee?: boolean
}

const ClientInfo: React.FC<IClientInfoProps> = ({ 
    lastTicket,
    name,
    email,
    propertyId,
    organizationName,
    isEmployee,
    type,
    phone,
}) => {
    const intl = useIntl()
    const CallRecordsLogMessage = intl.formatMessage({ id: 'pages.clientCard.callRecordsLog' })
    const ContactMessage = intl.formatMessage({ id: 'Contact' })
    const NotResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.isResidentContact.false' })
    const EmployeeMessage = intl.formatMessage({ id: 'Employee' })

    const { data: callRecordFragmentExistenceData } = useGetClientCallRecordsExistenceQuery({
        variables: {
            phone,
            propertyId,
        },
        skip: !propertyId,
    })
    const isCallRecordsExists = useMemo(() => 
        callRecordFragmentExistenceData?.callRecordFragments?.length > 0,
    [callRecordFragmentExistenceData])

    const callRecordsLink = useMemo(() => {
        const query = qs.stringify({
            filters: JSON.stringify({
                phone,
                property: [propertyId],
            }),
        }, { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true })
        
        return `/callRecord${query}`
    }, [phone, propertyId])

    const typeToMessage = useMemo(() => ({
        [ClientCardTab.Resident]: ContactMessage,
        [ClientCardTab.NotResident]: isEmployee ? EmployeeMessage : NotResidentMessage,
    }), [ContactMessage, EmployeeMessage, NotResidentMessage, isEmployee])

    return (
        <Row gutter={ROW_MEDIUM_SMALL_GUTTER}>
            <Col span={24}>
                <Space size={24} direction='horizontal' >
                    <Typography.Title level={2}>
                        {name}
                    </Typography.Title>
                    <Tag className={styles.clientTypeTag}>
                        {typeToMessage[type]}
                    </Tag>
                    {
                        lastTicket && (
                            <TicketResidentFeatures ticket={lastTicket} />
                        )
                    }
                    {
                        organizationName && (
                            <Typography.Text strong type='secondary' size='medium'>
                                {organizationName}
                            </Typography.Text>
                        )
                    }
                </Space>
            </Col>
            {
                (email || isCallRecordsExists) && (
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
                                isCallRecordsExists && (
                                    <Typography.Link
                                        size='large'
                                        href={callRecordsLink}
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

interface IClientCardTabContent {
    tabData?: TabDataType
    searchTicketsQuery?: TicketWhereInput
    handleTicketCreate?: () => void
    getQueryForCreatingMeterReading?: () => Record<string, unknown>
    canManageContacts?: boolean
    showOrganizationMessage?: boolean
    handleContactEditClick?: () => void
    hideMeterReadingButton?: boolean
    tableTabs?: TabKey[]
}

const ClientCardTabContent: React.FC<IClientCardTabContent> = ({
    tabData,
    searchTicketsQuery = null,
    handleTicketCreate,
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
        isEmployee,
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
            if (isNil(sectionName)) {
                return { property: { id: property?.id } }
            }
            
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
            where: searchQuery as TicketWhereInput,
            first: MAX_TABLE_SIZE,
            sortBy: TICKET_SORT_BY,
            skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
        },
        skip: !persistor,
    })
    const tickets = useMemo(() => ticketsData?.tickets, [ticketsData?.tickets])
    const total = useMemo(() => tickets?.length, [tickets?.length])

    const lastCreatedTicket = tickets?.filter(el => el?.clientPhone === phone)?.[0]
    const propertyId = useMemo(() => property?.id, [property])
    const organizationId = useMemo(() => organization?.id, [organization])

    const columns = useClientCardTicketTableColumns(tickets, currentTableTab, MAX_TABLE_SIZE)

    const handleRowAction = useCallback((record) => {
        return {
            onClick: async () => {
                if (typeof window !== 'undefined') {
                    window.open(`/ticket/${record.id}`, '_blank')
                }
            },
        }
    }, [])

    const handleCreateMeterReading = useCallback(async () => {
        if (!getQueryForCreatingMeterReading) return

        const query = qs.stringify(
            { 
                ...getQueryForCreatingMeterReading(), 
                redirectToClientCard: true,
            },
            { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
        )
        
        await router.push(`/meter/create${query}`)
    }, [router, getQueryForCreatingMeterReading])

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
                                                propertyId={propertyId}
                                                organizationName={showOrganizationMessage && organization?.name}
                                                isEmployee={isEmployee}
                                            />
                                        </Col>
                                    )
                                }
                                <TicketPropertyHintCard
                                    propertyId={propertyId}
                                    className={styles.ticketPropertyHintCard}
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
                            onClick={handleTicketCreate}
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

interface IResidentClientTabContentProps {
    showOrganizationMessage?: boolean
    canManageContacts?: boolean
    tabData: TabDataType
}

export const ResidentClientTabContent: React.FC<IResidentClientTabContentProps> = ({
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

    const handleTicketCreate = useCallback(async () => {
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
            handleTicketCreate={handleTicketCreate}
            getQueryForCreatingMeterReading={getQueryForCreatingMeterReadingWithContact}
            handleContactEditClick={handleContactEditClick}
            canManageContacts={canManageContacts}
        />
    )
}

interface NotResidentClientTabContent {
    showOrganizationMessage?: boolean
    tabData: TabDataType
}

export const NotResidentClientTabContent: React.FC<NotResidentClientTabContent> = ({
    showOrganizationMessage = false,
    tabData,
}) => {
    const router = useRouter()
    const phone = router?.query.number as string

    const {
        property,
        unitName,
        unitType,
        name,
    } = tabData

    const searchTicketsQuery = useMemo(() => ({
        clientPhone: phone,
        clientName_not: null,
        isResidentTicket: false,
    }), [phone])

    const handleTicketCreate = useCallback(async () => {
        const initialValues = {
            property: property?.id,
            unitName,
            unitType,
            clientName: name,
            clientPhone: phone,
            isResidentTicket: false,
        }

        await redirectToForm({
            router,
            formRoute: '/ticket/create',
            initialValues,
        })
    }, [name, phone, property?.id, router, unitName, unitType])

    const getQueryForCreatingMeterReadingWithoutContact = useCallback(() => ({
        tab: METER_TAB_TYPES.meterReading,
        propertyId: property?.id,
        unitName,
        unitType,
        clientName: name,
        clientPhone: phone,
    }), [name, phone, property?.id, unitName, unitType])

    return (
        <ClientCardTabContent
            tabData={tabData}
            showOrganizationMessage={showOrganizationMessage}
            searchTicketsQuery={searchTicketsQuery}
            handleTicketCreate={handleTicketCreate}
            getQueryForCreatingMeterReading={getQueryForCreatingMeterReadingWithoutContact}
            canManageContacts={false}
        />
    )
}

interface SearchByAddressTabContentProps {
    firstClientData: TabDataType
    canManageContacts?: boolean
    showOrganizationMessage?: boolean
    AddressSearchInput: ClientCardAddressSearchInputType
}

export const SearchByAddressTabContent: React.FC<SearchByAddressTabContentProps> = ({ firstClientData, canManageContacts, showOrganizationMessage, AddressSearchInput }) => {
    const intl = useIntl()
    const EmptyClientContentDescription = intl.formatMessage({ id: 'pages.clientCard.emptyClientContent.description' })
    const PropertySelectPlaceholder = intl.formatMessage({ id: 'pages.clientCard.emptyClientContent.propertySelect.placeholder' })

    const router = useRouter()
    const phoneNumber = router?.query?.number as string

    const [propertyId, setPropertyId] = useState<string>()
    const [unitName, setUnitName] = useState<string>()
    const [sectionType, setSectionType] = useState<BuildingSectionType>()

    const [form] = Form.useForm()
    const sectionName = Form.useWatch('sectionName', form) as BuildingSectionType
    const unitType = Form.useWatch('unitType', form) as BuildingUnitSubType

    const { loading: propertyLoading, data: propertyData } = useGetPropertyByIdQuery({
        variables: {
            id: propertyId,
        },
        skip: !propertyId,
    })
    const property = useMemo(() => propertyData?.properties?.[0], [propertyData])
    const organizationName = useMemo(() => property?.organization?.name, [property?.organization?.name])

    const handleTicketCreate = useCallback(async () => {
        let isResidentTicket = true
        if (firstClientData && firstClientData?.type !== ClientCardTab.Resident) {
            isResidentTicket = false
        }

        const initialValues = {
            property: propertyId,
            unitName,
            unitType,
            sectionName,
            sectionType,
            clientPhone: phoneNumber,
            clientName: firstClientData?.name,
            isResidentTicket,
        }

        await redirectToForm({
            router,
            formRoute: '/ticket/create',
            initialValues,
        })
    }, [propertyId, unitName, unitType, sectionName, sectionType, phoneNumber, firstClientData?.name, firstClientData?.type, router])

    const tabData = useMemo(() => ({
        unitName,
        unitType,
        sectionType,
        sectionName,
        property,
        type: ClientCardTab.SearchByAddress,
        organization: property?.organization,
    }), [unitName, unitType, sectionType, sectionName, property])

    const getQueryForCreatingMeterReading = useCallback(() => ({
        tab: METER_TAB_TYPES.meterReading,
        propertyId: property?.id,
        unitName,
        unitType,
        sectionName,
        sectionType,
        clientName: firstClientData?.name,
        clientPhone: phoneNumber,
    }), [property?.id, unitName, unitType, sectionName, sectionType, firstClientData?.name, phoneNumber])

    const handleAddressSearchInputChange = useCallback((_, option) => {
        if (Array.isArray(option)) return
        setPropertyId(option?.key)
    }, [setPropertyId])

    const handleContactEditClick = useCallback(async () => {
        await redirectToForm({
            router,
            formRoute: `/contact/${firstClientData?.contact?.id}/update`,
        })
    }, [firstClientData?.contact?.id, router])

    return (
        <Row gutter={ROW_BIG_MEDIUM_GUTTER}>
            {
                firstClientData && (
                    <Col span={24}>
                        <ClientInfo
                            name={firstClientData?.name}
                            email={firstClientData?.email}
                            phone={phoneNumber}
                            type={firstClientData?.type}
                            propertyId={property?.id}
                            isEmployee={firstClientData?.isEmployee}
                        />
                    </Col>
                )
            } 
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
                    <Col md={18} xs={24}>
                        <Form
                            form={form}
                            layout='vertical'
                            colon
                        >
                            <AddressSearchInput
                                className={styles.addressSearchInput}
                                onChange={handleAddressSearchInputChange}
                                placeholder={PropertySelectPlaceholder}
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
                <Row gutter={ROW_MEDIUM_SMALL_GUTTER}>
                    {
                        showOrganizationMessage && (
                            <Col span={24}>
                                <Typography.Text>{organizationName}</Typography.Text>
                            </Col>
                        )
                    }
                    <Col span={24}>
                        <ClientCardTabContent
                            tabData={tabData}
                            handleTicketCreate={handleTicketCreate}
                            getQueryForCreatingMeterReading={getQueryForCreatingMeterReading}
                            showOrganizationMessage={showOrganizationMessage}
                            canManageContacts={canManageContacts}
                            handleContactEditClick={firstClientData?.contact?.id ? handleContactEditClick : undefined}
                            hideMeterReadingButton={!firstClientData}
                            tableTabs={[RESIDENTS_ENTRANCE_TICKETS_TAB, RESIDENTS_PROPERTY_TICKETS_TAB]}
                        />
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}