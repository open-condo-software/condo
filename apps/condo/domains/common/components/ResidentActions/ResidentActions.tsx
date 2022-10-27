import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Divider, Dropdown, DropDownProps, Menu } from 'antd'
import React, { CSSProperties } from 'react'
import get from 'lodash/get'
import { useIntl } from '@open-condo/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { AppealIcon } from '@condo/domains/common/components/icons/AppealIcon'
import { MeterIcon } from '@condo/domains/common/components/icons/MeterIcon'
import { MenuItem } from '@condo/domains/common/components/MenuItem'
import { fontSizes } from '@condo/domains/common/constants/style'
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

const ResidentAppealDropdownOverlay = ({ isAssignedVisibilityType }) => {
    return (
        <StyledMenu>
            <SearchByPhoneMenuItem />
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

interface IResidentActionsProps {
    minified: boolean
}

const RESIDENT_ACTIONS_OPEN_DROPDOWN_TRIGGERS: DropDownProps['trigger'] = ['hover', 'click']

export const ResidentActions: React.FC<IResidentActionsProps> = (props) => {
    const intl = useIntl()
    const { minified } = props
    const ResidentAppealMessage = intl.formatMessage({ id: 'ResidentAppeal' })

    const { link } = useOrganization()
    const role = get(link, 'role', {})
    const isAssignedVisibilityType = get(role, 'ticketVisibilityType') === ASSIGNED_TICKET_VISIBILITY

    return (
        <Dropdown
            overlay={() => <ResidentAppealDropdownOverlay isAssignedVisibilityType={isAssignedVisibilityType}/>}
            placement={minified ? 'bottomRight' : 'bottomCenter'}
            trigger={RESIDENT_ACTIONS_OPEN_DROPDOWN_TRIGGERS}
        >
            {
                minified
                    ? (<Button type='sberGradient' icon={<PlusOutlined />} shape='circle'/>)
                    : (
                        <Button type='sberGradient' icon={<PlusOutlined />}>
                            {ResidentAppealMessage}
                        </Button>
                    )
            }
        </Dropdown>
    )
}
