import { PlusOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Divider, Dropdown, DropDownProps, Menu } from 'antd'
import React from 'react'
import { useIntl } from '@core/next/intl'
import { Button, ButtonGradientBorderWrapper } from '@condo/domains/common/components/Button'
import { AppealIcon } from '@condo/domains/common/components/icons/AppealIcon'
import { MeterIcon } from '@condo/domains/common/components/icons/MeterIcon'
import { MenuItem } from '@condo/domains/common/components/MenuItem'
import { fontSizes } from '@condo/domains/common/constants/style'

export const StyledMenu = styled(Menu)`
  width: 225px;
  box-sizing: border-box;
  border-radius: 8px;
`

const ResidentAppealDropDownMenuItemWrapperProps = {
    labelFontSize: fontSizes.label,
    padding: '16px',
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

interface IResidentActionsProps {
    minified: boolean
}

const RESIDENT_ACTIONS_OPEN_DROPDOWN_TRIGGERS: DropDownProps['trigger'] = ['hover', 'click']

export const ResidentActions: React.FC<IResidentActionsProps> = (props) => {
    const intl = useIntl()
    const { minified } = props
    const ResidentAppealMessage = intl.formatMessage({ id: 'ResidentAppeal' })

    return (
        <Dropdown
            overlay={ResidentAppealDropdownOverlay}
            placement={minified ? 'bottomRight' : 'bottomCenter'}
            trigger={RESIDENT_ACTIONS_OPEN_DROPDOWN_TRIGGERS}
        >
            {
                minified
                    ? (
                        <ButtonGradientBorderWrapper>
                            <Button type={'sberGradient'} icon={<PlusOutlined />} shape={'circle'}/>
                        </ButtonGradientBorderWrapper>)
                    : (
                        <ButtonGradientBorderWrapper>
                            <Button type={'sberGradient'} icon={<PlusOutlined />}>
                                {ResidentAppealMessage}
                            </Button>
                        </ButtonGradientBorderWrapper>
                    )
            }
        </Dropdown>
    )
}
