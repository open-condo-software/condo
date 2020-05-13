import { AuthContext } from '../../lib/auth'

export function AuthLayout({ children }) {
    return (
        <AuthContext.Consumer>
            {
                ({isAuthenticated, isLoading}) => {
                    if (isLoading) {
                        return "Загрузка..."
                    }

                    if (!isAuthenticated) {
                        return "Страница доступна только авторизованному пользователю"
                    }

                    return children
                }
            }
        </AuthContext.Consumer>
    )
}
