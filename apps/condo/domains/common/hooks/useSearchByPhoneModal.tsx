import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { gql } from 'graphql-tag'
import { get, isEmpty } from 'lodash'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'

import { useIntl } from '@condo/next/intl'

import { Modal } from '@condo/domains/common/components/Modal'
import Select from '@condo/domains/common/components/antd/Select'
import { getAddressRender } from '@condo/domains/ticket/utils/clientSchema/Renders'
import { Button } from '@condo/domains/common/components/Button'
import { fontSizes, colors } from '@condo/domains/common/constants/style'
import { useOrganization } from '@condo/next/organization'
import { GraphQlSearchInput } from '../components/GraphQlSearchInput'
import { TICKET_PROPERTY_FIELDS } from '@condo/domains/ticket/gql'

const SELECT_OPTION_ROW_GUTTER: [Gutter, Gutter] = [120, 0]
const NOT_FOUND_CONTENT_ROW_GUTTERS: [Gutter, Gutter] = [20, 0]
const LINK_STYLES = { fontSize: fontSizes.label, color: colors.black }

const mapToOption = (id, phone, property, unitName, type, router, DeletedMessage) => (
    <Select.Option key={id} value={id} title={phone}>
        <Typography.Link href={`/phone/${phone}?tab=${property.id}-${unitName}-${type}`} style={LINK_STYLES}>
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

const NotFoundSearchByPhoneContent = ({ onSelect }) => {
    const intl = useIntl()
    const NotFoundContentMessage = intl.formatMessage({ id: 'SearchByPhoneNumber.modal.select.notFoundContent' })
    const CreateTicketMessage = intl.formatMessage({ id: 'SearchByPhoneNumber.modal.select.notFoundContent.createTicket' })
    const CreateContactMessage = intl.formatMessage({ id: 'SearchByPhoneNumber.modal.select.notFoundContent.createContact' })

    const router = useRouter()
    const handleCreateTicketButtonClick = useCallback(() => {
        router.push('/ticket/create')
        onSelect()
    }, [onSelect, router])
    const handleCreateContactButtonClick = useCallback(() => {
        router.push('/ticket/create')
        onSelect()
    }, [router])

    return (
        <>
            <Typography.Paragraph>
                {NotFoundContentMessage}
            </Typography.Paragraph>
            <Row gutter={NOT_FOUND_CONTENT_ROW_GUTTERS}>
                <Col>
                    <Button
                        type='sberDefaultGradient'
                        onClick={handleCreateTicketButtonClick}
                    >
                        {CreateTicketMessage}
                    </Button>
                </Col>
                <Col>
                    <Button
                        type='sberDefaultGradient'
                        secondary
                        onClick={handleCreateContactButtonClick}
                    >
                        {CreateContactMessage}
                    </Button>
                </Col>
            </Row>
        </>
    )
}

async function _search (client, query, variables) {
    return await client.query({
        query: query,
        variables: variables,
        fetchPolicy: 'network-only',
    })
}

const SEARCH_BY_PHONE = gql`
    query searchByPhone ($organizationId: ID, $phone: String) {
        contacts: allContacts(
          where: {
            organization: { id: $organizationId },
            phone_contains: $phone
          }) {
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
        }) {
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
          }) {
            id
            name
            phone
        }
    }
`

export enum ClientType {
    Contact,
    NotResident,
    Employee,
}

export function searchByPhone (organizationId) {
    if (!organizationId) return

    return async function (client, phone) {
        const { data, error } = await _search(client, SEARCH_BY_PHONE, { phone, organizationId })

        if (error) console.warn(error)

        const employees = []
        const contacts = data.contacts.map(({ id, phone, property, unitName }) => ({
            value: id, phone, property, unitName, type: ClientType.Contact,
        }))
        const tickets = data.tickets.filter(ticket => {
            const employee = data.employees.find(employee => employee.phone === ticket.clientPhone)
            if (employee) {
                employees.push({
                    value: ticket.id, phone: ticket.clientPhone, property: ticket.property, unitName: ticket.unitName, type: ClientType.Employee,
                })
                return false
            } else return true
        }).map(ticket => ({
            value: ticket.id, phone: ticket.clientPhone, property: ticket.property, unitName: ticket.unitName, type: ClientType.NotResident,
        }))

        return [...contacts, ...tickets, ...employees]
    }
}

const SELECT_STYLES = { width: '100%' }
const SEARCH_ICON_STYLES = { fontSize: fontSizes.content }

const SearchByPhoneSelect = ({
    baseSearchByPhoneQuery,
    onSelect,
}) => {
    const intl = useIntl()
    const EnterPhoneMessage = intl.formatMessage({ id: 'EnterPhoneNumber' })
    const ResidentsOptGroupMessage = intl.formatMessage({ id: 'SearchByPhoneNumber.modal.select.residents' })
    const NotResidentsOptGroupMessage = intl.formatMessage({ id: 'SearchByPhoneNumber.modal.select.notResidents' })
    const EmployeesOptGroupMessage = intl.formatMessage({ id: 'SearchByPhoneNumber.modal.select.employees' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })

    const router = useRouter()
    const { organization } = useOrganization()

    const renderOptions = useCallback((items) => {
        const resultOptions = []
        const contactOptions = items
            .filter(item => item.type === ClientType.Contact)
            .map(item => mapToOption(item.value, item.phone, item.property, item.unitName, ClientType.Contact, router, DeletedMessage))
        const notResidentOptions = items
            .filter(item => item.type === ClientType.NotResident)
            .map(item => mapToOption(item.value, item.phone, item.property, item.unitName, ClientType.NotResident, router, DeletedMessage))
        const employeeOptions = items
            .filter(item => item.type === ClientType.Employee)
            .map(item => mapToOption(item.value, item.phone, item.property, item.unitName, ClientType.Employee, router, DeletedMessage))

        if (!isEmpty(contactOptions)) {
            resultOptions.push(
                <Select.OptGroup label={ResidentsOptGroupMessage}>
                    {contactOptions}
                </Select.OptGroup>
            )
        }

        if (!isEmpty(notResidentOptions)) {
            resultOptions.push(
                <Select.OptGroup label={NotResidentsOptGroupMessage}>
                    {notResidentOptions}
                </Select.OptGroup>
            )
        }

        if (!isEmpty(employeeOptions)) {
            resultOptions.push(
                <Select.OptGroup label={EmployeesOptGroupMessage}>
                    {employeeOptions}
                </Select.OptGroup>
            )
        }

        return resultOptions
    }, [DeletedMessage, EmployeesOptGroupMessage, NotResidentsOptGroupMessage, ResidentsOptGroupMessage, router])

    return (
        <GraphQlSearchInput
            search={searchByPhone(get(organization, 'id', null))}
            suffixIcon={<SearchOutlined style={SEARCH_ICON_STYLES}/>}
            showSearch={true}
            style={SELECT_STYLES}
            placeholder={EnterPhoneMessage}
            notFoundContent={<NotFoundSearchByPhoneContent onSelect={onSelect} />}
            renderOptions={renderOptions}
            optionFilterProp='title'
        />
    )
}

export const useSearchByPhoneModal = (baseSearchByPhoneQuery) => {
    const intl = useIntl()
    const SearchByPhoneMessage = intl.formatMessage({ id: 'SearchByPhoneNumber' })

    const [isSearchByPhoneModalVisible, setIsSearchByPhoneModalVisible] = useState<boolean>(false)

    const handleCloseModal = useCallback(() => setIsSearchByPhoneModalVisible(false), [])

    const SearchByPhoneModal = useMemo(() => (
        <Modal
            visible={isSearchByPhoneModalVisible}
            title={SearchByPhoneMessage}
            onCancel={handleCloseModal}
            footer={null}
            width={1150}
        >
            <SearchByPhoneSelect
                baseSearchByPhoneQuery={baseSearchByPhoneQuery}
                onSelect={handleCloseModal}
            />
        </Modal>
    ), [SearchByPhoneMessage, baseSearchByPhoneQuery, handleCloseModal, isSearchByPhoneModalVisible])

    return { isSearchByPhoneModalVisible, setIsSearchByPhoneModalVisible, SearchByPhoneModal }
}
