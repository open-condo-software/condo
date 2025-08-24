import {
    BuildingUnitSubType,
    Contact as ContactType,
    Organization as OrganizationType,
    Property,
} from '@app/condo/schema'
import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { gql } from 'graphql-tag'
import { get } from 'lodash'
import { NextRouter } from 'next/router'
import qs from 'qs'
import { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { SelectProps, Typography } from '@open-condo/ui'

import Select from '@condo/domains/common/components/antd/Select'
import { useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { renderPhone } from '@condo/domains/common/utils/Renders'
import { TICKET_PROPERTY_FIELDS } from '@condo/domains/ticket/gql'
import { getAddressRender } from '@condo/domains/ticket/utils/clientSchema/Renders'


export enum ClientCardTab {
    Resident,
    NotResident,
    Employee,
    SearchByAddress,
}

export type TabDataType = {
    type: ClientCardTab
    name?: string
    property?: Pick<Property, 'id' | 'address'>
    unitName?: string
    unitType?: string
    sectionType?: string
    sectionName?: string
    floorName?: string
    organization?: Pick<OrganizationType, 'id' | 'name' | 'phoneNumberPrefix'>
    contact?: Pick<ContactType, 'name' | 'phone' | 'email' | 'id' | 'organization' | 'property'>
    email?: string
    isEmployee?: boolean
}

export type ClientCardAddressSearchInputType = React.FC<Pick<SelectProps, 'onChange' | 'placeholder'> & { className?: string }>

export type TabsItems = { key: TabKey, label: string }[]

export const CONTACT_PROPERTY_TICKETS_TAB = 'contactPropertyTickets'
export const RESIDENTS_PROPERTY_TICKETS_TAB = 'residentsPropertyTickets'
export const RESIDENTS_ENTRANCE_TICKETS_TAB = 'residentsEntranceTickets'
export type TabKey = 
  | typeof CONTACT_PROPERTY_TICKETS_TAB 
  | typeof RESIDENTS_PROPERTY_TICKETS_TAB 
  | typeof RESIDENTS_ENTRANCE_TICKETS_TAB

export const DEFAULT_TABLE_TABS: Array<TabKey> = [CONTACT_PROPERTY_TICKETS_TAB, RESIDENTS_ENTRANCE_TICKETS_TAB, RESIDENTS_PROPERTY_TICKETS_TAB]

const SEARCH_BY_PHONE = gql`
    query searchByPhone ($organizationId: ID, $phone: String, $ticketsWhere: TicketWhereInput) {
        contacts: allContacts(
          where: {
            organization: { id: $organizationId },
            property_is_null: false,
            property: { deletedAt: null },
            phone_contains: $phone
          }, first: 10) {
            id
            name
            phone
            property { ${TICKET_PROPERTY_FIELDS} }
            unitName
            unitType
        }
      
        tickets: allTickets(
          where: $ticketsWhere, first: 10) {
          id
          property { ${TICKET_PROPERTY_FIELDS} }
          clientName
          clientPhone
          unitName
          unitType
          number
      }
      
        employees: allOrganizationEmployees(
          where: {
            organization: { id: $organizationId },
            phone_contains: $phone,
          }, first: 10) {
            id
            name
            phone
        }
    }
`

async function _search (client, query, variables) {
    return await client.query({
        query: query,
        variables: variables,
        fetchPolicy: 'network-only',
    })
}

export function searchByPhone (organizationId, ticketsWhereInput) {
    if (!organizationId || !ticketsWhereInput) return

    return async function (client, phone) {
        const ticketsWhere = {
            ...ticketsWhereInput,
            organization: { id: organizationId },
            property: { deletedAt: null },
            clientPhone_contains: phone,
            isResidentTicket: false,
            clientPhone_not: null,
            clientName_not: null,
        }
        const { data, error } = await _search(client, SEARCH_BY_PHONE, { phone, organizationId, ticketsWhere })

        if (error) console.warn(error)

        const employees = []
        const contacts = data.contacts.map(({ id, phone, property, unitName, unitType }) => ({
            value: id, phone, property, unitName, unitType, type: ClientCardTab.Resident,
        }))
        const tickets = data.tickets.filter(ticket => {
            const employee = data.employees.find(employee => employee.phone === ticket.clientPhone)
            if (employee) {
                employees.push({
                    value: ticket.id,
                    phone: ticket.clientPhone,
                    property: ticket.property,
                    unitName: ticket.unitName,
                    unitType: ticket.unitType,
                    type: ClientCardTab.NotResident,
                    number: ticket.number,
                    isEmployee: true,
                })
            }

            return !employee
        }).map(ticket => ({
            value: ticket.id,
            phone: ticket.clientPhone,
            property: ticket.property,
            unitName: ticket.unitName,
            unitType: ticket.unitType,
            type: ClientCardTab.NotResident,
            number: ticket.number,
        }))

        return [...contacts, ...tickets, ...employees]
    }
}

const SELECT_OPTION_ROW_GUTTER: [Gutter, Gutter] = [120, 0]
const OPTION_STYLES = { padding: '5px 12px 5px 24px' }

const SearchByPhoneSelectOption = ({ phone, property, unitName, unitType, type, number }) => {
    const intl = useIntl()
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const ShortFlatMessage = intl.formatMessage({ id: 'field.ShortFlatNumber' })
    const ParkingMessage = intl.formatMessage({ id: 'field.UnitType.prefix.parking' })
    const TicketMessage = intl.formatMessage({ id: 'Ticket' })

    const prefix = unitType === BuildingUnitSubType.Parking ? ParkingMessage : ShortFlatMessage
    const unitNameMessage = unitName && ` ${prefix} ${unitName}`

    const { breakpoints } = useLayoutContext()

    const handleClick = useCallback(
        () => {
            if (typeof window !== 'undefined') {
                window.open(
                    `/phone/${phone}?tab=${getClientCardTabKey(get(property, 'id'), type, unitName, unitType)}`,
                    '_blank'
                )
            }
        },
        [phone, property, type, unitName, unitType])

    return (
        <Row justify='space-between' style={OPTION_STYLES} onClick={handleClick}>
            <Col span={!breakpoints.TABLET_LARGE ? 24 : 21}>
                <Row gutter={SELECT_OPTION_ROW_GUTTER}>
                    <Col>
                        <Typography.Text strong size='medium'>
                            {renderPhone(phone)}
                        </Typography.Text>
                    </Col>
                    <Col span={16}>
                        {property ? getAddressRender(property, unitNameMessage, DeletedMessage, breakpoints.TABLET_LARGE) : DeletedMessage}
                    </Col>
                </Row>
            </Col>
            {
                type !== ClientCardTab.Resident && (
                    <Col span={!breakpoints.TABLET_LARGE ? 24 : 3}>
                        {TicketMessage} №{number}
                    </Col>
                )
            }
        </Row>
    )
}

export const mapSearchItemToOption = (item, phone, type) => (
    <Select.Option key={item.value} value={phone} title={phone}>
        <SearchByPhoneSelectOption {...item} key={item.value} type={type} />
    </Select.Option>
)

export const getClientCardTabKey = (propertyId: string, type: ClientCardTab, unitName?: string, unitType?: string, sectionName?: string, sectionType?: string): string => {
    const keyData = { property: propertyId, unitName, unitType, type, sectionName, sectionType }

    return JSON.stringify(keyData)
}

type RedirectToFormArgsType = {
    router: NextRouter
    formRoute: string
    initialValues?: Record<string, unknown>
    target?: '_self' | '_blank'
}
type RedirectToFormType = (args: RedirectToFormArgsType) => Promise<void>

export const redirectToForm: RedirectToFormType = async ({
    router,
    formRoute,
    initialValues,
    target = '_self',
}) => {
    const query = qs.stringify(
        {
            initialValues: initialValues ? JSON.stringify(initialValues) : null,
            redirectToClientCard: true,
        },
        { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
    )

    const newUrl = `${formRoute}${query}`
    if (target === '_blank') {
        if (typeof window !== 'undefined') {
            window.open(newUrl, '_blank')
        }
    } else {
        await router.push(newUrl)
    }
}

export const parseCardDataFromQuery = (stringCard) => {
    try {
        return JSON.parse(stringCard)
    } catch (e) {
        console.error('Failed to parse card data from query:', e)
        return {}
    }
}