import {
    useGetContactForClientCardQuery,
    useGetEmployeesForClientCardQuery,
    useGetTicketsForClientCardQuery,
} from '@app/condo/gql'
import { ContactWhereInput, TicketWhereInput } from '@app/condo/schema'
import { Col, Row, RowProps } from 'antd'
import { CarouselRef } from 'antd/es/carousel'
import isEqual from 'lodash/isEqual'
import uniqBy from 'lodash/uniqBy'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { PlusCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Carousel, Typography } from '@open-condo/ui'

import { PageContent, PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { Loader } from '@condo/domains/common/components/Loader'
import { PageComponentType } from '@condo/domains/common/types'
import { renderPhone } from '@condo/domains/common/utils/Renders'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'
import { ClientAddressCard, SearchByAddressCard } from '@condo/domains/ticket/components/ClientCard/ClientAddressCard'
import { ResidentClientTabContent, NotResidentClientTabContent, SearchByAddressTabContent } from '@condo/domains/ticket/components/ClientCard/TabContent'
import { TicketReadPermissionRequired } from '@condo/domains/ticket/components/PageAccess'
import { useTicketVisibility } from '@condo/domains/ticket/contexts/TicketVisibilityContext'
import { ClientCardAddressSearchInputType, ClientCardTab, getClientCardTabKey, parseCardDataFromQuery, redirectToForm, TabDataType } from '@condo/domains/ticket/utils/clientSchema/clientCard'
import { getSectionAndFloorByUnitName } from '@condo/domains/ticket/utils/unit'

import styles from './index.module.css'


const MAX_TABLE_SIZE = 20
const SMALL_GUTTER: RowProps['gutter'] = [0, 12]
const ROW_MEDIUM_GUTTER: RowProps['gutter'] = [0, 40]


interface IClientCardPageContentProps {
    AddressSearchInput: ClientCardAddressSearchInputType
    tabsData: TabDataType[]
    canManageContacts?: boolean
    loading?: boolean
    showOrganizationMessage?: boolean   
    phoneNumberPrefix?: string
}

const ClientCardPageContent: React.FC<IClientCardPageContentProps> = ({
    AddressSearchInput,
    tabsData,
    canManageContacts,
    loading,
    showOrganizationMessage = false,
    phoneNumberPrefix,
}) => {
    const intl = useIntl()
    const router = useRouter()
    const phoneNumber = router?.query.number as string
    const { tab } = parseQuery(router.query)

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
        // Set initial tab if it is not set
        if (tabsData.length > 0 && !tab) {
            const initialTabKey = getClientCardTabKey(
                tabsData[0].property?.id,
                tabsData[0].type,
                tabsData[0].unitName,
                tabsData[0].unitType,
                tabsData[0].sectionName,
                tabsData[0].sectionType,
            )
            const newRoute = `${router.route.replace('[number]', phoneNumber)}?tab=${initialTabKey}`
            router.push(newRoute, undefined, { shallow: true })
        }
    }, [phoneNumber, router, tab, tabsData])

    useDeepCompareEffect(() => {
        const { type, property: propertyId, unitName, unitType, sectionType, sectionName } = parseCardDataFromQuery(tab)
        if (type === ClientCardTab.SearchByAddress) {
            setActiveTabData({ type } as TabDataType)
            return
        }
        if (!propertyId) {
            return
        }

        const selectedTabData = tabsData?.find(tab => (
            tab.property?.id === propertyId &&
                tab?.unitName === unitName &&
                tab?.unitType === unitType
        ))
        if (isEqual(selectedTabData, activeTabData)) {
            return 
        }
        const property = selectedTabData?.property
        const tabSectionType = sectionType ?? selectedTabData?.sectionType
        const tabSectionName = sectionName ?? selectedTabData?.sectionName
        const tabUnitName = unitName ?? selectedTabData?.unitName
        const tabUnitType = unitType ?? selectedTabData?.unitType
        const tabType = type ?? selectedTabData?.type

        if (property) {
            const key = getClientCardTabKey(property?.id, tabType, tabUnitName, tabUnitType, tabSectionName, tabSectionType)
            const newRoute = `${router.route.replace('[number]', phoneNumber)}?tab=${key}`
            router.push(newRoute, undefined, { shallow: true })

            setActiveTabData(selectedTabData)
        }
    }, [tab, tabsData, phoneNumber, router])

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
                activeTabIndexRef.current = index
            }

            return (
                <ClientAddressCard
                    onClick={() => handleTabChange(key)}
                    organization={organization}
                    key={key}
                    floorName={floorName}
                    property={property}
                    unitName={unitName}
                    unitType={unitType}
                    sectionName={sectionName}
                    active={isActive}
                    showOrganizationMessage={showOrganizationMessage}
                />
            )
        }).filter(Boolean)

        if (addressTabs.length > 0) {
            const key = getClientCardTabKey(undefined, ClientCardTab.SearchByAddress)

            return [
                ...addressTabs,
                <SearchByAddressCard
                    active={tab === key}
                    onClick={() => handleTabChange(key)}
                    key={key}
                />,
            ]
        }

        return []
    }, [tabsData, tab, showOrganizationMessage, handleTabChange])

    const redirectToCreateContact = useCallback(() => redirectToForm({
        router,
        formRoute: '/contact/create',
        initialValues: {
            phone: phoneNumber,
        },
    }), [phoneNumber, router])
        
    const ActiveTabContent = useMemo(() => {
        const type = activeTabData?.type
        const firstClientData = tabsData?.[0]

        if (type === ClientCardTab.Resident) {
            return (
                <ResidentClientTabContent
                    tabData={activeTabData}
                    canManageContacts={canManageContacts}
                    showOrganizationMessage={showOrganizationMessage}
                />
            )
        }

        if (type === ClientCardTab.NotResident || type === ClientCardTab.Employee) {
            return (
                <NotResidentClientTabContent
                    tabData={activeTabData}
                    showOrganizationMessage={showOrganizationMessage}
                />
            )
        }

        return (
            <SearchByAddressTabContent
                AddressSearchInput={AddressSearchInput}
                canManageContacts={canManageContacts}
                firstClientData={firstClientData}
                showOrganizationMessage={showOrganizationMessage}
            />
        )
    }, [AddressSearchInput, activeTabData, canManageContacts, showOrganizationMessage, tabsData])

    if (loading) {
        return <Loader />
    }

    return (
        <>
            <Head>
                <title>{ClientCardTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={ROW_MEDIUM_GUTTER}> 
                        <Col span={24}>
                            <Row justify='space-between' align='middle' gutter={SMALL_GUTTER}>
                                <Col>
                                    <Typography.Title>{ClientCardHeader}</Typography.Title>
                                </Col>
                                {
                                    tabsData.length === 0 && (
                                        <Col>
                                            <Button 
                                                onClick={redirectToCreateContact}
                                                type='primary'
                                                size='large'
                                                id='ClientCardCreateContactButton'
                                                minimal
                                                compact
                                                icon={<PlusCircle />}
                                            >
                                                {AddAddressMessage}
                                            </Button>
                                        </Col>
                                    )
                                }    
                            </Row>
                        </Col> 
                        <Col span={24}>
                            <Row gutter={ROW_MEDIUM_GUTTER}>
                                {
                                    tabsData.length > 0 && (
                                        <Col span={24} className={styles.customCarouselWrapper}>
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
                                    {ActiveTabContent}
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

interface IClientCardPageContentWrapperProps {
    AddressSearchInput: ClientCardAddressSearchInputType
    organizationQuery?: ContactWhereInput
    allQueriesLoading?: boolean
    ticketsQuery?: TicketWhereInput
    canManageContacts?: boolean
    showOrganizationMessage?: boolean
    usePhonePrefix?: boolean
}

export const ClientCardPageContentWrapper: React.FC<IClientCardPageContentWrapperProps> = ({
    AddressSearchInput,
    organizationQuery,
    allQueriesLoading,
    ticketsQuery,
    canManageContacts,
    showOrganizationMessage = false,
    usePhonePrefix = false,
}) => {
    const router = useRouter()
    const phoneNumber = router?.query.number as string

    const { persistor } = useCachePersistor()

    const { data: contactsQueryData, loading: contactsLoading } = useGetContactForClientCardQuery({
        variables: {
            where: {
                ...organizationQuery,
                phone: phoneNumber,
            },
            first: MAX_TABLE_SIZE,
        },
        skip: !persistor || allQueriesLoading || !phoneNumber,
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
        skip: !persistor || allQueriesLoading || !phoneNumber,
    })

    const { data: employeesQueryData, loading: employeesLoading } = useGetEmployeesForClientCardQuery({
        variables: {
            where: {
                ...organizationQuery,
                phone: phoneNumber,
            },
            first: MAX_TABLE_SIZE,
        },
        skip: !persistor || allQueriesLoading || !phoneNumber,
    })

    const employeeTickets = useMemo(() =>
        ticketsQueryData?.tickets.filter(ticket => !!employeesQueryData?.employees?.find(employee => employee.phone === ticket.clientPhone)),
    [employeesQueryData, ticketsQueryData])
    const notResidentTickets = useMemo(() =>
        ticketsQueryData?.tickets.filter(ticket => !employeeTickets.find(employeeTicket => employeeTicket.id === ticket.id)),
    [employeeTickets, ticketsQueryData])

    const [tabsData, setTabsData] = useState<TabDataType[]>([])

    useDeepCompareEffect(() => {
        const contactsData = contactsQueryData?.contacts?.map(contact => ({
            type: ClientCardTab.Resident,
            property: contact.property,
            unitName: contact.unitName,
            unitType: contact.unitType,
            organization: contact.organization,
            contact: contact,
            name: contact?.name,
            email: contact?.email,
        })) || []
        const notResidentData = uniqBy(notResidentTickets?.map(ticket => ({
            type: ClientCardTab.NotResident,
            property: ticket.property,
            unitName: ticket.unitName,
            unitType: ticket.unitType,
            sectionName: ticket.sectionName,
            sectionType: ticket.sectionType,
            floorName: ticket.floorName,
            organization: ticket.organization,
            name: ticket?.clientName,
            email: ticket?.clientEmail,
        })), 'property.id') || []
        const employeesData: TabDataType[] = uniqBy(employeeTickets?.map(ticket => ({
            type: ClientCardTab.NotResident,
            isEmployee: true,
            property: ticket.property,
            unitName: ticket.unitName,
            unitType: ticket.unitType,
            organization: ticket.organization,
            name: ticket?.clientName,
            email: ticket?.clientEmail,
        })), 'property.id') || []

        const clientData = [...contactsData, ...notResidentData, ...employeesData]
            .filter(tabsData => tabsData.organization && tabsData.property) as TabDataType[]
        const clientDataWithSectionAndFloorData = clientData.map((tab) => {
            if (tab.unitName && tab.unitType && tab?.floorName) return tab
            const section = getSectionAndFloorByUnitName(tab.property, tab.unitName, tab.unitType)

            return { ...tab, ...section }
        })

        setTabsData(clientDataWithSectionAndFloorData)
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
            AddressSearchInput={AddressSearchInput}
            phoneNumberPrefix={phoneNumberPrefix}
            tabsData={tabsData}
            canManageContacts={canManageContacts}
            showOrganizationMessage={showOrganizationMessage}
            loading={ticketsLoading || contactsLoading || employeesLoading}
        />
    )
}

const AddressSearchInput = (props) => {
    const { organization } = useOrganization()
    const organizationId = useMemo(() => organization?.id, [organization?.id])
    
    return (
        <PropertyAddressSearchInput
            organizationId={organizationId}
            {...props}
        />
    )
}

const ClientCardPage: PageComponentType = () => {
    const { organization, role, isLoading } = useOrganization()
    const organizationId = organization?.id
    const canManageContacts = role.canManageContacts

    const { ticketFilterQuery, ticketFilterQueryLoading } = useTicketVisibility()
    const organizationQuery = { organization: { id: organizationId } }
    const ticketsQuery = { ...organizationQuery, ...ticketFilterQuery, property: { deletedAt: null } }

    return (
        <ClientCardPageContentWrapper
            AddressSearchInput={AddressSearchInput}
            organizationQuery={organizationQuery}
            allQueriesLoading={ticketFilterQueryLoading || isLoading}
            ticketsQuery={ticketsQuery}
            canManageContacts={canManageContacts}
        />
    )
}

ClientCardPage.requiredAccess = TicketReadPermissionRequired

export default ClientCardPage
