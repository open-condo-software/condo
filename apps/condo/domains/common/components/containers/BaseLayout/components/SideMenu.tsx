/** @jsx jsx */
import { jsx } from '@emotion/core'
import { Layout, Divider, Dropdown, Menu } from 'antd'
import get from 'lodash/get'
import React from 'react'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import { useResponsive } from '../../../../hooks/useResponsive'
import {
    MenuItemsContainer,
    SIDE_MENU_WIDTH,
    sideMenuDesktopCss,
    substrateDesktopCss,
} from './styles'
import { Logo } from '@condo/domains/common/components/Logo'
import { Button } from '@condo/domains/common/components/Button'
import styled from '@emotion/styled'
import { AppealIcon } from '@condo/domains/common/components/icons/AppealIcon'
import { MeterIcon } from '@condo/domains/common/components/icons/MeterIcon'
import { MenuItem } from '@condo/domains/common/components/MenuItem'
import { ServiceSubscriptionIndicator } from '@condo/domains/subscription/components/ServiceSubscriptionIndicator'

interface ISideMenuProps {
    onLogoClick: (...args) => void
    menuData?: React.ElementType
}

export const StyledMenu = styled(Menu)`
  width: 225px;
  box-sizing: border-box;
  border-radius: 8px;
`

const ResidentAppealDropDownMenuItemWrapperProps = {
    labelFontSize: '14px',
    padding: '16px',
    flexGap: '10px',
}

const ResidentAppealDropdownOverlay = () => {
    return (
        <StyledMenu>
            <MenuItem
                menuItemWrapperProps={ResidentAppealDropDownMenuItemWrapperProps}
                path={'/ticket/create'}
                icon={AppealIcon}
                label={'CreateAppeal'}
            />
            <Divider style={{ margin: 0 }}/>
            <MenuItem
                menuItemWrapperProps={ResidentAppealDropDownMenuItemWrapperProps}
                path={'/meter/create'}
                icon={MeterIcon}
                label={'CreateMeterReading'}
            />
        </StyledMenu>
    )
}

const ResidentAppealDropdown = () => {
    const intl = useIntl()

    return (
        <Dropdown
            overlay={ResidentAppealDropdownOverlay}
            placement={'bottomCenter'}
        >
            <Button type='sberDefault' style={{ position: 'relative', left: '-10px' }}>
                {intl.formatMessage({ id: 'ResidentAppeal' })}
            </Button>
        </Dropdown>
    )
}

export const SideMenu: React.FC<ISideMenuProps> = (props) => {
    const { onLogoClick, menuData } = props
    const { link } = useOrganization()
    const { isSmall } = useResponsive()
    const isEmployeeBlocked = get(link, 'isBlocked', false)

    if (isEmployeeBlocked) {
        return null
    }

    // TODO: (Dimitreee) implement mobile nav later
    if (isSmall) {
        return null
    }

    return (
        <>
            <Layout.Sider
                theme='light'
                css={sideMenuDesktopCss}
                width={SIDE_MENU_WIDTH}
                className='side-menu'
            >
                <Logo onClick={onLogoClick} />
                <MenuItemsContainer>
                    <ResidentAppealDropdown/>
                    <MenuItemsContainer>
                        {menuData}
                    </MenuItemsContainer>
                </MenuItemsContainer>
                <ServiceSubscriptionIndicator/>
            </Layout.Sider>
            {menuData && <div css={substrateDesktopCss} className='side-menu-substrate' />}
        </>
    )
}
