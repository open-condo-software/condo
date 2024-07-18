import { Col, Image } from 'antd'
import get from 'lodash/get'

import { B2BApp } from '@condo/domains/miniapp/utils/clientSchema'

type B2bAppLogoProps = {
    isAutomatic: boolean
    b2bAppId: string
}

const B2bAppLogo = ({ isAutomatic, b2bAppId }: B2bAppLogoProps): JSX.Element => {
    
    const {
        obj: b2bApp,
        loading: isB2bAppLoading,
    } = B2BApp.useObject(
        { where: { id: b2bAppId } }
    )

    return (
        <>
            {isAutomatic && !isB2bAppLoading && b2bApp && (
                <Col span={4}>
                    <Image
                        src={get(b2bApp, ['logo', 'publicUrl'])}
                        alt='miniapp-image'
                        preview={false}
                    />
                </Col>
            )}
        </>

    )
}

export default B2bAppLogo