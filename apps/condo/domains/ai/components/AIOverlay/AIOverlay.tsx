import React, { useState, useRef, useEffect } from 'react'

import { Close, RefreshCw, Download } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Typography } from '@open-condo/ui'

import styles from './AIOverlay.module.css'

import { AIChat } from '../AIChat/AIChat'
import { useAIContext } from '../AIContext'

type AIOverlayProps = {
    open: boolean
    onClose: () => void
}

export const AIOverlay: React.FC<AIOverlayProps> = ({ open, onClose }) => {
    const intl = useIntl()
    const title = intl.formatMessage({ id: 'ai.chat.title' })
    const resetHistoryLabel = intl.formatMessage({ id: 'ai.chat.resetHistory' })
    const saveConversationLabel = intl.formatMessage({ id: 'ai.chat.saveConversation' })
    const closeLabel = intl.formatMessage({ id: 'Close' })
    const { aiOverlayWidth, setAIOverlayWidth } = useAIContext()
    const [isResizing, setIsResizing] = useState(false)
    const drawerRef = useRef<HTMLDivElement>(null)
    const startXRef = useRef<number>(0)
    const startWidthRef = useRef<number>(0)
    const aiChatRef = useRef<{ handleResetHistory: () => void, handleSaveConversation: () => void }>(null)

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
                <div className={styles.leftSection}>
                    <Typography.Title level={3}>{title}</Typography.Title>
                </div>
                <div className={styles.rightSection}>
                    <Button 
                        type='secondary'
                        size='medium'
                        compact
                        minimal
                        onClick={() => aiChatRef.current?.handleResetHistory()}
                        icon={<RefreshCw size='small' />}
                        title={resetHistoryLabel}
                    />
                    <Button 
                        type='secondary'
                        size='medium'
                        compact
                        minimal
                        onClick={() => aiChatRef.current?.handleSaveConversation()}
                        icon={<Download size='small' />}
                        title={saveConversationLabel}
                    />
                    <Button 
                        type='secondary' 
                        size='medium'
                        compact
                        minimal
                        onClick={onClose}
                        icon={<Close size='small' />}
                        title={closeLabel}
                    />
                </div>
            </div>
            <div className={styles.resizeHandle} onMouseDown={handleResizeStart} />
            <div className={styles.content}>
                <AIChat 
                    ref={aiChatRef}
                    onClose={onClose} 
                />
            </div>
        </div>
    )
}
