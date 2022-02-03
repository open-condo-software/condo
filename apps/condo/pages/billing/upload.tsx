import React, { useCallback, useState } from 'react'
import Head from 'next/head'
import Error from 'next/error'
import { Row, Col } from 'antd'
import { PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { Button } from '@condo/domains/common/components/Button'
import { TitleHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { FeatureFlagRequired } from '@condo/domains/common/components/containers/FeatureFlag'
import { ImportModal } from '@condo/domains/billing/components/ImportModal'


const BillingDemoPage = () => {
    const [modalVisible, setModalVisible] = useState(false)
    const closeModal = useCallback(() => {
        setModalVisible(false)
    }, [])
    const showModal = useCallback(() => {
        setModalVisible(true)
    }, [])

    return (
        <FeatureFlagRequired
            fallback={<Error statusCode={404}/>}
            name={'paymentsRegister'}
        >
            <Head>
                <title>Demo billing page</title>
            </Head>
            <PageWrapper>
                <Row gutter={[40, 40]}>
                    <Col span={12}>
                        <Button
                            type='sberDefaultGradient'
                            size='large'
                            onClick={showModal}
                        >
                            Открыть модалку
                        </Button>
                    </Col>
                </Row>

                <ImportModal
                    visible={modalVisible}
                    onClose={closeModal}
                />
            </PageWrapper>
        </FeatureFlagRequired>
    )
}

BillingDemoPage.headerAction = <TitleHeaderAction descriptor={{ id:'menu.Billing' }}/>
BillingDemoPage.requiredAccess = OrganizationRequired

export default BillingDemoPage