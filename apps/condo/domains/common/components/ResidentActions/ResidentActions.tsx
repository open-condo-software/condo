import React, { useCallback, useMemo, useState } from 'react'

import { Readings, NewAppeal, Smartphone, Plus } from '@open-condo/icons'
import type { IconProps } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Dropdown, DropdownProps } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { MenuItem } from '@condo/domains/common/components/MenuItem'
import { fontSizes } from '@condo/domains/common/constants/style'
import { useSearchByPhoneModal } from '@condo/domains/common/hooks/useSearchByPhoneModal'
import { useTicketVisibility } from '@condo/domains/ticket/contexts/TicketVisibilityContext'
import { searchByPhone } from '@condo/domains/ticket/utils/clientSchema/clientCard'

import styles from './ResidentActions.module.css'

export const ResidentAppealDropDownMenuItemWrapperProps = {
    labelFontSize: fontSizes.label,
    className: 'width-full',
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
    const { organization, employee } = useOrganization()
    const organizationId = organization?.id

    const { ticketFilterQuery } = useTicketVisibility()

    const searchByPhoneFn = useMemo(
        () => searchByPhone(organizationId, ticketFilterQuery),
        [organizationId, ticketFilterQuery]
    )
    const canManageContacts = useMemo(() => employee?.role?.canManageContacts, [employee])

    const {
        setIsSearchByPhoneModalVisible,
        SearchByPhoneModal,
    } = useSearchByPhoneModal(searchByPhoneFn, canManageContacts)
    const { isMobile } = useLayoutContext()

    const [dropdownVisible, setDropdownVisible] = useState<boolean>()

    const trigger: DropdownProps['trigger'] = useMemo(() => isMobile ? ['click'] : ['hover'], [isMobile])
    const iconSize: IconProps['size'] = minified ? 'medium' : 'small'

    const canReadTickets = employee?.role?.canReadTickets || false
    const canManageTickets = employee?.role?.canManageTickets || false
    const canManageMeterReadings = employee?.role?.canManageMeterReadings || false
    const canReadContacts = employee?.role?.canReadContacts || false

    const openSearchByPhoneModal = useCallback(() => {
        setDropdownVisible(false)
        setIsSearchByPhoneModalVisible(true)
    }, [setIsSearchByPhoneModalVisible, setDropdownVisible])

    if (!canReadTickets && !canReadContacts && !canManageTickets && !canManageMeterReadings) {
        return null
    }

    const showSearchButton = canReadContacts && canReadTickets

    const items = [
        showSearchButton && {
            key: 'menu-item-search-by-phone',
            label: <MenuItem
                id='menu-item-search-by-phone'
                onClick={openSearchByPhoneModal}
                menuItemWrapperProps={ResidentAppealDropDownMenuItemWrapperProps}
                icon={Smartphone}
                label='SearchByPhoneNumber'
            />,
        },
        canManageTickets && {
            key: 'menu-item-create-appeal',
            label: <MenuItem
                id='menu-item-create-appeal'
                menuItemWrapperProps={ResidentAppealDropDownMenuItemWrapperProps}
                path='/ticket/create'
                icon={NewAppeal}
                label='CreateTicket'
            />,
        },
        canManageMeterReadings && {
            key: 'menu-item-create-meter-reading',
            label: <MenuItem
                id='menu-item-create-meter-reading'
                menuItemWrapperProps={ResidentAppealDropDownMenuItemWrapperProps}
                path='/meter/create?tab=meter-reading'
                icon={Readings}
                label='CreateMeterReading'
            />,
        },
    ]

    return (
        <div id={DROPDOWN_POPUP_CONTAINER_ID}>
            <Dropdown
                overlayClassName={styles.menuWrapper}
                menu={{ items }}
                getPopupContainer={getPopupContainer}
                trigger={trigger}
                open={dropdownVisible}
                onOpenChange={setDropdownVisible}
            >
                <Button type='accent' className={styles.accentButton} block icon={<Plus size={iconSize}/>}>
                    {!minified && ResidentAppealMessage}
                </Button>
            </Dropdown>
            {SearchByPhoneModal}
        </div>
    )
}
