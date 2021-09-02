import Head from 'next/head'
import React from 'react'
import { useIntl } from '@core/next/intl'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { Typography, Row, Col } from 'antd'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { CreateMeterReadingsForm } from '../../domains/meter/components/CreateMeterReadingsForm'
import { useOrganization } from '@core/next/organization'

interface ICreateContactPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const CreateMeterPage: ICreateContactPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'meter.AddMeterReadings' })

    const { organization, link: { role: role } } = useOrganization()

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={[12, 40]}>
                        <Col span={24}>
                            <Typography.Title level={1} style={{ margin: 0 }}>{PageTitle}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <CreateMeterReadingsForm organization={organization} role={role} />
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

CreateMeterPage.headerAction = <ReturnBackHeaderAction
    descriptor={{ id: 'meter.MeterReadingsLog' }}
    path={'/meter'}/>
CreateMeterPage.requiredAccess = OrganizationRequired

export default CreateMeterPage