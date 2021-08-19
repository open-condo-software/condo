import { useOnBoardingContext } from './OnBoardingContext'

export const OnBoardingProgressIconContainer = ({ children }) => {
    const { progress, isLoading } = useOnBoardingContext()

    return isLoading || progress < 100 ? children : null
}
