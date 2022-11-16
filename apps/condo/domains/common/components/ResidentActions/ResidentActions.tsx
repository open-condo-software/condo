import { PlusOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Divider, Dropdown, DropDownProps, Menu } from 'antd'
import { get } from 'lodash'
import React, { CSSProperties, useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { AppealIcon } from '@condo/domains/common/components/icons/AppealIcon'
import { MeterIcon } from '@condo/domains/common/components/icons/MeterIcon'
import { MenuItem } from '@condo/domains/common/components/MenuItem'
import { fontSizes } from '@condo/domains/common/constants/style'
import { useSearchByPhoneModal } from '@condo/domains/common/hooks/useSearchByPhoneModal'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { useOrganization } from '@open-condo/next/organization'
import { searchByPhone } from '@condo/domains/contact/utils/clientCard'

export const StyledMenu = styled(Menu)`
  box-sizing: border-box;
  border-radius: 8px;
`

export const ResidentAppealDropDownMenuItemWrapperProps = {
    labelFontSize: fontSizes.label,
    padding: '16px',
}

const DIVIDER_STYLES: CSSProperties = { margin: 0 }

const ResidentAppealDropdownOverlay = ({ isAssignedVisibilityType, setIsSearchByPhoneModalVisible }) => {
    const handleButtonClick = useCallback(() => {
        setIsSearchByPhoneModalVisible(true)
    }, [setIsSearchByPhoneModalVisible])

    return (
        <StyledMenu>
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
    const searchByPhoneFn = useMemo(() => searchByPhone(get(organization, 'id', null)), [organization])
    const canManageContacts = useMemo(() => get(link, 'role.canManageContacts'), [link])
    const { setIsSearchByPhoneModalVisible, SearchByPhoneModal } = useSearchByPhoneModal(searchByPhoneFn, canManageContacts)
    const { isMobile } = useLayoutContext()

    const trigger = useMemo(() => isMobile ? ['click'] : ['hover'], [isMobile])

    const { link } = useOrganization()
    const role = get(link, 'role', {})
    const isAssignedVisibilityType = get(role, 'ticketVisibilityType') === ASSIGNED_TICKET_VISIBILITY

    const Overlay = useMemo(() => (
        <ResidentAppealDropdownOverlay
            setIsSearchByPhoneModalVisible={setIsSearchByPhoneModalVisible}
            isAssignedVisibilityType={isAssignedVisibilityType}
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
            {SearchByPhoneModal}
        </div>
    )
}
