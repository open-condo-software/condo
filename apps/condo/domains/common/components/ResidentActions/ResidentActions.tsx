import styled from '@emotion/styled'
import { Divider, Dropdown, DropDownProps, Menu } from 'antd'
import get from 'lodash/get'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'

import { Readings, NewAppeal, Smartphone, Plus } from '@open-condo/icons'
import type { IconProps } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button } from '@open-condo/ui'

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

export const ResidentAppealDropDownMenuItemWrapperProps = {
    labelFontSize: fontSizes.label,
    padding: '16px 24px 16px 16px',
    className: 'width-full',
}

const DIVIDER_STYLES: CSSProperties = { margin: 0 }

const ResidentAppealDropdownOverlay = ({ setIsSearchByPhoneModalVisible, setDropdownVisible }) => {
    const { link } = useOrganization()
    const canReadContacts = get(link, ['role', 'canReadContacts'], false)
    const canReadTickets = get(link, ['role', 'canReadTickets'], false)
    const canManageTickets = get(link, ['role', 'canManageTickets'], false)
    const canManageMeterReadings = get(link, ['role', 'canManageMeterReadings'], false)
    const showSearchButton = canReadContacts && canReadTickets

    const handleButtonClick = useCallback(() => {
        setDropdownVisible(false)
        setIsSearchByPhoneModalVisible(true)
    }, [setIsSearchByPhoneModalVisible, setDropdownVisible])

    return (
        <StyledMenu>
            {
                showSearchButton && (
                    <>
                        <MenuItem
                            id='menuitem-action-SearchByPhoneNumber'
                            onClick={handleButtonClick}
                            menuItemWrapperProps={ResidentAppealDropDownMenuItemWrapperProps}
                            icon={Smartphone}
                            label='SearchByPhoneNumber'
                            eventName='MenuSearchByPhoneClick'
                        />
                        {(canManageTickets || canManageMeterReadings) && <Divider style={DIVIDER_STYLES}/>}
                    </>
                )
            }
            {
                canManageTickets && (
                    <>
                        <MenuItem
                            id='menuitem-action-CreateAppeal'
                            menuItemWrapperProps={ResidentAppealDropDownMenuItemWrapperProps}
                            path='/ticket/create'
                            icon={NewAppeal}
                            label='CreateAppeal'
                            eventName='MenuCreateTicketClick'
                        />
                        {canManageMeterReadings && <Divider style={DIVIDER_STYLES}/>}
                    </>
                )
            }
            {
                canManageMeterReadings && (
                    <MenuItem
                        id='menuitem-action-CreateMeterReading'
                        menuItemWrapperProps={ResidentAppealDropDownMenuItemWrapperProps}
                        path='/meter/create'
                        icon={Readings}
                        label='CreateMeterReading'
                        eventName='MenuCreateMeterReadingClick'
                    />
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

    const [dropdownVisible, setDropdownVisible] = useState<boolean>()

    const Overlay = useMemo(() => (
        <ResidentAppealDropdownOverlay
            setIsSearchByPhoneModalVisible={setIsSearchByPhoneModalVisible}
            setDropdownVisible={setDropdownVisible}
        />
    ), [setIsSearchByPhoneModalVisible, setDropdownVisible])

    const trigger: DropDownProps['trigger'] = useMemo(() => isMobile ? ['click'] : ['hover'], [isMobile])
    const iconSize: IconProps['size'] = minified ? 'medium' : 'small'

    const canReadTickets = get(link, ['role', 'canReadTickets'], false)
    const canManageTickets = get(link, ['role', 'canManageTickets'], false)
    const canManageMeterReadings = get(link, ['role', 'canManageMeterReadings'], false)
    const canReadContacts = get(link, ['role', 'canReadContacts'], false)

    if (!canReadTickets && !canReadContacts && !canManageTickets && !canManageMeterReadings) {
        return null
    }

    return (
        <div id={DROPDOWN_POPUP_CONTAINER_ID}>
            <Dropdown
                overlay={Overlay}
                placement='bottomRight'
                getPopupContainer={getPopupContainer}
                trigger={trigger}
                visible={dropdownVisible}
                overlayClassName='appeals-dropdown-menu'
                onVisibleChange={setDropdownVisible}
            >
                {/* NOTE: you need to use `div` wrapper because of warning: Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef() */}
                <div>
                    <Button type='secondary' block icon={<Plus size={iconSize}/>} className='appeals-button'>
                        {!minified && ResidentAppealMessage}
                    </Button>
                </div>
            </Dropdown>
            {SearchByPhoneModal}
        </div>
    )
}
