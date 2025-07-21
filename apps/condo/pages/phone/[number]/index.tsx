import {
    useGetContactForClientCardQuery,
    useGetEmployeesForClientCardQuery,
    useGetTicketsForClientCardQuery,
} from '@app/condo/gql'
import { Col, Row, RowProps } from 'antd'
import { CarouselRef } from 'antd/es/carousel'
import uniqBy from 'lodash/uniqBy'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
import { ClientAddressCard, SearchByAddressCard } from '@condo/domains/ticket/components/ClientCard/ClientAddressCard'
import { ResidentClientTabContent, NotResidentClientTabContent, SearchByAddressTabContent } from '@condo/domains/ticket/components/ClientCard/TabContent'
import { TicketReadPermissionRequired } from '@condo/domains/ticket/components/PageAccess'
import { useTicketVisibility } from '@condo/domains/ticket/contexts/TicketVisibilityContext'
import { ClientCardTab, getClientCardTabKey, parseCardDataFromQuery, redirectToForm, TabDataType } from '@condo/domains/ticket/utils/clientSchema/clientCard'
import { getSectionAndFloorByUnitName } from '@condo/domains/ticket/utils/unit'

import styles from './index.module.css'


const MAX_TABLE_SIZE = 20
const ROW_MEDIUM_GUTTER: RowProps['gutter'] = [0, 40]


const ClientCardPageContent = ({
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
        const { type, property: propertyId, unitName, unitType, sectionType, sectionName } = parseCardDataFromQuery(tab)
        if (type === ClientCardTab.SearchByAddress) {
            setActiveTabData({ type } as TabDataType)
            return
        }

        const isClientTabSelected = unitName || unitType
        let initialTabData
        if (isClientTabSelected) {
            initialTabData = tabsData?.find(tab => (
                tab.property.id === propertyId &&
                tab.unitName === unitName &&
                tab.unitType === unitType
            ))
        } else {
            initialTabData = tabsData?.[0]
        }
        const property = initialTabData?.property
        const organization = initialTabData?.organization
        const contact = initialTabData?.contact
        const tabSectionType = sectionType ?? initialTabData?.sectionType
        const tabSectionName = sectionName ?? initialTabData?.sectionName
        const tabUnitName = unitName ?? initialTabData?.unitName
        const tabUnitType = unitType ?? initialTabData?.unitType
        const tabType = type ?? initialTabData?.type
        const name = initialTabData?.name
        const email = initialTabData?.email

        if (property) {
            const key = getClientCardTabKey(property?.id, tabType, tabUnitName, tabUnitType, tabSectionName, tabSectionType)
            const newRoute = `${router.route.replace('[number]', phoneNumber)}?tab=${key}`
            router.push(newRoute, undefined, { shallow: true })

            setActiveTabData({
                type: tabType,
                property,
                unitName: tabUnitName,
                unitType: tabUnitType,
                organization,
                contact,
                sectionType: tabSectionType,
                sectionName: tabSectionName,
                name,
                email,
            })
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
    }, [handleTabChange, tabsData, tab])

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
                canManageContacts={canManageContacts}
                firstClientData={firstClientData}
                showOrganizationMessage={showOrganizationMessage}
            />
        )
    }, [activeTabData, canManageContacts, showOrganizationMessage, tabsData])

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
                            <Row justify='space-between' align='bottom' >
                                <Typography.Title>{ClientCardHeader}</Typography.Title>
                                {
                                    tabsData.length === 0 && (
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

export const ClientCardPageContentWrapper = ({
    organizationQuery,
    allQueriesLoading,
    ticketsQuery,
    canManageContacts,
    showOrganizationMessage = false,
    usePhonePrefix = false,
}) => {
    const router = useRouter()
    const phoneNumber = router?.query.number

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

    useEffect(() => {
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
        const employeesData = uniqBy(employeeTickets?.map(ticket => ({
            type: ClientCardTab.NotResident,
            isEmployee: true,
            property: ticket.property,
            unitName: ticket.unitName,
            unitType: ticket.unitType,
            organization: ticket.organization,
            name: ticket?.clientName,
            email: ticket?.clientEmail,
        })), 'property.id') || []

        const clientData: TabDataType[] = [...contactsData, ...notResidentData, ...employeesData]
            .filter(tabsData => tabsData.organization && tabsData.property)
        const clientDataWithSectionAndFloorData = clientData.map((tab) => {
            if (tab.unitName && tab.unitType && tab.floorName) return tab
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
            phoneNumberPrefix={phoneNumberPrefix}
            tabsData={tabsData}
            canManageContacts={canManageContacts}
            showOrganizationMessage={showOrganizationMessage}
            loading={ticketsLoading || contactsLoading || employeesLoading}
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
            organizationQuery={organizationQuery}
            allQueriesLoading={ticketFilterQueryLoading || isLoading}
            ticketsQuery={ticketsQuery}
            canManageContacts={canManageContacts}
        />
    )
}

ClientCardPage.requiredAccess = TicketReadPermissionRequired

export default ClientCardPage
