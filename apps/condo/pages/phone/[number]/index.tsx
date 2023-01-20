import {
    BuildingUnitSubType,
    Contact as ContactType,
    Property,
    SortTicketsBy,
    Ticket as TicketType,
} from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Row, Typography } from 'antd'
import { CarouselRef } from 'antd/es/carousel'
import { Gutter } from 'antd/es/grid/row'
import { EllipsisConfig } from 'antd/es/typography/Base'
import get from 'lodash/get'
import uniqBy from 'lodash/uniqBy'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Carousel, Typography as UITypography } from '@open-condo/ui'

import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { PageContent, PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { BuildingIcon } from '@condo/domains/common/components/icons/BuildingIcon'
import { PlusIcon } from '@condo/domains/common/components/icons/PlusIcon'
import { Loader } from '@condo/domains/common/components/Loader'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { Tag } from '@condo/domains/common/components/Tag'
import { useTracking } from '@condo/domains/common/components/TrackingContext'
import { colors, fontSizes, gradients, shadows, transitions } from '@condo/domains/common/constants/style'
import { getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { renderPhone } from '@condo/domains/common/utils/Renders'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { ClientType, getClientCardTabKey, redirectToForm } from '@condo/domains/contact/utils/clientCard'
import { Contact } from '@condo/domains/contact/utils/clientSchema'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { getPropertyAddressParts } from '@condo/domains/property/utils/helpers'
import { TicketResidentFeatures } from '@condo/domains/ticket/components/TicketId/TicketResidentFeatures'
import { TicketPropertyHintCard } from '@condo/domains/ticket/components/TicketPropertyHint/TicketPropertyHintCard'
import { useTicketVisibility } from '@condo/domains/ticket/contexts/TicketVisibilityContext'
import { useClientCardTicketTableColumns } from '@condo/domains/ticket/hooks/useClientCardTicketTableColumns'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'


//#region Constants, types and styles
const TAG_STYLE: CSSProperties = { borderRadius: '100px' }
const STREET_PARAGRAPH_STYLE: CSSProperties = { margin: 0, fontSize: fontSizes.content }
const ADDRESS_POSTFIX_ELLIPSIS: EllipsisConfig = { rows: 2 }
const ADDRESS_POSTFIX_STYLE: CSSProperties = { margin: 0, fontSize: fontSizes.label }
const ROW_BIG_GUTTER: [Gutter, Gutter] = [0, 60]
const ROW_MEDIUM_GUTTER: [Gutter, Gutter] = [0, 40]
const ROW_MEDIUM_SMALL_GUTTER: [Gutter, Gutter] = [0, 24]
const ADD_ADDRESS_TEXT_STYLE: CSSProperties = { marginTop: '12px', marginBottom: '0' }
const HINT_CARD_STYLE = { maxHeight: '3em' }
const CLIENT_TEXT_STYLE = { fontSize: fontSizes.content }
const TICKET_SORT_BY = [SortTicketsBy.CreatedAtDesc]
const PLUS_ICON_WRAPPER_CLASS = 'plusIconWrapper'
const ADD_ADDRESS_TAB_KEY = 'addAddress'

interface IClientContactProps {
    lastTicket: TicketType,
    contact?: ContactType
    showOrganizationMessage?: boolean
}

type TabDataType = {
    type: ClientType,
    property: Property,
    unitName: string,
    unitType: string
}

const StyledCarouselWrapper = styled(Col)`
  & .condo-carousel {
    background: none;
    padding: 0;
    transform: translateX(-12px);

    & .slick-list {
      width: calc(100% + 24px);
      margin: 0;

      & .slick-track {
        & .slick-slide {
          padding: 0 12px;
          
          & > div {
            margin: 0;
            overflow: initial;
          }
        }
      }
    }

    & .slick-prev {
      left: -8px;
    }

    & .slick-next {
      right: -32px;
    }
  }
`
const StyledAddressTabWrapper = styled.div<{ active: boolean }>`
  height: 165px;
  border-radius: 12px;
  background: ${props => props.active ? gradients.sberActionGradient : 'inherit'};
  padding: 1px;
  border: 1px solid ${colors.backgroundWhiteSecondary};
  box-shadow: ${props => props.active ? shadows.main : 'inherit'};
  transition: ${transitions.allDefault};

  & > div {
    border-radius: 11px;
    height: 100%;
    padding: 20px;
    background-color: ${colors.white};
  }

  &:hover {
    cursor: pointer;
    box-shadow: ${shadows.main};
  }
`
const StyledAddressTabContent = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 12px;
`
const StyledAddAddressButton = styled(Button)`
  height: 165px;
  width: 100%;
  border: 1px dashed ${colors.inputBorderHover};
  border-radius: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 600;

  & .anticon {
    margin: 0;
  }

  &:hover {
    border-color: ${colors.inputBorderHover};
    box-shadow: ${shadows.main};

    & .${PLUS_ICON_WRAPPER_CLASS} {
      background-color: ${colors.black};
      color: ${colors.white};
    }
  }
`
const PlusIconWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 100px;
  background-color: ${colors.backgroundLightGrey};
  color: ${colors.black};
  transition: inherit;
  display: flex;
  justify-content: center;
  align-items: center;
`
const StyledCol = styled(Col)`
  font-size: ${fontSizes.content};
  
  & > a > .ant-row > .ant-col:first-child {
    padding-right: 3px !important;
    padding-top: 3px;
  }
`
//#endregion

//#region AddAddress and Client Address cards
const AddAddressCard = ({ onClick }) => {
    const intl = useIntl()
    const AddAddressMessage = intl.formatMessage({ id: 'pages.clientCard.addAddress' })

    return (
        <StyledAddAddressButton onClick={onClick} eventName='ClientCardAddAddressClick'>
            <PlusIconWrapper className={PLUS_ICON_WRAPPER_CLASS}>
                <PlusIcon/>
            </PlusIconWrapper>
            <Typography.Paragraph style={ADD_ADDRESS_TEXT_STYLE}>
                {AddAddressMessage}
            </Typography.Paragraph>
        </StyledAddAddressButton>
    )
}

const ClientAddressCard = ({ onClick, active, type, property, unitName, unitType, isEmployee }) => {
    const intl = useIntl()
    const ContactMessage = intl.formatMessage({ id: 'Contact' })
    const NotResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.isResidentContact.false' })
    const EmployeeMessage = intl.formatMessage({ id: 'Employee' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const FlatMessage = intl.formatMessage({ id: 'field.ShortFlatNumber' })
    const ParkingMessage = intl.formatMessage({ id: 'field.UnitType.prefix.parking' })

    const typeToMessage = useMemo(() => ({
        [ClientType.Resident]: ContactMessage,
        [ClientType.NotResident]: isEmployee ? EmployeeMessage : NotResidentMessage,
    }), [ContactMessage, EmployeeMessage, NotResidentMessage, isEmployee])

    const { text, postfix } = getPropertyAddressParts(property, DeletedMessage)
    const unitNamePrefix = unitType === BuildingUnitSubType.Parking ? ParkingMessage : FlatMessage
    const streetAndFlatMessage = unitName ? `${text} ${unitNamePrefix} ${unitName}` : text.substring(0, text.length - 1)

    return (
        <StyledAddressTabWrapper active={active} onClick={onClick}>
            <StyledAddressTabContent>
                <div>
                    <Tag type='gray' style={TAG_STYLE}>
                        {typeToMessage[type]}
                    </Tag>
                </div>
                <div>
                    <Typography.Paragraph
                        ellipsis={ADDRESS_POSTFIX_ELLIPSIS}
                        title={streetAndFlatMessage}
                        strong
                        style={STREET_PARAGRAPH_STYLE}
                    >
                        {streetAndFlatMessage}
                    </Typography.Paragraph>
                    <Typography.Paragraph
                        ellipsis={ADDRESS_POSTFIX_ELLIPSIS}
                        title={postfix}
                        type='secondary'
                        style={ADDRESS_POSTFIX_STYLE}
                    >
                        {postfix}
                    </Typography.Paragraph>
                </div>
            </StyledAddressTabContent>
        </StyledAddressTabWrapper>
    )
}
//#endregion

//#region Contact and Not resident client Tab content
const ClientContent: React.FC<IClientContactProps> = ({ lastTicket, contact, showOrganizationMessage }) => {
    const name = get(contact, 'name', get(lastTicket, 'clientName'))
    const email = get(contact, 'email', get(lastTicket, 'clientEmail'))
    const organizationName = get(contact, 'organization.name', get(lastTicket, 'organization.name'))

    return (
        <Row gutter={ROW_MEDIUM_SMALL_GUTTER}>
            <Col span={24}>
                <Row justify='space-between'>
                    <Typography.Title level={3}>{name}</Typography.Title>
                    {
                        lastTicket && (
                            <TicketResidentFeatures ticket={lastTicket}/>
                        )
                    }
                </Row>
            </Col>
            {
                email && (
                    <Col span={24}>
                        <Typography.Text style={CLIENT_TEXT_STYLE}>
                            {email}
                        </Typography.Text>
                    </Col>
                )
            }
            {
                showOrganizationMessage && (
                    <Col span={24}>
                        <Typography.Text style={CLIENT_TEXT_STYLE}>
                            {organizationName}
                        </Typography.Text>
                    </Col>
                )
            }
        </Row>
    )
}

const ClientCardTabContent = ({
    property,
    searchTicketsQuery,
    handleTicketCreateClick,
    canManageContacts,
    handleContactEditClick = null,
    contact = null,
    showOrganizationMessage = false,
}) => {
    const intl = useIntl()
    const ShowAllPropertyTicketsMessage = intl.formatMessage({ id: 'pages.clientCard.showAllPropertyTickets' })
    const ContactTicketsMessage = intl.formatMessage({ id: 'pages.clientCard.contactTickets' })
    const CreateTicketMessage = intl.formatMessage({ id: 'CreateTicket' })
    const EditContactMessage = intl.formatMessage({ id: 'pages.clientCard.editContact' })

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

    const columns = useClientCardTicketTableColumns(tickets)
    const { logEvent } = useTracking()

    const handleShowAllPropertyTicketsMessage = useCallback(async () => {
        logEvent({ eventName: 'ClientCardShowAllPropertyTicketsClick' })
        const newParameters = getFiltersQueryData({ property: [get(property, 'id', null)] })
        await updateQuery(router, { newParameters, newRoute: '/ticket' })
    }, [logEvent, property, router])

    const handleRowAction = useCallback((record) => {
        return {
            onClick: async () => {
                logEvent({
                    eventName: 'ClientCardTicketIndexClick',
                    eventProperties: { ticketId: record.id } }
                )
                await router.push(`/ticket/${record.id}/`)
            },
        }
    }, [logEvent, router])

    const handleCreateTicket = useCallback(() => handleTicketCreateClick(lastCreatedTicket),
        [handleTicketCreateClick, lastCreatedTicket])

    return (
        <Row gutter={ROW_BIG_GUTTER}>
            <Col span={24}>
                <Row gutter={ROW_MEDIUM_GUTTER}>
                    <Col span={24}>
                        <Row>
                            <StyledCol>
                                <UITypography.Link onClick={handleShowAllPropertyTicketsMessage}>
                                    <Row gutter={[12, 0]}>
                                        <Col>
                                            <BuildingIcon/>
                                        </Col>
                                        <Col>
                                            {ShowAllPropertyTicketsMessage}
                                        </Col>
                                    </Row>
                                </UITypography.Link>
                            </StyledCol>
                        </Row>
                    </Col>
                    <Col span={24}>
                        <ClientContent
                            lastTicket={lastCreatedTicket}
                            contact={contact}
                            showOrganizationMessage={showOrganizationMessage}
                        />
                    </Col>
                    <TicketPropertyHintCard
                        propertyId={get(property, 'id', null)}
                        hintContentStyle={HINT_CARD_STYLE}
                        withCol
                    />
                </Row>
            </Col>
            <Col span={24}>
                <Row gutter={ROW_MEDIUM_SMALL_GUTTER}>
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
                    onClick={handleCreateTicket}
                    type='sberDefaultGradient'
                    eventName='ClientCardCreateTicketClick'
                >
                    {CreateTicketMessage}
                </Button>
                {
                    canManageContacts && handleContactEditClick && (
                        <Button
                            key='submit'
                            onClick={handleContactEditClick}
                            type='sberDefaultGradient'
                            secondary
                            eventName='ClientCardEditContactClick'
                        >
                            {EditContactMessage}
                        </Button>
                    )
                }
            </ActionBar>
        </Row>
    )
}

const ContactClientTabContent = ({
    property,
    unitName,
    unitType,
    phone,
    canManageContacts,
    showOrganizationMessage = false,
}) => {
    const router = useRouter()

    const { objs: contacts } = Contact.useObjects({
        where: {
            property: { id: get(property, 'id', null) },
            unitName,
            unitType,
            phone,
        },
    })
    const contact = get(contacts, 0, null)

    const searchTicketsQuery = useMemo(() => ({
        property: { id: get(property, 'id', null) },
        unitName,
        unitType,
        contact: { id: get(contact, 'id') },
    }), [contact, property, unitName, unitType])

    const handleTicketCreateClick = useCallback(async () => {
        const initialValues = {
            property: get(property, 'id'),
            unitName,
            unitType,
            contact: get(contact, 'id'),
            clientName: get(contact, 'name'),
            clientPhone: get(contact, 'phone'),
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
            formRoute: `/contact/${get(contact, 'id')}/update`,
        })
    }, [contact, router])

    return (
        <ClientCardTabContent
            property={property}
            searchTicketsQuery={searchTicketsQuery}
            handleTicketCreateClick={handleTicketCreateClick}
            handleContactEditClick={handleContactEditClick}
            canManageContacts={canManageContacts}
            contact={contact}
            showOrganizationMessage={showOrganizationMessage}
        />
    )
}

const NotResidentClientTabContent = ({ property, unitName, unitType, phone, showOrganizationMessage = false }) => {
    const router = useRouter()

    const searchTicketsQuery = useMemo(() => ({
        property: { id: get(property, 'id', null) },
        unitName,
        unitType,
        clientPhone: phone,
        clientName_not: null,
        isResidentTicket: false,
    }), [phone, property, unitName, unitType])

    const handleTicketCreateClick = useCallback(async (ticket) => {
        const initialValues = {
            property: get(property, 'id'),
            unitName,
            unitType,
            clientName: get(ticket, 'clientName'),
            clientPhone: get(ticket, 'clientPhone'),
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
            property={property}
            searchTicketsQuery={searchTicketsQuery}
            handleTicketCreateClick={handleTicketCreateClick}
            canManageContacts={false}
            showOrganizationMessage={showOrganizationMessage}
        />
    )
}

const parseCardDataFromQuery = (stringCard) => {
    try {
        return JSON.parse(stringCard)
    } catch (e) {
        console.error(e)

        return {}
    }
}

const ClientTabContent = ({ tabData, phone, canManageContacts, showOrganizationMessage = false }) => {
    const property = get(tabData, 'property')
    const unitName = get(tabData, 'unitName')
    const unitType = get(tabData, 'unitType')
    const type = get(tabData, 'type')

    return type === ClientType.Resident ? (
        <ContactClientTabContent
            phone={phone}
            property={property}
            unitName={unitName}
            unitType={unitType}
            canManageContacts={canManageContacts}
            showOrganizationMessage={showOrganizationMessage}
        />
    ) : (
        <NotResidentClientTabContent
            phone={phone}
            property={property}
            unitName={unitName}
            unitType={unitType}
            showOrganizationMessage={showOrganizationMessage}
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
}) => {
    const intl = useIntl()
    const ClientCardTitle = intl.formatMessage({ id: 'pages.clientCard.Title' }, {
        phone: renderPhone(phoneNumber),
    })

    const router = useRouter()
    const { tab } = parseQuery(router.query)

    const carouselRef = useRef<CarouselRef>()
    const activeTabIndexRef = useRef<number>()

    const [activeTab, setActiveTab] = useState<string>(tab)
    const [activeTabData, setActiveTabData] = useState<TabDataType>()
    const [initialActiveTab, setInitialActiveTab] = useState<string>()
    const [isInitialSlideScrolled, setIsInitialSlideScrolled] = useState<boolean>()

    const { breakpoints } = useLayoutContext()

    const slidesToShow = useMemo(() => {
        if (breakpoints.lg) {
            return 4
        }
        if (breakpoints.md) {
            return 3
        }
        if (breakpoints.sm) {
            return 2
        }
        return 1
    }, [breakpoints.lg, breakpoints.md, breakpoints.sm])

    useEffect(() => {
        if (!initialActiveTab && tab) {
            setInitialActiveTab(tab)
        }
    }, [initialActiveTab, tab])

    useDeepCompareEffect(() => {
        const { tab } = parseQuery(router.query)
        setActiveTab(tab)
    }, [router.query])

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
        const { type, property: propertyId, unitName, unitType } = parseCardDataFromQuery(activeTab)
        const tabDataWithProperty = tabsData.find(({ property }) => property.id === propertyId)
        const property = get(tabDataWithProperty, 'property')

        if (property) {
            setActiveTabData({ type, property, unitName, unitType })
        }
    }, [activeTab, tabsData])

    const handleTabChange = useCallback(async (newKey) => {
        if (newKey === ADD_ADDRESS_TAB_KEY) {
            return await redirectToForm({
                router,
                formRoute: '/contact/create',
                initialValues: {
                    phone: phoneNumber,
                },
            })
        }

        setActiveTab(newKey)
        const newRoute = `${router.route.replace('[number]', phoneNumber)}?tab=${newKey}`

        return router.push(newRoute)
    }, [phoneNumber, router])

    const handleAddAddressClick = useCallback(() => handleTabChange(ADD_ADDRESS_TAB_KEY), [handleTabChange])

    const renderedCards = useMemo(() => {
        const addAddressTab = canManageContacts && <AddAddressCard onClick={handleAddAddressClick}/>
        const addressTabs = tabsData.map(({ type, property, unitName, unitType, isEmployee }, index) => {
            const key = getClientCardTabKey(get(property, 'id', null), type, unitName, unitType)
            const isActive = activeTab && activeTab === key

            if (isActive) {
                activeTabIndexRef.current = canManageContacts ? index + 1 : index
            }

            return <ClientAddressCard
                onClick={() => handleTabChange(key)}
                isEmployee={isEmployee}
                key={key}
                type={type}
                property={property}
                unitName={unitName}
                unitType={unitType}
                active={isActive}
            />
        })

        return [addAddressTab, ...addressTabs].filter(Boolean)
    }, [activeTab, canManageContacts, handleAddAddressClick, handleTabChange, initialActiveTab, tabsData])

    return (
        <>
            <Head>
                <title>{ClientCardTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={ROW_MEDIUM_GUTTER}>
                        <Col span={24}>
                            <Typography.Title>{ClientCardTitle}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <Row gutter={[0, 20]}>
                                {
                                    loading ? <Loader/> : (
                                        <StyledCarouselWrapper span={24}>
                                            <Carousel
                                                infinite={false}
                                                ref={carouselRef}
                                                slidesToShow={slidesToShow}
                                                dots={false}
                                            >
                                                {renderedCards}
                                            </Carousel>
                                        </StyledCarouselWrapper>
                                    )
                                }
                                <Col span={24}>
                                    <ClientTabContent
                                        tabData={activeTabData}
                                        phone={phoneNumber}
                                        canManageContacts={canManageContacts}
                                        showOrganizationMessage={showOrganizationMessage}
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

export const ClientCardPageContentWrapper = ({ baseQuery, canManageContacts, showOrganizationMessage = false }) => {
    const router = useRouter()
    const phoneNumber = get(router, ['query', 'number']) as string

    const { objs: contacts, loading: contactsLoading } = Contact.useObjects({
        where: {
            ...baseQuery,
            phone: phoneNumber,
        },
    })

    const { objs: tickets, loading: ticketsLoading } = Ticket.useObjects({
        where: {
            ...baseQuery,
            clientPhone: phoneNumber,
            isResidentTicket: false,
            contact_is_null: true,
        },
    })

    const { objs: employees, loading: employeesLoading } = OrganizationEmployee.useObjects({
        where: {
            ...baseQuery,
            phone: phoneNumber,
        },
    })

    const employeeTickets = useMemo(() =>
        tickets.filter(ticket => !!employees.find(employee => employee.phone === ticket.clientPhone)),
    [employees, tickets])
    const notResidentTickets = useMemo(() =>
        tickets.filter(ticket => !employeeTickets.find(employeeTicket => employeeTicket.id === ticket.id)),
    [employeeTickets, tickets])

    const tabsData = useMemo(() => {
        const contactsData = contacts.map(contact => ({
            type: ClientType.Resident,
            property: contact.property,
            unitName: contact.unitName,
            unitType: contact.unitType,
        }))
        const notResidentData = uniqBy(notResidentTickets.map(ticket => ({
            type: ClientType.NotResident,
            property: ticket.property,
            unitName: ticket.unitName,
            unitType: ticket.unitType,
        })), 'property.id')
        const employeesData = uniqBy(employeeTickets.map(ticket => ({
            type: ClientType.NotResident,
            isEmployee: true,
            property: ticket.property,
            unitName: ticket.unitName,
            unitType: ticket.unitType,
        })), 'property.id')

        return [...contactsData, ...notResidentData, ...employeesData]
    }, [contacts, employeeTickets, notResidentTickets])

    return (
        <ClientCardPageContent
            phoneNumber={phoneNumber}
            tabsData={tabsData}
            canManageContacts={canManageContacts}
            loading={ticketsLoading || contactsLoading || employeesLoading}
            showOrganizationMessage={showOrganizationMessage}
        />
    )
}

const ClientCardPage = () => {
    const { organization, link } = useOrganization()
    const organizationId = get(organization, 'id', null)
    const canManageContacts = !!get(link, 'role.canManageContacts')

    const { ticketFilterQuery } = useTicketVisibility()
    const baseQuery = { ...ticketFilterQuery, property: { deletedAt: null }, organization: { id: organizationId } }

    return (
        <ClientCardPageContentWrapper
            baseQuery={baseQuery}
            canManageContacts={canManageContacts}
        />
    )
}
//#endregion

ClientCardPage.requiredAccess = OrganizationRequired

export default ClientCardPage