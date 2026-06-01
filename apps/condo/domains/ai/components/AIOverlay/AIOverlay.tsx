import classnames from 'classnames'
import React, { useState, useRef, useEffect, useMemo } from 'react'
import { v4 as uuidV4 } from 'uuid'

import { Close, RefreshCw } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Typography } from '@open-condo/ui'

import { analytics } from '@condo/domains/common/utils/analytics'
import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'


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
const AI_SESSION_STORAGE_KEY = 'condo-ai-chat-session-id'
const EMPTY_AI_SESSION_ID = ''

export const AIOverlay: React.FC<AIOverlayProps> = ({ open, onClose }) => {
    const intl = useIntl()
    const { organization } = useOrganization()

    const title = intl.formatMessage({ id: 'ai.chat.title' })
    const resetHistoryLabel = intl.formatMessage({ id: 'ai.chat.resetHistory' })
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

    const [aiSessionId, setAiSessionId] = useState<string | null>(null)

    const openRef = useRef(open)

    useEffect(() => {
        openRef.current = open
    }, [open])

    const handleResetHistory = () => {
        void analytics.track('ai_assistant_reset_history', {
            aiSessionId: aiSessionId ?? EMPTY_AI_SESSION_ID,
        })
        const newSessionId = uuidV4()
        const aiSessionStorage = sessionStorage.getItem(AI_SESSION_STORAGE_KEY) || {}
        if (organization) {
            aiSessionStorage[organization.id] = newSessionId
        }
        sessionStorage.setItem(AI_SESSION_STORAGE_KEY, aiSessionStorage)
        setAiSessionId(newSessionId)
    }

    const sessionStorage = useMemo(() => new LocalStorageManager<Record<string, string>>(), [])

    useEffect(() => {
        const aiSessionStorage = sessionStorage.getItem(AI_SESSION_STORAGE_KEY) || {}

        if (organization && aiSessionStorage[organization.id]) {
            setAiSessionId(aiSessionStorage[organization.id])
        } else {
            const newSessionId = uuidV4()
            if (organization) {
                aiSessionStorage[organization.id] = newSessionId
                sessionStorage.setItem(AI_SESSION_STORAGE_KEY, aiSessionStorage)
            }
            setAiSessionId(newSessionId)
        }
    }, [sessionStorage, organization])

    useEffect(() => {
        if (aiSessionId && organization) {
            const aiSessionStorage = sessionStorage.getItem(AI_SESSION_STORAGE_KEY) || {}
            aiSessionStorage[organization.id] = aiSessionId
            sessionStorage.setItem(AI_SESSION_STORAGE_KEY, aiSessionStorage)
        }
    }, [aiSessionId, organization])

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
            if (!openRef.current) {
                void analytics.track('ai_assistant_close', { aiSessionId: aiSessionId ?? EMPTY_AI_SESSION_ID })
            }
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
    }, [isResizing, dragDirection, setAIOverlayWidth, onClose, openAIOverlay])

    const handleResizeStart = (e: React.MouseEvent) => {
        // Only allow resizing when overlay is open
        if (!open) return

        setIsResizing(true)
        startXRef.current = e.clientX
        startWidthRef.current = aiOverlayWidth
    }

    const handleCloseButtonClick = () => {
        void analytics.track('ai_assistant_close', { aiSessionId: aiSessionId ?? EMPTY_AI_SESSION_ID })
        onClose()
    }

    return (
        <div
            ref={drawerRef}
            className={styles.aiDrawer}
            style={{
                width: open ? `${aiOverlayWidth}px` : '0px',
                visibility: open ? 'visible' : 'hidden',
                overflow: 'hidden',
            }}
        >
            <div className={styles.header}>
                <div className={styles.leftSection}>
                    <Typography.Title level={5}>
                        {title}
                    </Typography.Title>
                </div>
                <div className={styles.rightSection}>
                    <Button
                        type='primary'
                        size='medium'
                        compact
                        minimal
                        onClick={handleResetHistory}
                        icon={<RefreshCw size='large' />}
                        title={resetHistoryLabel}
                    />
                    <Button
                        type='primary'
                        size='medium'
                        compact
                        minimal
                        onClick={handleCloseButtonClick}
                        icon={<Close size='large' />}
                        title={closeLabel}
                    />
                </div>
            </div>
            <div className={classnames(styles.resizeHandle, {
                [styles.atMinWidth]: isAtMinWidth,
                [styles.atMaxWidth]: isAtMaxWidth,
            })} onMouseDown={handleResizeStart} />
            <div className={styles.content}>
                {aiSessionId && (
                    <AIChat
                        aiSessionId={aiSessionId}
                    />
                )}
            </div>
        </div>
    )
}
