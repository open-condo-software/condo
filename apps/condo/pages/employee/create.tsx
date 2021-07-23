/** @jsx jsx */
import { Typography, Row, Col, Card } from 'antd'
import Head from 'next/head'
import React, { useMemo } from 'react'
import { useIntl } from '@core/next/intl'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { colors, shadows } from '@condo/domains/common/constants/style'
import { CreateEmployeeForm } from '@condo/domains/organization/components/CreateEmployeeForm'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'

import { useState } from 'react'
import { Loader } from '../../domains/common/components/Loader'
import { css, jsx } from '@emotion/core'
interface IPageWithHeaderAction extends React.FC {
    headerAction?: JSX.Element
}
const CardCss = css`
    width: 300px;
    height: fit-content;
    ${shadows.cardShadow}
`
const CreateEmployeePage: IPageWithHeaderAction = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'employee.AddEmployee' }, {

    })

    const [selectedRole, setSelectedRole] = useState<string | null>(null)
    const roleTranslations = useMemo(() => (selectedRole ? {
        title: intl.formatMessage({ id: `employee.role.title.${selectedRole}` }),
        description: intl.formatMessage({ id: `employee.role.description.${selectedRole}` }),
    } : null),
    [selectedRole])

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <OrganizationRequired>
                    <PageContent>
                        <Row gutter={[12, 40]}>
                            <Col span={24}>
                                <Typography.Title level={1} style={{ margin: 0 }}>{PageTitleMsg}</Typography.Title>
                            </Col>
                            <Col span={10}>
                                <CreateEmployeeForm onRoleSelect={(role) => setSelectedRole(role)} />
                            </Col>
                            {roleTranslations ? <Card
                                title={roleTranslations.title}
                                bordered={false}
                                css={CardCss}
                                headStyle={{
                                    color: colors.lightGrey[10],
                                    fontSize: 24,
                                    fontWeight: 'bold',
                                }}
                            >
                                {roleTranslations.description}
                            </Card> : <Loader />}
                        </Row>
                    </PageContent>
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}

CreateEmployeePage.headerAction = <ReturnBackHeaderAction
    descriptor={{ id: 'pages.condo.employee.PageTitle' }}
    path={'/employee/'}/>

export default CreateEmployeePage
