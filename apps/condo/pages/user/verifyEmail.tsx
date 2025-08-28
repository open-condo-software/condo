import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { decrypt } from '@condo/domains/common/utils/crypto'

import type { GetServerSideProps } from 'next'


export default function VerifyEmail ({ redirectUrl, operation, secretCode, token }) {
    // TODO(DOMA-12179): add logic VerifyEmail
    console.log({
        redirectUrl, operation, secretCode, token,
    })

    if (!operation || !secretCode || !token) {
        return <>Failed to verify email</>
    }

    return <>Loading...</>
}

VerifyEmail.requiredAccess = AuthRequired

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { query } = context
    const { token = '' } = query

    let data = {} as any
    try {
        const decodedToken = decrypt(token)
        data = JSON.parse(decodedToken)
    } catch (error) {
        console.error('Unable to decode email verification token!')
        console.error(error)
    }
    
    return {
        props: {
            redirectUrl: data?.redirectUrl || null,
            operation: data?.operation || null,
            secretCode: data?.secretCode || null,
            token: data?.token || null,
        },
    }
}
