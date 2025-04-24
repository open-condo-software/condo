import { PlusCircleOutlined } from '@ant-design/icons'
import {
    GetPropertyWithMapByIdQuery,
    GetTicketsQuery,
    useGetContactForClientCardQuery,
    useGetEmployeesForClientCardQuery,
    useGetPropertyWithMapByIdLazyQuery,
    useGetTicketsQuery,
} from '@app/condo/gql'
import {
    BuildingUnitSubType,
    Contact as ContactType,
    Organization as OrganizationType,
    Property,
    SortTicketsBy,
} from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, ColProps, Row, RowProps } from 'antd'
import { CarouselRef } from 'antd/es/carousel'
import { EllipsisConfig } from 'antd/es/typography/Base'
import uniqBy from 'lodash/uniqBy'
import Head from 'next/head'
import { useRouter } from 'next/router'
import qs from 'qs'
import React, { CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'


import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { ExternalLink, History, Mail } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Carousel, Space, Tabs, Typography } from '@open-condo/ui'

import { PageContent, PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { BuildingIcon } from '@condo/domains/common/components/icons/BuildingIcon'
import { Loader } from '@condo/domains/common/components/Loader'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { Tag } from '@condo/domains/common/components/Tag'
import { colors, gradients, shadows, transitions } from '@condo/domains/common/constants/style'
import { PageComponentType } from '@condo/domains/common/types'
import { renderPhone } from '@condo/domains/common/utils/Renders'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { ClientType, getClientCardTabKey, redirectToForm } from '@condo/domains/contact/utils/clientCard'
import { PARKING_SECTION_TYPE, SECTION_SECTION_TYPE } from '@condo/domains/property/constants/common'
import { getPropertyAddressParts } from '@condo/domains/property/utils/helpers'
import { IncidentHints } from '@condo/domains/ticket/components/IncidentHints'
import { TicketReadPermissionRequired } from '@condo/domains/ticket/components/PageAccess'
import { TicketResidentFeatures } from '@condo/domains/ticket/components/TicketId/TicketResidentFeatures'
import { TicketPropertyHintCard } from '@condo/domains/ticket/components/TicketPropertyHint/TicketPropertyHintCard'
import { useTicketVisibility } from '@condo/domains/ticket/contexts/TicketVisibilityContext'
import { useClientCardTicketTableColumns } from '@condo/domains/ticket/hooks/useClientCardTicketTableColumns'
import { CallRecordFragment } from '@condo/domains/ticket/utils/clientSchema'


//#region Constants, types and styles
const ADDRESS_STREET_ONE_ROW_HEIGHT = 25
const ADDRESS_POSTFIX_ONE_ROW_HEIGHT = 22

const TAG_STYLE: CSSProperties = { borderRadius: '100px' }
const ROW_BIG_GUTTER: RowProps['gutter'] = [0, 60]
const ROW_MEDIUM_GUTTER: RowProps['gutter'] = [0, 40]
const ROW_MEDIUM_SMALL_GUTTER: RowProps['gutter'] = [0, 24]
const HINT_CARD_STYLE = { maxHeight: '3em' }
const TICKET_SORT_BY = [SortTicketsBy.CreatedAtDesc]
const HINTS_COL_PROPS: ColProps = { span: 24 }

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
    lastTicket: GetTicketsQuery['tickets'][number]
    contact?: ContactType & { isEmployee?: boolean }
    showOrganizationMessage?: boolean
    type: string
}

const MAX_TABLE_SIZE = 20
type TableTabs = 'address' | 'entrance' | 'home'
type tabsItems = { key: TableTabs, label: string }[]
const tableTabs: Array<TableTabs> = ['address', 'entrance', 'home']

const findSectionByUnitLabelAndType = (mapData: GetPropertyWithMapByIdQuery['property'][number]['map'], unitName: string, unitType: string) => {
    let sectionType = `${SECTION_SECTION_TYPE}s`

    if (unitName === PARKING_SECTION_TYPE){
        sectionType = PARKING_SECTION_TYPE
    }

    for (const section of mapData[sectionType]) {
        for (const floor of section.floors) {
            for (const unit of floor.units) {
                if (unit.label === unitName && unit.unitType === unitType) {
                    return {
                        floor: floor.name,
                        sectionName: section.name,
                        sectionType: section.type,
                    }
                }
            }
        }
    }

    return null
}

