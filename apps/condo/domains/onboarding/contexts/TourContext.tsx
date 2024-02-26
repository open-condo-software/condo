import { createContext, useCallback, useContext, useState } from 'react'

import { FIRST_LEVEL_STEPS, SECOND_LEVEL_STEPS, STEP_TYPES, ACTIVE_STEPS_STORAGE_KEY } from '@condo/domains/onboarding/constants/steps'


type ActiveTourStepType = {
    firstLevel?: typeof FIRST_LEVEL_STEPS[number]
    secondLevel?: typeof SECOND_LEVEL_STEPS[number]
}

type TourContextType = {
    activeTourStep: ActiveTourStepType
    setActiveTourStep: (stepType: typeof STEP_TYPES) => void
}

const initialActiveTourStepValue: ActiveTourStepType = {
    firstLevel: null,
    secondLevel: null,
}

const TourContext = createContext<TourContextType>({
    activeTourStep: initialActiveTourStepValue,
    setActiveTourStep: () => { return },
})

const getActiveTourStepFromStorage = (): ActiveTourStepType => {
    try {
        return JSON.parse(localStorage.getItem(ACTIVE_STEPS_STORAGE_KEY))
    } catch (e) {
        console.error('Failed to parse initial activeTourStep from LocalStorage')
    }
}

export const TourProvider = ({ children }) => {
    const [activeStep, setActiveStep] = useState<ActiveTourStepType>(getActiveTourStepFromStorage())

    const setActiveTourStep = useCallback((type) => {
        try {
            if (!type) {
                localStorage.removeItem(ACTIVE_STEPS_STORAGE_KEY)
                setActiveStep(null)
            }

            const previousValue: ActiveTourStepType = JSON.parse(localStorage.getItem(ACTIVE_STEPS_STORAGE_KEY)) || initialActiveTourStepValue
            const isFirstLevelStep = FIRST_LEVEL_STEPS.includes(type)

            const valueToSet: ActiveTourStepType = isFirstLevelStep ?
                { firstLevel: type, secondLevel: null } :
                { ...previousValue, secondLevel: type }

            localStorage.setItem(ACTIVE_STEPS_STORAGE_KEY, JSON.stringify(valueToSet))
            setActiveStep(valueToSet)
        } catch (e) {
            console.error('Failed to parse activeTourStep from LocalStorage')
            localStorage && localStorage.removeItem(ACTIVE_STEPS_STORAGE_KEY)
            setActiveStep(null)
        }
    }, [])

    return (
        <TourContext.Provider
            value={{
                activeTourStep: activeStep,
                setActiveTourStep,
            }}
        >
            {children}
        </TourContext.Provider>
    )
}

export const useTourContext = (): TourContextType => useContext(TourContext)