import getConfig from 'next/config'
import { useState } from 'react'

const {
    publicRuntimeConfig,
} = getConfig()

interface IUseCheckSSLClientCert {
    loading: boolean
    checkSSLClientCert: () => void
}

export const useCheckTLSClientCert = ({ onSuccess, onFail }: UseCheckSSLClientCertProps): IUseCheckSSLClientCert => {
    const [loading, setLoading] = useState(false)

    const { checkTLSClientCertConfig: { verificationUrl } } = publicRuntimeConfig

    async function checkSSLClientCert () {
        setLoading(true)
        try {
            const response = await fetch(verificationUrl, { mode: 'no-cors' })
            // Due to "no-cors" mode, there is no information about response status
            // See https://developer.mozilla.org/en-US/docs/Web/API/Request/mode
            // > JavaScript may not access any properties of the resulting Response. This ensures that ServiceWorkers do not affect the semantics of the Web and prevents security and privacy issues arising from leaking data across domains
            if (response) {
                onSuccess()
            } else {
                console.error('Not successful response from server to verify TLS certificate, probably. Certificate may be correct and somethings is wrong on verification server', response)
            }
        } catch (e) {
            // There is no possibility to catch `net::ERR_CERT_AUTHORITY_INVALID` error, because it occurs on transport level
            // and in case of failure, we get a generic error. Assume that this error is a TLS error
            onFail()
        }
        setLoading(false)
    }

    return {
        loading,
        checkSSLClientCert,
    }
}
