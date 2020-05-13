import { AuthContext } from '../../lib/auth'
import Translate from '../../components/Translate'

export function AuthLayout({ children }) {
    return (
        <AuthContext.Consumer>
            {
                ({isAuthenticated, isLoading}) => {
                    if (isLoading) {
                        return <Translate id={"Loading"}/>
                    }

                    if (!isAuthenticated) {
                        return <Translate id={"PageUnavailable"}/>
                    }

                    return children
                }
            }
        </AuthContext.Consumer>
    )
}
