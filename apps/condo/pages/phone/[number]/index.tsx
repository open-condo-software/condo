import {
    BuildingUnitSubType,
    Contact as ContactType,
    Organization as OrganizationType,
    Property,
    SortTicketsBy,
    Ticket as TicketType,
} from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, ColProps, Row, RowProps } from 'antd'
import { CarouselRef } from 'antd/es/carousel'
import { EllipsisConfig } from 'antd/es/typography/Base'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import uniqBy from 'lodash/uniqBy'
import Head from 'next/head'
import { useRouter } from 'next/router'
import qs from 'qs'
import React, { CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { History, Mail } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Carousel, Space, Typography } from '@open-condo/ui'

import { Button as DeprecatedButton } from '@condo/domains/common/components/Button'
import { PageContent, PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { BuildingIcon } from '@condo/domains/common/components/icons/BuildingIcon'
import { PlusIcon } from '@condo/domains/common/components/icons/PlusIcon'
import { Loader } from '@condo/domains/common/components/Loader'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { Tag } from '@condo/domains/common/components/Tag'
import { useTracking } from '@condo/domains/common/components/TrackingContext'
import { colors, gradients, shadows, transitions } from '@condo/domains/common/constants/style'
import { renderPhone } from '@condo/domains/common/utils/Renders'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { ClientType, getClientCardTabKey, redirectToForm } from '@condo/domains/contact/utils/clientCard'
import { Contact } from '@condo/domains/contact/utils/clientSchema'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { getPropertyAddressParts } from '@condo/domains/property/utils/helpers'
import { IncidentHints } from '@condo/domains/ticket/components/IncidentHints'
import { TicketReadPermissionRequired } from '@condo/domains/ticket/components/PageAccess'
import { TicketResidentFeatures } from '@condo/domains/ticket/components/TicketId/TicketResidentFeatures'
import { TicketPropertyHintCard } from '@condo/domains/ticket/components/TicketPropertyHint/TicketPropertyHintCard'
import { useTicketVisibility } from '@condo/domains/ticket/contexts/TicketVisibilityContext'
import { useClientCardTicketTableColumns } from '@condo/domains/ticket/hooks/useClientCardTicketTableColumns'
import { CallRecordFragment, Ticket } from '@condo/domains/ticket/utils/clientSchema'


//#region Constants, types and styles
const ADDRESS_STREET_ONE_ROW_HEIGHT = 25
const ADDRESS_POSTFIX_ONE_ROW_HEIGHT = 22

const TAG_STYLE: CSSProperties = { borderRadius: '100px' }
const ROW_BIG_GUTTER: RowProps['gutter'] = [0, 60]
const ROW_MEDIUM_GUTTER: RowProps['gutter'] = [0, 40]
const ROW_MEDIUM_SMALL_GUTTER: RowProps['gutter'] = [0, 24]
const HINT_CARD_STYLE = { maxHeight: '3em' }
const TICKET_SORT_BY = [SortTicketsBy.CreatedAtDesc]
const PLUS_ICON_WRAPPER_CLASS = 'plusIconWrapper'
const ADD_ADDRESS_TAB_KEY = 'addAddress'
const HINTS_COL_PROPS: ColProps = { span: 24 }

interface IClientContactProps {
    phone: string
    lastTicket: TicketType,
    contact?: ContactType
    showOrganizationMessage?: boolean
}

type TabDataType = {
    type: ClientType,
    property: Property,
    unitName: string,
    unitType: string
    organization: OrganizationType
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
      left: -8px !important;
    }

    & .slick-next {
      right: -32px !important;
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
const StyledAddAddressButton = styled(DeprecatedButton)`
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
//#endregion

//#region AddAddress and Client Address cards
const AddAddressCard = ({ onClick }) => {
    const intl = useIntl()
    const AddAddressMessage = intl.formatMessage({ id: 'pages.clientCard.addAddress' })

    return (
        <StyledAddAddressButton onClick={onClick} eventName='ClientCardAddAddressClick'>
            <Space size={12} direction='vertical' align='center'>
                <PlusIconWrapper className={PLUS_ICON_WRAPPER_CLASS}>
                    <PlusIcon/>
                </PlusIconWrapper>
                <Typography.Paragraph>
                    {AddAddressMessage}
                </Typography.Paragraph>
            </Space>
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
                <Space size={8} direction='vertical'>
                    <Typography.Paragraph
                        ref={addressStreetRef}
                        ellipsis={addressStreetEllipsis}
                        title={streetAndFlatMessage}
                        strong
                    >
                        {streetAndFlatMessage}
                    </Typography.Paragraph>
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
            </StyledAddressTabContent>
        </StyledAddressTabWrapper>
    )
}
//#endregion

//#region Contact and Not resident client Tab content
const ClientContent: React.FC<IClientContactProps> = ({ lastTicket, contact, showOrganizationMessage, phone }) => {
    const intl = useIntl()
    const CallRecordsLogMessage = intl.formatMessage({ id: 'pages.clientCard.callRecordsLog' })

    const name = get(contact, 'name', get(lastTicket, 'clientName'))
    const email = get(contact, 'email', get(lastTicket, 'clientEmail'))
    const organizationName = get(contact, 'organization.name', get(lastTicket, 'organization.name'))

    const propertyId = get(contact, 'property.id', get(lastTicket, 'property.id', null))

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

    return (
        <Row gutter={ROW_MEDIUM_SMALL_GUTTER}>
            <Col span={24}>
                <Space size={12} direction='vertical'>
                    <Space size={24} direction='horizontal'>
                        <Typography.Title level={2}>{name}</Typography.Title>
                        {
                            lastTicket && (
                                <TicketResidentFeatures ticket={lastTicket}/>
                            )
                        }
                    </Space>
                    {
                        showOrganizationMessage && (
                            <Typography.Text strong type='secondary' size='medium'>
                                {organizationName}
                            </Typography.Text>
                        )
                    }
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
    searchTicketsQuery,
    handleTicketCreateClick,
    canManageContacts,
    handleContactEditClick = null,
    contact = null,
    showOrganizationMessage = false,
    organization,
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
    const propertyId = useMemo(() => get(property, 'id', null), [property])
    const organizationId = useMemo(() => get(organization, 'id'), [organization])

    const columns = useClientCardTicketTableColumns(tickets)
    const { logEvent } = useTracking()

    const handleShowAllPropertyTicketsMessage = useCallback(async () => {
        if (typeof window !== 'undefined') {
            logEvent({ eventName: 'ClientCardShowAllPropertyTicketsClick' })
            window.open(`/ticket?filters={"property":"${property.id}"}`, '_blank')
        }
    }, [logEvent, property])

    const handleRowAction = useCallback((record) => {
        return {
            onClick: async () => {
                if (typeof window !== 'undefined') {
                    logEvent({
                        eventName: 'ClientCardTicketIndexClick',
                        eventProperties: { ticketId: record.id },
                    }
                    )
                    window.open(`/ticket/${record.id}/`, '_blank')
                }
            },
        }
    }, [logEvent])

    const handleCreateTicket = useCallback(() => {
        const dataForTicketForm = property ? lastCreatedTicket : { clientPhone: phone }
        handleTicketCreateClick(dataForTicketForm)
    },
    [handleTicketCreateClick, lastCreatedTicket, property])

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
                                        lastTicket={lastCreatedTicket}
                                        contact={contact}
                                        showOrganizationMessage={showOrganizationMessage}
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
    property,
    unitName,
    unitType,
    phone,
    canManageContacts,
    organization,
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
            phone={phone}
            property={property}
            searchTicketsQuery={searchTicketsQuery}
            handleTicketCreateClick={handleTicketCreateClick}
            handleContactEditClick={handleContactEditClick}
            canManageContacts={canManageContacts}
            contact={contact}
            showOrganizationMessage={showOrganizationMessage}
            organization={organization}
        />
    )
}

const NotResidentClientTabContent = ({
    property,
    unitName,
    unitType,
    phone,
    organization,
    showOrganizationMessage = false,
}) => {
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
            phone={phone}
            property={property}
            searchTicketsQuery={searchTicketsQuery}
            handleTicketCreateClick={handleTicketCreateClick}
            canManageContacts={false}
            showOrganizationMessage={showOrganizationMessage}
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
    const property = get(tabData, 'property')
    const unitName = get(tabData, 'unitName')
    const unitType = get(tabData, 'unitType')
    const type = get(tabData, 'type')
    const organization = get(tabData, 'organization')

    return type === ClientType.Resident ? (
        <ContactClientTabContent
            phone={phone}
            property={property}
            unitName={unitName}
            unitType={unitType}
            canManageContacts={canManageContacts}
            showOrganizationMessage={showOrganizationMessage}
            organization={organization}
        />
    ) : (
        <NotResidentClientTabContent
            phone={phone}
            property={property}
            unitName={unitName}
            unitType={unitType}
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
    phoneNumberPrefix,
    showOrganizationMessage = false,
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
        const organization = get(tabDataWithProperty, 'organization')

        if (property) {
            setActiveTabData({ type, property, unitName, unitType, organization })
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
        const addAddressTab = canManageContacts && <AddAddressCard key='addAddress' onClick={handleAddAddressClick}/>
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

    useEffect(() => {
        if (!activeTab && !isEmpty(tabsData)) {
            const { type, property, unitName, unitType } = tabsData[0]
            const key = getClientCardTabKey(get(property, 'id', null), type, unitName, unitType)

            handleTabChange(key)
        }
    }, [activeTab, handleTabChange, tabsData])

    return (
        <>
            <Head>
                <title>{ClientCardTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={ROW_MEDIUM_GUTTER}>
                        <Col span={24}>
                            <Typography.Title>{ClientCardHeader}</Typography.Title>
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

export const ClientCardPageContentWrapper = ({
    organizationQuery,
    ticketsQuery,
    canManageContacts,
    showOrganizationMessage = false,
    usePhonePrefix = false,
}) => {
    const router = useRouter()
    const phoneNumber = get(router, ['query', 'number']) as string

    const { objs: contacts, loading: contactsLoading } = Contact.useObjects({
        where: {
            ...organizationQuery,
            phone: phoneNumber,
        },
    })

    const { objs: tickets, loading: ticketsLoading } = Ticket.useObjects({
        where: {
            ...ticketsQuery,
            clientPhone: phoneNumber,
            isResidentTicket: false,
            contact_is_null: true,
        },
    })

    const { objs: employees, loading: employeesLoading } = OrganizationEmployee.useObjects({
        where: {
            ...organizationQuery,
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
            organization: contact.organization,
        }))
        const notResidentData = uniqBy(notResidentTickets.map(ticket => ({
            type: ClientType.NotResident,
            property: ticket.property,
            unitName: ticket.unitName,
            unitType: ticket.unitType,
            organization: ticket.organization,
        })), 'property.id')
        const employeesData = uniqBy(employeeTickets.map(ticket => ({
            type: ClientType.NotResident,
            isEmployee: true,
            property: ticket.property,
            unitName: ticket.unitName,
            unitType: ticket.unitType,
            organization: ticket.organization,
        })), 'property.id')

        return [...contactsData, ...notResidentData, ...employeesData]
            .filter(tabsData => tabsData.organization && tabsData.property)
    }, [contacts, employeeTickets, notResidentTickets])

    const phoneNumberPrefixFromContacts = get(contacts, ['0', 'organization', 'phoneNumberPrefix'])
    const phoneNumberPrefixFromEmployees = get(employees, ['0', 'organization', 'phoneNumberPrefix'])
    const phoneNumberPrefixFromTickets = get(tickets, ['0', 'organization', 'phoneNumberPrefix'])

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