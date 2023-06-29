import getConfig from 'next/config'
import { useState } from 'react'

const {
    publicRuntimeConfig,
} = getConfig()

const { checkTLSClientCertPath } = publicRuntimeConfig

interface IUseCheckSSLClientCert {
    loading: boolean
    checkSSLClientCert: () => void
}

type UseCheckSSLClientCertProps = {
    onSuccess: () => void
    onFail: () => void
}


export const useCheckTLSClientCert = ({ onSuccess, onFail }: UseCheckSSLClientCertProps): IUseCheckSSLClientCert => {
    const [loading, setLoading] = useState(false)

    async function checkSSLClientCert () {
        setLoading(true)
        try {
            const response = await fetch(checkTLSClientCertPath)
            if (response.ok) {
                onSuccess()
            } else {
                console.error('Not successful response from server to check TLS. Probably it is not related to client TLS certificate status check')
            }
        } catch (e) {
            onFail()
        }
        setLoading(false)
    }

    return { loading, checkSSLClientCert }
}