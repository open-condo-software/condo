import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { gql } from 'graphql-tag'
import { NextRouter } from 'next/router'
import qs from 'qs'
import React from 'react'

import Select from '@condo/domains/common/components/antd/Select'
import { colors, fontSizes } from '@condo/domains/common/constants/style'
import { TICKET_PROPERTY_FIELDS } from '@condo/domains/ticket/gql'
import { getAddressRender } from '@condo/domains/ticket/utils/clientSchema/Renders'

export enum ClientType {
    Resident,
    NotResident,
}

const SEARCH_BY_PHONE = gql`
    query searchByPhone ($organizationId: ID, $phone: String) {
        contacts: allContacts(
          where: {
            organization: { id: $organizationId },
            phone_contains: $phone
          }, first: 10) {
            id
            name
            phone
            property { ${TICKET_PROPERTY_FIELDS} }
            unitName
        }
      
        tickets: allTickets(
          where: {
            organization: { id: $organizationId },
            clientPhone_contains: $phone,
            isResidentTicket: false,
            clientPhone_not: null,
            clientName_not: null,
        }, first: 10) {
          id
          property { ${TICKET_PROPERTY_FIELDS} }
          clientName
          clientPhone
          unitName
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

export function searchByPhone (organizationId) {
    if (!organizationId) return

    return async function (client, phone) {
        const { data, error } = await _search(client, SEARCH_BY_PHONE, { phone, organizationId })

        if (error) console.warn(error)

        const employees = []
        const contacts = data.contacts.map(({ id, phone, property, unitName }) => ({
            value: id, phone, property, unitName, type: ClientType.Resident,
        }))
        const tickets = data.tickets.filter(ticket => {
            const employee = data.employees.find(employee => employee.phone === ticket.clientPhone)
            if (employee) {
                employees.push({
                    value: ticket.id,
                    phone: ticket.clientPhone,
                    property: ticket.property,
                    unitName: ticket.unitName,
                    type: ClientType.NotResident,
                    isEmployee: true,
                })
                return false
            } else return true
        }).map(ticket => ({
            value: ticket.id,
            phone: ticket.clientPhone,
            property: ticket.property,
            unitName: ticket.unitName,
            type: ClientType.NotResident,
        }))

        return [...contacts, ...tickets, ...employees]
    }
}

const SELECT_OPTION_ROW_GUTTER: [Gutter, Gutter] = [120, 0]
const LINK_STYLES = { fontSize: fontSizes.label, color: colors.black }
export const mapToSelectOption = ({ id, phone, property, unitName, type, DeletedMessage }) => (
    <Select.Option key={id} value={id} title={phone}>
        <Typography.Link href={`/phone/${phone}?tab=${getClientCardTabKey(property.id, type, unitName)}`} style={LINK_STYLES}>
            <Row gutter={SELECT_OPTION_ROW_GUTTER}>
                <Col>
                    {phone}
                </Col>
                <Col>
                    {property ? getAddressRender(property) : DeletedMessage}
                </Col>
            </Row>
        </Typography.Link>
    </Select.Option>
)

export const getClientCardTabKey = (propertyId: string, type: ClientType, unitName: string): string =>
    `${propertyId}-${unitName ? unitName : ''}-${type}`

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