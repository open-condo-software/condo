import React, { useState, useMemo, useCallback } from 'react'

import { Modal } from '@open-condo/ui'

type UseDetailChartViewType = ({ title }: { title: string }) => ({
    PopupChartView: React.FC
    open: () => void
    isOpen: boolean
})

const useDetailChartView: UseDetailChartViewType = ({ title }) => {
    const [isOpen, setIsOpen] = useState(false)

    const open = useCallback(() => setIsOpen(true), [])

    const PopupChartView = useMemo<React.FC>(() => ({ children }) => (
        <Modal
            open={isOpen}
            onCancel={() => setIsOpen(false)}
            width='big'
            title={title}
        >
            {children}
        </Modal>
    ), [isOpen, title])

    return {
        PopupChartView,
        open,
        isOpen,
    }
}

export { useDetailChartView }
