import { useAuth } from '@core/next/auth'

import Translate from '../components/Translate'
import PageLoader from '../components/PageLoader'

export function AuthLayout({ children }) {
    const {isAuthenticated, isLoading} = useAuth();

    if (isLoading) {
        return (<PageLoader/>)
    }

    if (!isAuthenticated) {
        return <Translate id={"PageUnavailable"}/>
    }

    return children
}
