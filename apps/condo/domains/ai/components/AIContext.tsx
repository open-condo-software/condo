import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'

interface AIContextType {
    isAIOverlayOpen: boolean
    aiOverlayWidth: number
    openAIOverlay: () => void
    closeAIOverlay: () => void
    setAIOverlayWidth: (width: number) => void
}

const AIContext = createContext<AIContextType | undefined>(undefined)

export const useAIContext = () => {
    const context = useContext(AIContext)
    if (!context) {
        throw new Error('useAIContext must be used within an AIProvider')
    }
    return context
}

const AI_OVERLAY_MIN_WIDTH = 320

export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const storage = new LocalStorageManager<number>()
    
    const [isAIOverlayOpen, setIsAIOverlayOpen] = useState(false)
    const [aiOverlayWidth, setAIOverlayWidthState] = useState(() => {
        const storedWidth = storage.getItem('ai-assistant-overlay-width')
        return Math.max(AI_OVERLAY_MIN_WIDTH, storedWidth || AI_OVERLAY_MIN_WIDTH)
    })

    const setAIOverlayWidth = (width: number) => {
        setAIOverlayWidthState(width)
        storage.setItem('ai-assistant-overlay-width', width)
    }

    const openAIOverlay = useCallback(() => setIsAIOverlayOpen(true), [])
    const closeAIOverlay = useCallback(() => setIsAIOverlayOpen(false), [])

    return (
        <AIContext.Provider value={{ isAIOverlayOpen, aiOverlayWidth, openAIOverlay, closeAIOverlay, setAIOverlayWidth }}>
            {children}
        </AIContext.Provider>
    )
}
