import classnames from 'classnames'
import React, { useState, useRef, useEffect } from 'react'

import { Close, RefreshCw, Download } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Typography } from '@open-condo/ui'

import styles from './AIOverlay.module.css'

import { AIChat } from '../AIChat'
import { useAIContext } from '../AIContext'

type AIOverlayProps = {
    open: boolean
    onClose: () => void
}

const MIN_OVERLAY_WIDTH = 300
const MAX_OVERLAY_WIDTH = 1200
const CLOSE_THRESHOLD = MIN_OVERLAY_WIDTH / 2

export const AIOverlay: React.FC<AIOverlayProps> = ({ open, onClose }) => {
    const intl = useIntl()

    const title = intl.formatMessage({ id: 'ai.chat.title' })
    const resetHistoryLabel = intl.formatMessage({ id: 'ai.chat.resetHistory' })
    const saveConversationLabel = intl.formatMessage({ id: 'ai.chat.saveConversation' })
    const closeLabel = intl.formatMessage({ id: 'Close' })

    const { aiOverlayWidth, setAIOverlayWidth, openAIOverlay } = useAIContext()

    const [isResizing, setIsResizing] = useState(false)
    const [isAtMinWidth, setIsAtMinWidth] = useState(false)
    const [isAtMaxWidth, setIsAtMaxWidth] = useState(false)
    const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null)
    const dragDirectionRef = useRef<'left' | 'right' | null>(null)
    const drawerRef = useRef<HTMLDivElement>(null)
    const startXRef = useRef<number>(0)
    const startWidthRef = useRef<number>(0)
    
    const aiChatRef = useRef<{ 
        handleResetHistory: () => void, 
        handleSaveConversation: () => void,
        checkForActiveTask: () => void,
        scrollToBottom: () => void
    }>(null)

    // Check for active tasks when component mounts or overlay opens
    useEffect(() => {
        if (open && aiChatRef.current) {
            console.log('AI Overlay opened, checking for active tasks and scrolling to bottom')
            aiChatRef.current.checkForActiveTask()
            const attemptScroll = () => {
                console.log('Attempting to scroll to bottom')
                aiChatRef.current?.scrollToBottom()
            }
        }
    }, [open])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return
            
            const newWidth = startWidthRef.current + (startXRef.current - e.clientX)
            const currentDirection = e.clientX > startXRef.current ? 'right' : 'left'
            dragDirectionRef.current = currentDirection
            setDragDirection(currentDirection)
            
            const clampedWidth = Math.max(MIN_OVERLAY_WIDTH, Math.min(MAX_OVERLAY_WIDTH, newWidth))
            
            setIsAtMinWidth(clampedWidth <= MIN_OVERLAY_WIDTH)
            setIsAtMaxWidth(clampedWidth >= MAX_OVERLAY_WIDTH)
            
            // Only close if dragging right consistently and beyond close threshold
            if (newWidth < CLOSE_THRESHOLD && dragDirectionRef.current === 'right' && currentDirection === 'right') {
                onClose()
                return
            }
            
            // Open overlay if dragging left consistently and beyond close threshold
            if (newWidth > CLOSE_THRESHOLD && dragDirectionRef.current === 'left' && currentDirection === 'left') {
                openAIOverlay()
            }
            
            setAIOverlayWidth(clampedWidth)
        }

        const handleMouseUp = () => {
            setIsResizing(false)
            setDragDirection(null)
            dragDirectionRef.current = null
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
    }, [isResizing, dragDirection, setAIOverlayWidth, onClose])

    const handleResizeStart = (e: React.MouseEvent) => {
        // Only allow resizing when overlay is open
        if (!open) return
        
        setIsResizing(true)
        startXRef.current = e.clientX
        startWidthRef.current = aiOverlayWidth
    }

    return (
        <div 
            ref={drawerRef}
            className={styles.aiDrawer}
            style={{ 
                width: open ? `${aiOverlayWidth}px` : '0px',
                visibility: open ? 'visible' : 'hidden',
                overflow: 'hidden'
            }}
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
            <div className={classnames(styles.resizeHandle, {
                [styles.atMinWidth]: isAtMinWidth,
                [styles.atMaxWidth]: isAtMaxWidth,
            })} onMouseDown={handleResizeStart} />
            <div className={styles.content}>
                <AIChat 
                    ref={aiChatRef}
                    onClose={onClose} 
                />
            </div>
        </div>
    )
}
