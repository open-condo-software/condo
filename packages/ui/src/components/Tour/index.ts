import { TourContextProvider, useTourContext } from './tourContext'
import { TourStep } from './tourStep'
import './style.less'

export type { TourStepProps } from './tourStep'

export type TourType = {
    TourStep: typeof TourStep
    Provider: typeof TourContextProvider
    useTourContext: typeof useTourContext
}

const Tour: TourType = {
    TourStep,
    Provider: TourContextProvider,
    useTourContext,
}

export { Tour }