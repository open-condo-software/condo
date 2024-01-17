import React, { useContext, useState } from 'react'

type TourContextValue = {
    currentStep?: number
    setCurrentStep?: React.Dispatch<React.SetStateAction<number>>
}

const TourContext = React.createContext<TourContextValue>({})

export const useTourContext = () => useContext(TourContext)

type TourContextProps = {
    children: React.ReactNode
}

export const TourContextProvider: React.FC<TourContextProps> = ({ children }) => {
    const [currentStep, setCurrentStep] = useState<number>(0)

    return (
        <TourContext.Provider value={{ currentStep, setCurrentStep }}>
            {children}
        </TourContext.Provider>
    )
}