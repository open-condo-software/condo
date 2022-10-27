import React, { useCallback, useMemo, useState } from 'react'
import { useIntl } from '@condo/next/intl'

import { Modal } from '@condo/domains/common/components/Modal'

export const useSearchByPhoneModal = () => {
    const intl = useIntl()
    const SearchByPhoneMessage = intl.formatMessage({ id: 'SearchByPhoneNumber' })

    const [isSearchByPhoneModalVisible, setIsSearchByPhoneModalVisible] = useState<boolean>(false)

    const handleCloseModal = useCallback(() => setIsSearchByPhoneModalVisible(false), [])

    const SearchByPhoneModal = useMemo(() => (
        <Modal
            visible={isSearchByPhoneModalVisible}
            title={SearchByPhoneMessage}
            onCancel={handleCloseModal}
            zIndex={10000}
        />
    ), [SearchByPhoneMessage, handleCloseModal, isSearchByPhoneModalVisible])

    return { isSearchByPhoneModalVisible, setIsSearchByPhoneModalVisible, SearchByPhoneModal }
}
