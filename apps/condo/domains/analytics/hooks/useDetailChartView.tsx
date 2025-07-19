import { Row, notification } from 'antd'
import React, { useState, useMemo, useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Modal } from '@open-condo/ui'

import type { RowProps } from 'antd'

const MODAL_ROW_GUTTER: RowProps['gutter'] = [24, 40]

type UseDetailChartViewType = ({ title }: { title: string }) => ({
    PopupChartView: React.FC<React.PropsWithChildren>
    open: () => void
    isOpen: boolean
    errorFallback: () => void
})

const useDetailChartView: UseDetailChartViewType = ({ title }) => {
    const intl = useIntl()
    const ErrorTitle = intl.formatMessage({ id: 'errors.LoadingError' })

    const [isOpen, setIsOpen] = useState(false)

    const open = useCallback(() => setIsOpen(true), [])
    const errorFallback = useCallback(() => {
        notification.error({ message: ErrorTitle })
    }, [ErrorTitle])

    const PopupChartView = useMemo<React.FC<React.PropsWithChildren>>(() => ({ children }) => (
        <Modal
            open={isOpen}
            onCancel={() => setIsOpen(false)}
            width='big'
            title={title}
            scrollX={false}
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
        errorFallback,
    }
}

export { useDetailChartView }
