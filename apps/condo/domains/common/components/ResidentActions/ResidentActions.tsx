import { PlusOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Divider, Dropdown, DropDownProps, Menu } from 'antd'
import get from 'lodash/get'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'

import { Readings, NewAppeal, Smartphone } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { Button } from '@condo/domains/common/components/Button'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { MenuItem } from '@condo/domains/common/components/MenuItem'
import { fontSizes } from '@condo/domains/common/constants/style'
import { useSearchByPhoneModal } from '@condo/domains/common/hooks/useSearchByPhoneModal'
import { searchByPhone } from '@condo/domains/contact/utils/clientCard'
import { ASSIGNED_TICKET_VISIBILITY } from '@condo/domains/organization/constants/common'
import { useTicketVisibility } from '@condo/domains/ticket/contexts/TicketVisibilityContext'

export const StyledMenu = styled(Menu)`
  box-sizing: border-box;
  border-radius: 8px;
`

const StyledButton = styled(Button)`
  &:hover {
    cursor: initial;
  }
`

export const ResidentAppealDropDownMenuItemWrapperProps = {
    labelFontSize: fontSizes.label,
    padding: '16px 24px 16px 16px',
    className: 'width-full',
}

const DIVIDER_STYLES: CSSProperties = { margin: 0 }

const ResidentAppealDropdownOverlay = ({ isAssignedVisibilityType, setIsSearchByPhoneModalVisible, setDropdownVisible }) => {
    const handleButtonClick = useCallback(() => {
        setDropdownVisible(false)
        setIsSearchByPhoneModalVisible(true)
    }, [setIsSearchByPhoneModalVisible, setDropdownVisible])

    return (
        <StyledMenu>
            {
                !isAssignedVisibilityType && (
                    <>
                        <MenuItem
                            id='menuitem-action-SearchByPhoneNumber'
                            onClick={handleButtonClick}
                            menuItemWrapperProps={ResidentAppealDropDownMenuItemWrapperProps}
                            icon={Smartphone}
                            label='SearchByPhoneNumber'
                            eventName='MenuSearchByPhoneClick'
                        />
                        <Divider style={DIVIDER_STYLES}/>
                    </>
                )
            }
            <MenuItem
                id='menuitem-action-CreateAppeal'
                menuItemWrapperProps={ResidentAppealDropDownMenuItemWrapperProps}
                path='/ticket/create'
                icon={NewAppeal}
                label='CreateAppeal'
                eventName='MenuCreateTicketClick'
            />
            {
                !isAssignedVisibilityType && (
                    <>
                        <Divider style={DIVIDER_STYLES}/>
                        <MenuItem
                            id='menuitem-action-CreateMeterReading'
                            menuItemWrapperProps={ResidentAppealDropDownMenuItemWrapperProps}
                            path='/meter/create'
                            icon={Readings}
                            label='CreateMeterReading'
                            eventName='MenuCreateMeterReadingClick'
                        />
                    </>
                )
            }
        </StyledMenu>
    )
}

const DROPDOWN_POPUP_CONTAINER_ID = 'residentActionsPopupContainer'
function getPopupContainer (): HTMLElement {
    return document.getElementById(DROPDOWN_POPUP_CONTAINER_ID)
}

interface IResidentActionsProps {
    minified: boolean
}

export const ResidentActions: React.FC<IResidentActionsProps> = (props) => {
    const intl = useIntl()
    const ResidentAppealMessage = intl.formatMessage({ id: 'ResidentAppeal' })

    const { minified } = props
    const { organization, link } = useOrganization()
    const { ticketFilterQuery } = useTicketVisibility()

    const searchByPhoneFn = useMemo(
        () => searchByPhone(get(organization, 'id', null), ticketFilterQuery),
        [organization, ticketFilterQuery]
    )
    const canManageContacts = useMemo(() => get(link, 'role.canManageContacts'), [link])

    const {
        setIsSearchByPhoneModalVisible,
        SearchByPhoneModal,
    } = useSearchByPhoneModal(searchByPhoneFn, canManageContacts)
    const { isMobile } = useLayoutContext()

    const role = get(link, 'role', {})
    const isAssignedVisibilityType = get(role, 'ticketVisibilityType') === ASSIGNED_TICKET_VISIBILITY

    const [dropdownVisible, setDropdownVisible] = useState<boolean>()

    const Overlay = useMemo(() => (
        <ResidentAppealDropdownOverlay
            setIsSearchByPhoneModalVisible={setIsSearchByPhoneModalVisible}
            isAssignedVisibilityType={isAssignedVisibilityType}
            setDropdownVisible={setDropdownVisible}
        />
    ), [setIsSearchByPhoneModalVisible, isAssignedVisibilityType, setDropdownVisible])

    const trigger: DropDownProps['trigger'] = useMemo(() => isMobile ? ['click'] : ['hover'], [isMobile])

    return (
        <div id={DROPDOWN_POPUP_CONTAINER_ID}>
            <Dropdown
                overlay={Overlay}
                placement='bottomRight'
                getPopupContainer={getPopupContainer}
                trigger={trigger}
                visible={dropdownVisible}
                onVisibleChange={setDropdownVisible}
            >
                {/* NOTE: you need to use `dev` wrapper because of warning: Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef() */}
                <div>{
                    minified
                        ? (<StyledButton type='sberGradient' icon={<PlusOutlined />} shape='circle'/>)
                        : (
                            <StyledButton type='sberGradient' icon={<PlusOutlined />}>
                                {ResidentAppealMessage}
                            </StyledButton>
                        )
                }</div>
            </Dropdown>
            {SearchByPhoneModal}
        </div>
    )
}
