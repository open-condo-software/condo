import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table'
import { updateRoute } from '@condo/domains/common/utils/filters.utils'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { Contact } from '@condo/domains/contact/utils/clientSchema'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { getPropertyAddressParts } from '@condo/domains/property/utils/helpers'
import { TicketResidentFeatures } from '@condo/domains/ticket/components/TicketId/TicketResidentFeatures'
import { TicketPropertyHintCard } from '@condo/domains/ticket/components/TicketPropertyHint/TicketPropertyHintCard'
import { useClientCardTicketTableColumns } from '@condo/domains/ticket/hooks/useClientCardTicketTableColumns'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import styled from '@emotion/styled'
import { Col, Row, Tabs, Typography } from 'antd'
import { get } from 'lodash'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useIntl } from '@condo/next/intl'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { useOrganization } from '@condo/next/organization'
import { Tag } from '@condo/domains/common/components/Tag'
import { colors, fontSizes, gradients, shadows } from '@condo/domains/common/constants/style'
import qs from 'qs'
import React, { useCallback, useMemo, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { BuildingUnitSubType, SortTicketsBy } from '@app/condo/schema'
import { ClientType } from '@condo/domains/common/hooks/useSearchByPhoneModal'

const StyledTabs = styled(Tabs)`
  &.ant-tabs-top > .ant-tabs-nav::before {
    border-bottom: none;
  }
  
  & .ant-tabs-nav .ant-tabs-nav-wrap {
    white-space: initial;
  }

  & .ant-tabs-nav-list .ant-tabs-ink-bar {
    display: none;
  }
`

const StyledClientTab = styled.div<{ active: boolean }>`
  width: 258px;
  height: 150px;
  box-shadow: ${shadows.small};
  border-radius: 12px;
  background: ${props => props.active ? gradients.sberActionGradient : 'inherit'};
  padding: 1px;
  
  & > div {
    border-radius: 11px;
    height: 100%;
    padding: 20px;
    background-color: #FFFFFF;
  }
`

const ClientTabTitle = ({ active, type, property, unitName }) => {
    const intl = useIntl()
    const ContactMessage = intl.formatMessage({ id: 'Contact' })
    const NotResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.isResidentContact.false' })
    const EmployeeMessage = intl.formatMessage({ id: 'Employee' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const FlatMessage = intl.formatMessage({ id: 'field.ShortFlatNumber' })

    const typeToMessage = useMemo(() => ({
        [ClientType.Contact]: ContactMessage,
        [ClientType.NotResident]: NotResidentMessage,
        [ClientType.Employee]: EmployeeMessage,
    }), [ContactMessage, EmployeeMessage, NotResidentMessage])

    const { text, postfix } = getPropertyAddressParts(property, DeletedMessage)
    const streetAndFlatMessage = unitName ? `${text} ${FlatMessage} ${unitName}` : text.substring(0, text.length - 1)

    return (
        <StyledClientTab active={active}>
            <Row gutter={[0, 12]}>
                <Col span={24}>
                    <Tag type='gray' style={{ borderRadius: '100px' }}>
                        {typeToMessage[type]}
                    </Tag>
                </Col>
                <Col span={24}>
                    <Typography.Paragraph ellipsis title={streetAndFlatMessage} strong style={{ margin: 0 }}>{streetAndFlatMessage}</Typography.Paragraph>
                    <Typography.Paragraph ellipsis={{ rows: 2 }} title={postfix} type='secondary' style={{ margin: 0, fontSize: fontSizes.label }}>{postfix}</Typography.Paragraph>
                </Col>
            </Row>
        </StyledClientTab>
    )
}

const StyledLink = styled.span`
  color: ${colors.black};
  &:hover {
    color: ${colors.black};
    cursor: pointer;
  }

  display: block;
  width: max-content;

  font-size: ${fontSizes.label};
  text-decoration: none;
  border-bottom: 1px solid ${colors.lightGrey[6]};
`

const HINT_CARD_STYLE = { maxHeight: '3em ' }

const TICKET_SORT_BY = [SortTicketsBy.CreatedAtDesc]

const ClientContent = ({ lastTicket }) => {
    const ticketContact = get(lastTicket, 'contact')
    const name = get(ticketContact, 'name', get(lastTicket, 'clientName'))
    const email = get(ticketContact, 'email', get(lastTicket, 'clientEmail'))

    return (
        <Row>
            <Col span={24}>
                <Row justify='space-between'>
                    <Typography.Title level={3}>{name}</Typography.Title>
                    {
                        ticketContact && (
                            <TicketResidentFeatures ticket={lastTicket} />
                        )
                    }
                </Row>
            </Col>
            {
                email && (
                    <Col span={24}>
                        <Typography.Text style={{ fontSize: fontSizes.content }}>
                            {email}
                        </Typography.Text>
                    </Col>
                )
            }
        </Row>
    )
}

const ClientCardTabContent = ({ property, searchTicketsQuery, handleTicketCreateClick, handleContactEditClick = null }) => {
    const intl = useIntl()
    const ShowAllPropertyTicketsMessage = intl.formatMessage({ id: 'pages.clientCard.showAllPropertyTickets' })
    const ContactTicketsMessage = intl.formatMessage({ id: 'pages.clientCard.contactTickets' })

    const router = useRouter()

    const { offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const {
        loading: isTicketsFetching,
        count: total,
        objs: tickets,
    } = Ticket.useObjects({
        sortBy: TICKET_SORT_BY,
        where: searchTicketsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    })
    const lastCreatedTicket = get(tickets, 0)

    const columns = useClientCardTicketTableColumns()

    const handleShowAllPropertyTicketsMessage = useCallback(async () => {
        await updateRoute(router, '/ticket', { property: [property.id] })
    }, [property.id, router])

    const handleRowAction = useCallback((record) => {
        return {
            onClick: async () => {
                await router.push(`/ticket/${record.id}/`)
            },
        }
    }, [router])

    return (
        <Row gutter={[0, 60]}>
            <Col span={24}>
                <Row gutter={[0, 40]}>
                    <Col span={24}>
                        <StyledLink onClick={handleShowAllPropertyTicketsMessage}>
                            {ShowAllPropertyTicketsMessage}
                        </StyledLink>
                    </Col>
                    <Col span={24}>
                        <ClientContent lastTicket={lastCreatedTicket} />
                    </Col>
                    <Col span={24}>
                        <TicketPropertyHintCard
                            propertyId={property.id}
                            hintContentStyle={HINT_CARD_STYLE}
                        />
                    </Col>
                </Row>
            </Col>
            <Col span={24}>
                <Row gutter={[0, 24]}>
                    <Col span={24}>
                        <Typography.Title level={4}>
                            {ContactTicketsMessage}
                        </Typography.Title>
                    </Col>
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
                </Row>
            </Col>
            <ActionBar>
                <Button
                    key='submit'
                    onClick={() => handleTicketCreateClick(lastCreatedTicket)}
                    type='sberDefaultGradient'
                >
                    Создать заявку
                </Button>
                {
                    handleContactEditClick && (
                        <Button
                            key='submit'
                            onClick={handleContactEditClick}
                            type='sberDefaultGradient'
                            secondary
                        >
                            Редактировать контакт
                        </Button>
                    )
                }
            </ActionBar>
        </Row>
    )
}

const ContactClientTabContent = ({ redirectUrl, property, unitName, phone }) => {
    const router = useRouter()

    const { objs: contacts } = Contact.useObjects({
        where: {
            property: { id: property.id },
            unitName,
            phone,
        },
    })
    const contact = get(contacts, 0, null)

    const searchTicketsQuery = useMemo(() => ({
        property: { id: get(property, 'id', null) },
        unitName,
        contact: { id: get(contact, 'id') },
    }), [contact, property, unitName])

    const handleTicketCreateClick = useCallback(async () => {
        const initialValues = {
            property: get(property, 'id'),
            unitName,
            contact: get(contact, 'id'),
            clientName: get(contact, 'name'),
            clientPhone: get(contact, 'phone'),
            unitType: BuildingUnitSubType.Flat,
            isResidentTicket: true,
        }

        const query = qs.stringify(
            { initialValues: JSON.stringify(initialValues), redirect: redirectUrl },
            { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
        )

        await router.push(`/ticket/create${query}`)
    }, [contact, property, router, redirectUrl, unitName])

    const handleContactEditClick = useCallback(async () => {
        const query = qs.stringify(
            { redirect: redirectUrl },
            { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
        )

        await router.push(`/contact/${get(contact, 'id')}/update${query}`)
    }, [contact, redirectUrl, router])

    return (
        <>
            <ClientCardTabContent
                property={property}
                searchTicketsQuery={searchTicketsQuery}
                handleTicketCreateClick={handleTicketCreateClick}
                handleContactEditClick={handleContactEditClick}
            />
        </>
    )
}

const NotResidentClientTabContent = ({ property, unitName, phone, redirectUrl }) => {
    const router = useRouter()

    const searchTicketsQuery = useMemo(() => ({
        property: { id: get(property, 'id', null) },
        unitName,
        clientPhone: phone,
        isResidentTicket: false,
        clientName_not: null,
    }), [phone, property, unitName])

    const handleTicketCreateClick = useCallback(async (ticket) => {
        const initialValues = {
            property: get(property, 'id'),
            unitName,
            clientName: get(ticket, 'clientName'),
            clientPhone: get(ticket, 'clientPhone'),
            unitType: BuildingUnitSubType.Flat,
            isResidentTicket: false,
        }

        const query = qs.stringify(
            { initialValues: JSON.stringify(initialValues), redirect: redirectUrl },
            { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
        )

        await router.push(`/ticket/create${query}`)
    }, [property, redirectUrl, router, unitName])

    return (
        <>
            <ClientCardTabContent
                property={property}
                searchTicketsQuery={searchTicketsQuery}
                handleTicketCreateClick={handleTicketCreateClick}
            />
        </>
    )
}

const ClientTabContent = ({ type, phone, property, unitName }) => {
    const redirectUrl = useMemo(() => `/phone/${phone}?tab=${property.id}-${unitName}-${type}`, [phone, property.id, type, unitName])

    return type === ClientType.Contact ? (
        <ContactClientTabContent
            redirectUrl={redirectUrl}
            phone={phone}
            property={property}
            unitName={unitName}
        />
    ) : (
        <NotResidentClientTabContent
            redirectUrl={redirectUrl}
            phone={phone}
            property={property}
            unitName={unitName}
        />
    )
}

const StyledAddAddressTab = styled.div<{ active }>`
  width: 258px;
  height: 150px;
  box-shadow: ${shadows.small};
  border-radius: 12px;
  border: ${props => !props.active ? `1px dashed ${colors.inputBorderHover}` : 'inherit'};
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  
  & .anticon {
    margin: 0;
  }
`

const AddAddressTabTitle = () => {
    const [active, setActive] = useState<boolean>()
    const handleMouseEnter = useCallback(() => {
        setActive(true)
    }, [])
    const handleMouseLeave = useCallback(() => {
        setActive(false)
    }, [])
    return (
        <StyledAddAddressTab active={active} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <Typography.Link href='/contact/create' style={{ color: colors.black }}>
                <Button type='sberDefaultGradient' icon={<PlusOutlined />} shape='circle'/>
                <Typography.Paragraph style={{ marginTop: '12px' }}>
                    Добавить адрес
                </Typography.Paragraph>
            </Typography.Link>
        </StyledAddAddressTab>
    )
}

const ClientCardPageContent = ({ phoneNumber, tabsData }) => {
    const intl = useIntl()
    const ClientCardTitle = intl.formatMessage({ id: 'pages.clientCard.Title' }, {
        phone: phoneNumber,
    })

    const router = useRouter()
    const { tab } = parseQuery(router.query)

    const [activeTab, setActiveTab] = useState(tab)

    const handleTabChange = useCallback((newKey) => {
        setActiveTab(newKey)
        const newRoute = `${router.route.replace('[number]', phoneNumber)}?tab=${newKey}`

        return router.push(newRoute)
    }, [phoneNumber, router])

    return (
        <>
            <Head>
                <title>{ClientCardTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={[0, 60]}>
                        <Col span={24}>
                            <Typography.Title>{ClientCardTitle}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <StyledTabs
                                onChange={handleTabChange}
                                moreIcon={null}
                                defaultActiveKey={tab}
                                activeKey={tab}
                            >
                                <Tabs.TabPane tab={<AddAddressTabTitle />} key='addAddress' />
                                {
                                    tabsData.map(({ type, property, unitName }) => {
                                        const key = `${property.id}-${unitName}-${type}`

                                        const Tab = (
                                            <ClientTabTitle
                                                type={type}
                                                property={property}
                                                unitName={unitName}
                                                active={activeTab === key}
                                            />
                                        )

                                        return (
                                            <Tabs.TabPane tab={Tab} key={key}>
                                                <ClientTabContent
                                                    type={type}
                                                    property={property}
                                                    phone={phoneNumber}
                                                    unitName={unitName}
                                                />
                                            </Tabs.TabPane>
                                        )
                                    })
                                }
                            </StyledTabs>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

const ClientCardPage = () => {
    const router = useRouter()
    const phoneNumber = get(router, ['query', 'number']) as string

    const { organization } = useOrganization()
    const organizationId = get(organization, 'id', null)

    const { objs: contacts } = Contact.useObjects({
        where: {
            organization: { id: organizationId },
            phone: phoneNumber,
        },
    })

    // Баг -- 2 тикета - будет создавать 2 табы и 2 таблицы и тд, возможно надо группировать по номерам телефонов, чето придумать кароче
    const { objs: tickets } = Ticket.useObjects({
        where: {
            organization: { id: organizationId },
            clientPhone: phoneNumber,
            isResidentTicket: false,
        },
    })

    const { objs: employees } = OrganizationEmployee.useObjects({
        where: {
            organization: { id: organizationId },
            phone: phoneNumber,
        },
    })

    const employeeTickets = tickets.filter(ticket => !!employees.find(employee => employee.phone === ticket.clientPhone))
    const notResidentTickets = tickets.filter(ticket => !employeeTickets.find(employeeTicket => employeeTicket.id === ticket.id))

    const tabsData = useMemo(() => {
        const contactsData = contacts.map(contact => ({ type: ClientType.Contact, property: contact.property, unitName: contact.unitName }))
        const employeesData = employeeTickets.map(ticket => ({ type: ClientType.Employee, property: ticket.property, unitName: ticket.unitName }))
        const notResidentData = notResidentTickets.map(ticket => ({ type: ClientType.NotResident, property: ticket.property, unitName: ticket.unitName }))

        return [...contactsData, ...employeesData, ...notResidentData]
    }, [contacts, employeeTickets, notResidentTickets])


    return (
        <ClientCardPageContent
            phoneNumber={phoneNumber}
            tabsData={tabsData}
        />
    )
}

ClientCardPage.requiredAccess = OrganizationRequired

export default ClientCardPage