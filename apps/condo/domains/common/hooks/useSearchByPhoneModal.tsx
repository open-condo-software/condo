import styled from '@emotion/styled'
import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'
import { PhoneInputProps } from 'react-phone-input-2'

import { useIntl } from '@open-condo/next/intl'
import { Modal } from '@open-condo/ui'

import Select from '@condo/domains/common/components/antd/Select'
import { Button } from '@condo/domains/common/components/Button'
import { GraphQlSearchInput, SearchComponentType } from '@condo/domains/common/components/GraphQlSearchInput'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import {
    ClientType,
    mapSearchItemToOption,
    redirectToForm,
} from '@condo/domains/contact/utils/clientCard'


const StyledModal = styled(Modal)<{ isSmall }>`
  animation-duration: 0s !important;
  width: 1150px !important;
  
  &.condo-modal {
    ${props => !props.isSmall && 'top: -20vh; margin: 0 auto;'}

    & .condo-modal-header {
      border-radius: 12px;
      border-bottom: none;
    }

    .condo-modal-content {
      overflow: unset !important;
    }
  }
`

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
            target: '_blank',
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
            target: '_blank',
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
const PHONE_INPUT_MASK = { ru: '... ... .. ..' }
const PHONE_INPUT_PROPS: PhoneInputProps['inputProps'] = { autoFocus: true }

const StyledPhoneInput = styled(PhoneInput)`
  & .ant-input {
    padding-left: 12px;
  }

  & .flag-dropdown {
    display: none;
  }
`

const DROPDOWN_POPUP_CONTAINER_ID = 'searchByPhonePopupContainer'
function getPopupContainer (): HTMLElement {
    return document.getElementById(DROPDOWN_POPUP_CONTAINER_ID)
}

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

    const [phone, setPhone] = useState('')

    const renderOptions = useCallback((searchData, _) => {
        const resultOptions = []
        const contactOptions = searchData
            .filter(item => item.type === ClientType.Resident)
            .map(item => mapSearchItemToOption(item, phone, ClientType.Resident))
        const notResidentOptions = searchData
            .filter(item => item.type === ClientType.NotResident && !item.isEmployee)
            .map(item => mapSearchItemToOption(item, phone, ClientType.NotResident))
        const employeeOptions = searchData
            .filter(item => item.type === ClientType.NotResident && item.isEmployee)
            .map(item => mapSearchItemToOption(item, phone, ClientType.NotResident))

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
    }, [EmployeesOptGroupMessage, NotResidentsOptGroupMessage, ResidentsOptGroupMessage, phone])
    const handleSearch = useCallback((value) => setPhone(value), [])

    return (
        <div id={DROPDOWN_POPUP_CONTAINER_ID}>
            <GraphQlSearchInput
                search={searchByPhoneFn}
                showSearch
                allowClear
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
                getPopupContainer={getPopupContainer}
            >
                <StyledPhoneInput
                    inputProps={PHONE_INPUT_PROPS}
                    compatibilityWithAntAutoComplete
                    placeholder={EnterPhoneMessage}
                    masks={PHONE_INPUT_MASK}
                    showCountryPrefix={false}
                />
            </GraphQlSearchInput>
        </div>
    )
}

export const useSearchByPhoneModal = (searchByPhoneFn, canManageContacts) => {
    const intl = useIntl()
    const SearchByPhoneMessage = intl.formatMessage({ id: 'SearchByPhoneNumber' })

    const { breakpoints } = useLayoutContext()

    const [isSearchByPhoneModalVisible, setIsSearchByPhoneModalVisible] = useState<boolean>(false)

    const handleCloseModal = useCallback(() => setIsSearchByPhoneModalVisible(false), [])

    const SearchByPhoneModal = useMemo(() => (
        <StyledModal
            isSmall={!breakpoints.TABLET_LARGE}
            open={isSearchByPhoneModalVisible}
            title={SearchByPhoneMessage}
            onCancel={handleCloseModal}
            footer={null}
            destroyOnClose
        >
            <SearchByPhoneSelect
                onSelect={handleCloseModal}
                searchByPhoneFn={searchByPhoneFn}
                canManageContacts={canManageContacts}
            />
        </StyledModal>
    ), [SearchByPhoneMessage, canManageContacts, handleCloseModal,
        isSearchByPhoneModalVisible, searchByPhoneFn])

    return { isSearchByPhoneModalVisible, setIsSearchByPhoneModalVisible, SearchByPhoneModal }
}
