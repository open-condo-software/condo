import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Divider, Dropdown, DropDownProps, Menu } from 'antd'
import get from 'lodash/get'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { Button } from '@condo/domains/common/components/Button'
import { AppealIcon } from '@condo/domains/common/components/icons/AppealIcon'
import { MeterIcon } from '@condo/domains/common/components/icons/MeterIcon'
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
}

const DIVIDER_STYLES: CSSProperties = { margin: 0 }

const ResidentAppealDropdownOverlay = ({ isAssignedVisibilityType, setIsSearchByPhoneModalVisible, setDropdownVisible }) => {
    const handleButtonClick = useCallback(() => {
        setDropdownVisible(false)
        setIsSearchByPhoneModalVisible(true)
    }, [setIsSearchByPhoneModalVisible, setDropdownVisible])

    return (
        <StyledMenu>
            <MenuItem
                onClick={handleButtonClick}
                menuItemWrapperProps={ResidentAppealDropDownMenuItemWrapperProps}
                icon={SearchOutlined}
                label='SearchByPhoneNumber'
                eventName='MenuSearchByPhoneClick'
            />
            <Divider style={DIVIDER_STYLES}/>
            <MenuItem
                menuItemWrapperProps={ResidentAppealDropDownMenuItemWrapperProps}
                path='/ticket/create'
                icon={AppealIcon}
                label='CreateAppeal'
                eventName='MenuCreateTicketClick'
            />
            {
                !isAssignedVisibilityType && (
                    <>
                        <Divider style={DIVIDER_STYLES}/>
                        <MenuItem
                            menuItemWrapperProps={ResidentAppealDropDownMenuItemWrapperProps}
                            path='/meter/create'
                            icon={MeterIcon}
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
    ), [setIsSearchByPhoneModalVisible, isAssignedVisibilityType])

    const trigger: DropDownProps['trigger'] = useMemo(() => isMobile ? ['click'] : ['hover'], [isMobile])

    return (
        <div id={DROPDOWN_POPUP_CONTAINER_ID}>
            <Dropdown
                overlay={Overlay}
                placement={minified ? 'bottomRight' : 'bottomCenter'}
                getPopupContainer={getPopupContainer}
                trigger={trigger}
                visible={dropdownVisible}
                onVisibleChange={setDropdownVisible}
            >
                {
                    minified
                        ? (<StyledButton type='sberGradient' icon={<PlusOutlined />} shape='circle'/>)
                        : (
                            <StyledButton type='sberGradient' icon={<PlusOutlined />}>
                                {ResidentAppealMessage}
                            </StyledButton>
                        )
                }
            </Dropdown>
            {SearchByPhoneModal}
        </div>
    )
}
