import { useOnBoardingContext } from './OnBoardingContext'

export const OnBoardingProgressIconContainer = ({ children }) => {
    const { progress } = useOnBoardingContext()

    return progress < 100 ? children : null
}