const getMapData = async (concatData, getPropertyWithMapById) => {
    const propertyIds = [...new Set<string>(concatData.map(({ property }) => property.id))]

    try {
        const res = await Promise.all(
            propertyIds.map(async (el) => {
                const response = await getPropertyWithMapById({
                    variables: {
                        id: el,
                    },
                    fetchPolicy: 'cache-first',
                })
                return response.data
            })
        )

        return concatData.map((tab, index) => {
            const mapData = res[index]?.property[0].map
            if (!mapData) return tab

            const section = findSectionByUnitLabelAndType(
                mapData,
                tab.unitName,
                tab.unitType
            )

            return section
                ? { ...tab, ...section }
                : tab
        })
    } catch (error) {
        console.error('Error fetching or processing data:', error)
    }
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
const StyledSpace = styled(Space)`
    &.condo-space {

        .condo-space-item:first-child {
            align-self: flex-end;
        }
    }
`

const StyledLink = styled(Col)`
    display: flex;
    align-items: center;
    gap: 8px;
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

const ClientAddressCard = ({ onClick, active, property, organization, unitName, floor, unitType, sectionName }) => {
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
        <StyledAddressTabWrapper active={active} onClick={onClick}>
            <StyledAddressTabContent>
                <Space size={8} direction='vertical'>
                    <Typography.Paragraph
                        size='large'
                        ellipsis={{ rows: 1 }}
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

                    { floor || sectionName || unitName ? (
                        <Row style={{ gap: 4 }}>
                            <Typography.Text
                                ref={addressStreetRef}
                                ellipsis={addressStreetEllipsis}
                                title={streetMessage}
                                strong
                            >
                                {unitNamePrefix} {unitName}
                            </Typography.Text>

                            {sectionName && floor && (
                                <Typography.Text type='secondary'>
                                        ({SectionMessage} {sectionName}, {FloorMessage} {floor})
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
            </StyledAddressTabContent>
        </StyledAddressTabWrapper>
    )
}
//#endregion

//#region Contact and Not resident client Tab content
const ClientContent: React.FC<ClientContactPropsType> = ({ lastTicket, contact, type, showOrganizationMessage, phone }) => {
    const intl = useIntl()
    const CallRecordsLogMessage = intl.formatMessage({ id: 'pages.clientCard.callRecordsLog' })
    const ContactMessage = intl.formatMessage({ id: 'Contact' })
    const NotResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.isResidentContact.false' })
    const EmployeeMessage = intl.formatMessage({ id: 'Employee' })

    const isEmployee = contact?.isEmployee

    const name = useMemo(
        () => contact?.name ?? lastTicket?.clientName,
        [contact, lastTicket]
    )

    const email = useMemo(() => contact?.email, [contact?.email])

    const organizationName = useMemo(
        () => contact?.organization?.name ?? lastTicket?.organization?.name,
        [contact?.organization?.name, lastTicket?.organization?.name]
    )

    const propertyId = useMemo(
        () => contact?.property?.id ?? lastTicket?.property?.id ?? null,
        [contact?.property?.id, lastTicket?.property?.id]
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
                    <StyledSpace size={24} direction='horizontal' >
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
                    </StyledSpace>
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
    sectionName,
    type,
    sectionType,
}) => {
    const intl = useIntl()
    const ShowAllPropertyTicketsMessage = intl.formatMessage({ id: 'pages.clientCard.showAllPropertyTickets' })
    const CreateTicketMessage = intl.formatMessage({ id: 'CreateTicket' })
    const EditContactMessage = intl.formatMessage({ id: 'pages.clientCard.editContact' })
    const LastTicketsLoadedMessage = intl.formatMessage({ id: 'pages.clientCard.lastTicketsLoaded' }, { count: MAX_TABLE_SIZE })
    const OpenAllTicketsMessage = intl.formatMessage({ id: 'pages.clientCard.openAllTickets' })

    const tabsItems: tabsItems = useMemo(()=>tableTabs.map(el => ({
        label: intl.formatMessage({ id: `pages.clientCard.table.tabs.${el}` }),
        key: el,
    })), [intl])

    const [currentTableTab, setCurrentTableTab] = useState<TableTabs>('address')

    const router = useRouter()

    const { offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const searchQuery = useMemo(() => {
        if (currentTableTab === 'entrance') {
            return { ...searchTicketsQuery, contact: undefined, unitName: undefined, unitType: undefined,  sectionName, sectionType }
        }

        if (currentTableTab === 'home') {
            return { ...searchTicketsQuery, contact: undefined, unitName: undefined, unitType: undefined }
        }

        return searchTicketsQuery
    }, [searchTicketsQuery, currentTableTab])

    const { data: ticketsQuery, loading: isTicketsFetching } = useGetTicketsQuery({
        variables: {
            where: searchQuery,
            first: MAX_TABLE_SIZE,
            sortBy: TICKET_SORT_BY,
            skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
        },
        fetchPolicy: 'cache-first',
    })
    const tickets = ticketsQuery?.tickets

    const total = tickets?.length

    const lastCreatedTicket = tickets?.[0]
    const propertyId = useMemo(() => property?.id, [property])
    const organizationId = useMemo(() => organization?.id, [organization])

    const columns = useClientCardTicketTableColumns(tickets, currentTableTab)

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

    const onChangeTabs = (tab) => {
        setCurrentTableTab(tab)
    }

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
                            <Row>
                                <Tabs
                                    onChange={onChangeTabs}
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
                                                    <StyledLink>
                                                        <ExternalLink size='auto'/>

                                                        {OpenAllTicketsMessage}
                                                    </StyledLink>
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
    sectionName,
    sectionType,
    canManageContacts,
    organization,
    showOrganizationMessage = false,
}) => {
    const router = useRouter()

    const searchTicketsQuery = useMemo(() => ({
        property: { id: property.id },
        unitName,
        unitType,
        contact: { id: contact.id },
    }), [contact, property, unitName, unitType])

    const handleTicketCreateClick = useCallback(async () => {
        const initialValues = {
            property: property?.id,
            unitName,
            unitType,
            contact: contact?.id,
            clientName: contact?.name,
            clientPhone: contact?.phone,
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
            type={type}
            sectionType={sectionType}
            sectionName={sectionName}
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
    sectionName,
    sectionType,
    phone,
    type,
    organization,
    showOrganizationMessage = false,
}) => {
    const router = useRouter()

    const searchTicketsQuery = useMemo(() => ({
        property: { id: property?.id },
        unitName,
        unitType,
        clientPhone: phone,
        clientName_not: null,
        isResidentTicket: false,
    }), [phone, property, unitName, unitType])

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
            phone={phone}
            property={property}
            type={type}
            sectionName={sectionName}
            sectionType={sectionType}
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
            type={ClientType.Resident }
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
        const { type, property: propertyId, unitName, unitType } = parseCardDataFromQuery(tab)
        const tabDataWithProperty = tabsData.find(({ property, unitName: tabUnitName, unitType: tabUnitType }) =>
            property.id === propertyId && tabUnitName === unitName && tabUnitType === unitType)
        const property = tabDataWithProperty?.property
        const organization = tabDataWithProperty?.organization
        const contact = tabDataWithProperty?.contact

        if (property) {
            setActiveTabData({ type, property, unitName, unitType, organization, contact, sectionType: contact?.sectionType, sectionName: contact?.sectionName })
        }
    }, [tab, tabsData])

    const handleTabChange = useCallback(async (newKey) => {
        const newRoute = `${router.route.replace('[number]', phoneNumber)}?tab=${newKey}`

        return router.push(newRoute, undefined, { shallow: true })
    }, [phoneNumber, router])

    const renderedCards = useMemo(() => {
        const addressTabs = tabsData.map(({ type, property, unitName, floor, unitType, organization, sectionType, sectionName }, index) => {
            const key = getClientCardTabKey(property?.id, type, unitName, unitType, sectionType, sectionName)
            const isActive = tab && tab === key

            if (isActive) {
                activeTabIndexRef.current = canManageContacts ? index + 1 : index
            }

            return <ClientAddressCard
                onClick={() => handleTabChange(key)}
                organization={organization}
                key={key}
                floor={floor}
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
                                    <StyledLink>
                                        <PlusCircleOutlined/>

                                        {AddAddressMessage}
                                    </StyledLink>
                                </Typography.Link>
                            </Row>
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
    const phoneNumber = router?.query.number as string

    const { data: contactsQueryData, loading: contactsLoading } = useGetContactForClientCardQuery({
        variables: {
            where: {
                ...organizationQuery,
                phone: phoneNumber,
            },
            first: 100,
        },
        fetchPolicy: 'cache-first',
    })

    const { data: ticketsQueryData, loading: ticketsLoading } = useGetTicketsQuery({
        variables: {
            where: {
                ...ticketsQuery,
                clientPhone: phoneNumber,
                isResidentTicket: false,
                contact_is_null: true,
            },
            first: 30,
        },
        fetchPolicy: 'cache-first',
    })

    const { data: employeesQueryData, loading: employeesLoading } = useGetEmployeesForClientCardQuery({
        variables: {
            where: {
                ...organizationQuery,
                phone: phoneNumber,
            },
            first: 50,
        },
        fetchPolicy: 'cache-first',
    })

    const [getPropertyWithMapById] = useGetPropertyWithMapByIdLazyQuery()

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

        getMapData(concatData, getPropertyWithMapById).then(res => setTabsData(res))
    }, [getPropertyWithMapById, findSectionByUnitLabelAndType, contactsQueryData, notResidentTickets, employeeTickets])

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
            loading={ticketsLoading || contactsLoading || employeesLoading}
            showOrganizationMessage={showOrganizationMessage}
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
