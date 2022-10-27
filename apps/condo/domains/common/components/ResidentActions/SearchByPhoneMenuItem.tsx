import { SearchOutlined } from '@ant-design/icons'
import React from 'react'

import { MenuItem } from '@condo/domains/common/components/MenuItem'

import { ResidentAppealDropDownMenuItemWrapperProps } from './ResidentActions'
import { useTest } from './SearchByPhoneContext'

export const SearchByPhoneMenuItem = () => {
    const { isSearchByPhoneModalVisible, setIsSearchByPhoneModalVisible, SearchByPhoneModal } = useTest()

    return (
        <>
            <MenuItem
                onClick={() => setIsSearchByPhoneModalVisible(true)}
                menuItemWrapperProps={ResidentAppealDropDownMenuItemWrapperProps}
                icon={SearchOutlined}
                label='SearchByPhoneNumber'
            />
            {
                isSearchByPhoneModalVisible && SearchByPhoneModal
            }
        </>

    )
}