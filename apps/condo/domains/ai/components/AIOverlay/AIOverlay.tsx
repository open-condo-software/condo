import React, { useState, useRef, useEffect } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { CloseOutlined } from '@ant-design/icons'

import { AIChat } from '../AIChat/AIChat'
import { useAIContext } from '../AIContext'
import styles from './AIOverlay.module.css'

type AIOverlayProps = {
    open: boolean
    onClose: () => void
}

export const AIOverlay: React.FC<AIOverlayProps> = ({ open, onClose }) => {
    const intl = useIntl()
    const title = intl.formatMessage({ id: 'ai.chat.title' })
    const { aiOverlayWidth, setAIOverlayWidth } = useAIContext()
    const [isResizing, setIsResizing] = useState(false)
    const drawerRef = useRef<HTMLDivElement>(null)
    const startXRef = useRef<number>(0)
    const startWidthRef = useRef<number>(0)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return
            
            const newWidth = startWidthRef.current + (startXRef.current - e.clientX)
            const clampedWidth = Math.max(300, Math.min(1200, newWidth))
            setAIOverlayWidth(clampedWidth)
        }

        const handleMouseUp = () => {
            setIsResizing(false)
        }

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'col-resize'
            document.body.style.userSelect = 'none'
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }
    }, [isResizing, setAIOverlayWidth])

    const handleResizeStart = (e: React.MouseEvent) => {
        setIsResizing(true)
        startXRef.current = e.clientX
        startWidthRef.current = aiOverlayWidth
    }

    if (!open) return null

    return (
        <div 
            ref={drawerRef}
            className={styles.aiDrawer}
            style={{ width: `${aiOverlayWidth}px` }}
        >
            <div className={styles.header}>
                <h3 className={styles.title}>{title}</h3>
                <button 
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label="Close"
                >
                    <CloseOutlined />
                </button>
            </div>
            <div className={styles.resizeHandle} onMouseDown={handleResizeStart} />
            <div className={styles.content}>
                <AIChat onClose={onClose} />
            </div>
        </div>
    )
}
