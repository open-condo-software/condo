import { Row } from 'antd'
import React, { useState, useMemo, useCallback } from 'react'

import { Modal } from '@open-condo/ui'

import type { RowProps } from 'antd'

const MODAL_ROW_GUTTER: RowProps['gutter'] = [24, 40]

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
            <Row gutter={MODAL_ROW_GUTTER}>
                {children}
            </Row>
        </Modal>
    ), [isOpen, title])

    return {
        PopupChartView,
        open,
        isOpen,
    }
}

export { useDetailChartView }
