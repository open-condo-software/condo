import React, { useContext, useState } from 'react'

type SecretContextType = {
    secret: string | null
    setSecret: (secret: string | null) => void
}

const SecretContext = React.createContext<SecretContextType>({
    secret: null,
    setSecret: () => ({}),
})

export const SecretContextProvider: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const [secret, setSecret] = useState<string | null>(null)

    return (
        <SecretContext.Provider
            value={{
                secret,
                setSecret,
            }}
        >
            {children}
        </SecretContext.Provider>
    )
}

export const useSecretContext = (): SecretContextType => useContext(SecretContext)
