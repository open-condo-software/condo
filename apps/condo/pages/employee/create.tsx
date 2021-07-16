import { Typography, Row, Col, Card } from 'antd'
import Head from 'next/head'
import React, { useMemo } from 'react'
import { useIntl } from '@core/next/intl'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import { colors } from '@condo/domains/common/constants/style'
import { CreateEmployeeForm } from '@condo/domains/organization/components/CreateEmployeeForm'
import { useState } from 'react'

interface IPageWithHeaderAction extends React.FC {
    headerAction?: JSX.Element
}

const CreateEmployeePage: IPageWithHeaderAction = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'employee.AddEmployee' }, {
        
    })
    
    const [selectedRole, setSelectedRole] = useState<string>('Administrator')
    const roleTranslations = useMemo(() => ({
        title: intl.formatMessage({ id: `employee.role.title.${selectedRole}` }),
        description: intl.formatMessage({ id: `employee.role.description.${selectedRole}` }),
    }),
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
                            {roleTranslations.title && roleTranslations.description && <Card
                                title={roleTranslations.title}
                                bordered={false}
                                style={{
                                    width: 300,
                                    height: 'min-content',
                                    boxShadow: ' 0px 9px 28px 8px rgba(0, 0, 0, 0.05), 0px 6px 16px rgba(0, 0, 0, 0.08), 0px 3px 6px -4px rgba(0, 0, 0, 0.12)',
                                }}
                                headStyle={{
                                    color: colors.lightGrey[10],
                                    fontSize: 24,
                                    fontWeight: 'bold',
                                }}
                            >
                                {roleTranslations.description}
                            </Card>}
                        </Row>
                    </PageContent>
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}

const HeaderAction = () => {
    const intl = useIntl()
    const AllPropertiesMessage = intl.formatMessage({ id: 'pages.condo.employee.PageTitle' })

    return (
        <LinkWithIcon
            icon={<ArrowLeftOutlined style={{ color: colors.white }} />}
            path={'/employee/'}
        >
            {AllPropertiesMessage}
        </LinkWithIcon>
    )
}

CreateEmployeePage.headerAction = <HeaderAction />

export default CreateEmployeePage
