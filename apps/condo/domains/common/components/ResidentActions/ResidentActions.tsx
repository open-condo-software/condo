import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Divider, Dropdown, DropDownProps, Menu } from 'antd'
import React, { CSSProperties, useCallback, useMemo, useState, useEffect } from 'react'
import get from 'lodash/get'

import { useIntl } from '@open-condo/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { AppealIcon } from '@condo/domains/common/components/icons/AppealIcon'
import { MeterIcon } from '@condo/domains/common/components/icons/MeterIcon'
import { MenuItem } from '@condo/domains/common/components/MenuItem'
import { fontSizes } from '@condo/domains/common/constants/style'
import { useSearchByPhoneModal } from '@condo/domains/common/hooks/useSearchByPhoneModal'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { SearchByPhoneMenuItem } from './SearchByPhoneMenuItem'
import { ASSIGNED_TICKET_VISIBILITY } from '@condo/domains/organization/constants/common'
import { useOrganization } from '@open-condo/next/organization'

export const StyledMenu = styled(Menu)`
  box-sizing: border-box;
  border-radius: 8px;
`

export const ResidentAppealDropDownMenuItemWrapperProps = {
    labelFontSize: fontSizes.label,
    padding: '16px',
}

const DIVIDER_STYLES: CSSProperties = { margin: 0 }

const ResidentAppealDropdownOverlay = ({ isAssignedVisibilityType, setIsMouseOnDropdown, setIsSearchByPhoneModalVisible }) => {
    const handleMouseEnter = useCallback(() => {
        setIsMouseOnDropdown(true)
    }, [setIsMouseOnDropdown])
    const handleMouseLeave = useCallback(() => {
        setIsMouseOnDropdown(false)
    }, [setIsMouseOnDropdown])
    const handleButtonClick = useCallback(() => {
        setIsSearchByPhoneModalVisible(true)
    }, [setIsSearchByPhoneModalVisible])

    return (
        <StyledMenu
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <MenuItem
                onClick={handleButtonClick}
                menuItemWrapperProps={ResidentAppealDropDownMenuItemWrapperProps}
                icon={SearchOutlined}
                label='SearchByPhoneNumber'
            />
            <Divider style={DIVIDER_STYLES}/>
            <MenuItem
                menuItemWrapperProps={ResidentAppealDropDownMenuItemWrapperProps}
                path='/ticket/create'
                icon={AppealIcon}
                label='CreateAppeal'
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
                        />
                    </>
                )
            }
        </StyledMenu>
    )
}

const ResidentAppealButton = ({ minified, setIsMouseOnButton }) => {
    const intl = useIntl()
    const ResidentAppealMessage = intl.formatMessage({ id: 'ResidentAppeal' })

    const handleMouseEnter = useCallback(() => {
        setIsMouseOnButton(true)
    }, [setIsMouseOnButton])
    const handleMouseLeave = useCallback(() => {
        setTimeout(() => {
            setIsMouseOnButton(false)
        }, 500)
    }, [setIsMouseOnButton])

    return (
        <Button
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            type='sberGradient'
            icon={<PlusOutlined />}
        >
            {!minified && ResidentAppealMessage}
        </Button>
    )
}

function getPopupContainer (): HTMLElement {
    return document.getElementById('test')
}

interface IResidentActionsProps {
    minified: boolean
}

export const ResidentActions: React.FC<IResidentActionsProps> = (props) => {
    const { minified } = props
    const { setIsSearchByPhoneModalVisible, SearchByPhoneModal } = useSearchByPhoneModal()
    const { isMobile } = useLayoutContext()

    const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>()
    const [isMouseOnDropdown, setIsMouseOnDropdown] = useState<boolean>()
    const [isMouseOnButton, setIsMouseOnButton] = useState<boolean>()

    useEffect(() => {
        setIsDropdownVisible(isMouseOnDropdown || isMouseOnButton)
    }, [isMouseOnButton, isMouseOnDropdown])

    const Overlay = useMemo(() => (
        <ResidentAppealDropdownOverlay
            setIsMouseOnDropdown={setIsMouseOnDropdown}
            setIsSearchByPhoneModalVisible={setIsSearchByPhoneModalVisible}
        />
    ), [setIsSearchByPhoneModalVisible])

    const { link } = useOrganization()
    const role = get(link, 'role', {})
    const isAssignedVisibilityType = get(role, 'ticketVisibilityType') === ASSIGNED_TICKET_VISIBILITY

    return (
        <div id='test'>
            <Dropdown
                overlay={() => <ResidentAppealDropdownOverlay isAssignedVisibilityType={isAssignedVisibilityType}/>}
                placement={minified ? 'bottomRight' : 'bottomCenter'}
                // visible={isDropdownVisible}
                getPopupContainer={getPopupContainer}
                trigger={['click', 'hover']}
            >
                <ResidentAppealButton
                    minified={minified}
                    setIsMouseOnButton={setIsMouseOnButton}
                />
            </Dropdown>
            {SearchByPhoneModal}
        </div>
    )
}
