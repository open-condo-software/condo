import styled from '@emotion/styled'
import { Divider, Dropdown, Menu } from 'antd'
import React from 'react'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { AppealIcon } from '@condo/domains/common/components/icons/AppealIcon'
import { MeterIcon } from '@condo/domains/common/components/icons/MeterIcon'
import { MenuItem } from '@condo/domains/common/components/MenuItem'

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

export const ResidentActions: React.FC = () => {
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
