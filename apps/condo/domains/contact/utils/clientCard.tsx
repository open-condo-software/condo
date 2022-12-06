import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { gql } from 'graphql-tag'
import { get } from 'lodash'
import { NextRouter } from 'next/router'
import qs from 'qs'
import React from 'react'

import Select from '@condo/domains/common/components/antd/Select'
import { colors, fontSizes } from '@condo/domains/common/constants/style'
import { TICKET_PROPERTY_FIELDS } from '@condo/domains/ticket/gql'
import { getAddressRender } from '@condo/domains/ticket/utils/clientSchema/Renders'
import { renderPhone } from '@condo/domains/common/utils/Renders'
import { useIntl } from '@open-condo/next/intl'
import { BuildingUnitSubType } from '@app/condo/schema'

export enum ClientType {
    Resident,
    NotResident,
    Employee,
}

const SEARCH_BY_PHONE = gql`
    query searchByPhone ($organizationId: ID, $phone: String, $ticketsWhere: TicketWhereInput) {
        contacts: allContacts(
          where: {
            organization: { id: $organizationId },
            property_is_null: false,
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
            clientPhone_contains: phone,
            isResidentTicket: false,
            clientPhone_not: null,
            clientName_not: null,
        }
        const { data, error } = await _search(client, SEARCH_BY_PHONE, { phone, organizationId, ticketsWhere })

        if (error) console.warn(error)

        const employees = []
        const contacts = data.contacts.map(({ id, phone, property, unitName, unitType }) => ({
            value: id, phone, property, unitName, unitType, type: ClientType.Resident,
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
                    type: ClientType.NotResident,
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
            type: ClientType.NotResident,
        }))

        return [...contacts, ...tickets, ...employees]
    }
}

const SELECT_OPTION_ROW_GUTTER: [Gutter, Gutter] = [120, 0]
const LINK_STYLES = { fontSize: fontSizes.label, color: colors.black }

const SearchByPhoneSelectOption = ({ phone, property, unitName, unitType, type }) => {
    const intl = useIntl()
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const ShortFlatMessage = intl.formatMessage({ id: 'field.ShortFlatNumber' })
    const ParkingMessage = intl.formatMessage({ id: 'field.UnitType.prefix.parking' })

    const prefix = unitType === BuildingUnitSubType.Parking ? ParkingMessage : ShortFlatMessage
    const unitNameMessage = unitName && ` ${prefix} ${unitName}`

    return (
        <Typography.Link href={`/phone/${phone}?tab=${getClientCardTabKey(get(property, 'id'), type, unitName, unitType)}`} style={LINK_STYLES}>
            <Row gutter={SELECT_OPTION_ROW_GUTTER}>
                <Col>
                    <Typography.Text strong>
                        {renderPhone(phone)}
                    </Typography.Text>

                </Col>
                <Col>
                    {property ? getAddressRender(property, unitNameMessage) : DeletedMessage}
                </Col>
            </Row>
        </Typography.Link>
    )
}

export const mapSearchItemToOption = (item, phone, type) => (
    <Select.Option key={item.value} value={phone} title={phone}>
        <SearchByPhoneSelectOption {...item} key={item.value} type={type} />
    </Select.Option>
)

export const getClientCardTabKey = (propertyId: string, type: ClientType, unitName?: string, unitType?: string): string => {
    const keyData = { property: propertyId, unitName, unitType, type }

    return JSON.stringify(keyData)
}

type RedirectToFormArgsType = {
    router: NextRouter,
    formRoute: string,
    initialValues?: Record<string, unknown>,
}
type RedirectToFormType = (args: RedirectToFormArgsType) => Promise<void>

export const redirectToForm: RedirectToFormType = async ({
    router,
    formRoute,
    initialValues,
}) => {
    const query = qs.stringify(
        {
            initialValues: initialValues ? JSON.stringify(initialValues) : null,
            redirectToClientCard: true,
        },
        { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
    )

    await router.push(`${formRoute}${query}`)
}