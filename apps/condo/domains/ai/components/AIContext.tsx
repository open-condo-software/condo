import React, { createContext, useContext, useState, ReactNode } from 'react'

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

export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const storage = new LocalStorageManager<number>()
    
    const [isAIOverlayOpen, setIsAIOverlayOpen] = useState(false)
    const [aiOverlayWidth, setAIOverlayWidthState] = useState(() => {
        return storage.getItem('aiOverlayWidth') || 600
    })

    const setAIOverlayWidth = (width: number) => {
        setAIOverlayWidthState(width)
        storage.setItem('aiOverlayWidth', width)
    }

    const openAIOverlay = () => setIsAIOverlayOpen(true)
    const closeAIOverlay = () => setIsAIOverlayOpen(false)

    return (
        <AIContext.Provider value={{ isAIOverlayOpen, aiOverlayWidth, openAIOverlay, closeAIOverlay, setAIOverlayWidth }}>
            {children}
        </AIContext.Provider>
    )
}
