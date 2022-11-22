import { SearchOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { useIntl } from '@open-condo/next/intl'
import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import Select from '@condo/domains/common/components/antd/Select'
import { Button } from '@condo/domains/common/components/Button'
import { GraphQlSearchInput, SearchComponentType } from '@condo/domains/common/components/GraphQlSearchInput'
import { Modal } from '@condo/domains/common/components/Modal'
import { fontSizes } from '@condo/domains/common/constants/style'
import { ClientType, mapToSelectOption, redirectToForm } from '@condo/domains/contact/utils/clientCard'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'

const NOT_FOUND_CONTENT_ROW_GUTTERS: [Gutter, Gutter] = [20, 0]

const NotFoundSearchByPhoneContent = ({ onSelect, phone, canManageContacts }) => {
    const intl = useIntl()
    const NotFoundContentMessage = intl.formatMessage({ id: 'SearchByPhoneNumber.modal.select.notFoundContent' })
    const CreateTicketMessage = intl.formatMessage({ id: 'SearchByPhoneNumber.modal.select.notFoundContent.createTicket' })
    const CreateContactMessage = intl.formatMessage({ id: 'SearchByPhoneNumber.modal.select.notFoundContent.createContact' })

    const router = useRouter()

    const handleCreateTicketButtonClick = useCallback(async () => {
        await redirectToForm({
            router,
            formRoute: '/ticket/create',
            initialValues: {
                clientPhone: phone,
            },
        })
        onSelect()
    }, [onSelect, phone, router])

    const handleCreateContactButtonClick = useCallback(async () => {
        await redirectToForm({
            router,
            formRoute: '/contact/create',
            initialValues: {
                phone,
            },
        })
        onSelect()
    }, [onSelect, phone, router])

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
                {
                    canManageContacts && (
                        <Col>
                            <Button
                                type='sberDefaultGradient'
                                secondary
                                onClick={handleCreateContactButtonClick}
                            >
                                {CreateContactMessage}
                            </Button>
                        </Col>
                    )
                }
            </Row>
        </>
    )
}

const SELECT_STYLES = { width: '100%' }
const SEARCH_ICON_STYLES = { fontSize: fontSizes.content }
const PHONE_INPUT_MASK = { ru: '... ... .. ..' }

const StyledPhoneInput = styled(PhoneInput)`
  & .ant-input {
    padding-left: 12px;
  }

  & .flag-dropdown {
    display: none;
  }
`

const SearchByPhoneSelect = ({
    searchByPhoneFn,
    onSelect,
    canManageContacts,
}) => {
    const intl = useIntl()
    const EnterPhoneMessage = intl.formatMessage({ id: 'EnterPhoneNumber' })
    const ResidentsOptGroupMessage = intl.formatMessage({ id: 'SearchByPhoneNumber.modal.select.residents' })
    const NotResidentsOptGroupMessage = intl.formatMessage({ id: 'SearchByPhoneNumber.modal.select.notResidents' })
    const EmployeesOptGroupMessage = intl.formatMessage({ id: 'SearchByPhoneNumber.modal.select.employees' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })

    const [phone, setPhone] = useState('')

    const renderOptions = useCallback((searchData) => {
        const resultOptions = []
        const contactOptions = searchData
            .filter(item => item.type === ClientType.Resident)
            .map(item => mapToSelectOption({ ...item, id: item.value, type: ClientType.Resident, DeletedMessage }))
        const notResidentOptions = searchData
            .filter(item => item.type === ClientType.NotResident && !item.isEmployee)
            .map(item => mapToSelectOption({ ...item, id: item.value, type: ClientType.NotResident, DeletedMessage }))
        const employeeOptions = notResidentOptions
            .filter(item => item.type === ClientType.NotResident && item.isEmployee)
            .map(item => mapToSelectOption({ ...item, id: item.value, type: ClientType.NotResident, DeletedMessage }))

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
    }, [DeletedMessage, EmployeesOptGroupMessage, NotResidentsOptGroupMessage, ResidentsOptGroupMessage])
    const handleSearch = useCallback((value) => setPhone(value), [])

    return (
        <GraphQlSearchInput
            search={searchByPhoneFn}
            suffixIcon={<SearchOutlined style={SEARCH_ICON_STYLES}/>}
            showSearch
            allowClear={false}
            style={SELECT_STYLES}
            notFoundContent={
                <NotFoundSearchByPhoneContent
                    canManageContacts={canManageContacts}
                    onSelect={onSelect}
                    phone={phone}
                />
            }
            renderOptions={renderOptions}
            optionFilterProp='title'
            onSearch={handleSearch}
            SearchInputComponentType={SearchComponentType.AutoComplete}
            onSelect={onSelect}
            showLoadingMessage={false}
            autoClearSearchValue
        >
            <StyledPhoneInput
                compatibilityWithAntAutoComplete
                placeholder={EnterPhoneMessage}
                masks={PHONE_INPUT_MASK}
            />
        </GraphQlSearchInput>
    )
}

export const useSearchByPhoneModal = (searchByPhoneFn, canManageContacts) => {
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
            destroyOnClose
        >
            <SearchByPhoneSelect
                onSelect={handleCloseModal}
                searchByPhoneFn={searchByPhoneFn}
                canManageContacts={canManageContacts}
            />
        </Modal>
    ), [SearchByPhoneMessage, canManageContacts, handleCloseModal,
        isSearchByPhoneModalVisible, searchByPhoneFn])

    return { isSearchByPhoneModalVisible, setIsSearchByPhoneModalVisible, SearchByPhoneModal }
}
