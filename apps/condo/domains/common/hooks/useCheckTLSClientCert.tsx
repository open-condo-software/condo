import getConfig from 'next/config'
import { useState } from 'react'

const {
    publicRuntimeConfig,
} = getConfig()

type UseCheckSSLClientCertProps = {
    onSuccess: () => Promise<void>
    onFail: () => Promise<void>
}

interface IUseCheckSSLClientCert {
    loading: boolean
    checkSSLClientCert: () => Promise<void>
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
            if (response.ok) {
                await onSuccess()
            } else {
                // Due to lack of appropriate API in Sber and due to inability to get response status, we are making an assumption about certificate issue on the client when response is not successful.
                // But, not successful response from server may not mean an issue with certificate on the client.
                // When the assumption is wrong, there is a LoginWithSBBOLButton on `/tls` page with disabled checking of TLS certificate. So, a user can reach authorization in SberBusiness.
                await onFail()
            }
        } catch (e) {
            // There is no possibility to catch `net::ERR_CERT_AUTHORITY_INVALID` error, because it occurs on transport level
            // and in case of failure, we get a generic error. Assume that this error is a TLS error
            await onFail()
        }
        setLoading(false)
    }

    return {
        loading,
        checkSSLClientCert,
    }
}
