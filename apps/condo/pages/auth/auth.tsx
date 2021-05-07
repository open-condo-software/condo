
import { createContext, useContext, useEffect, useRef, useState } from 'react'

const AuthContext = createContext({})

interface IAuth {
    initialUser: unknown
}
const Auth = ({ children, initialUser }): React.ReactElement<IAuth> => {
    const [user, setUser] = useState(initialUser || null)

    async function signin () {
        setUser({ id: 'aa', email: 'aaa@aa.er' })
        console.log('SIGOIN')
    }

    async function signout () {
        setUser(null)
        console.log('SIGOUT')
    }

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated: Boolean(user),
                user,
                signin,
                signout,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}
export default Auth