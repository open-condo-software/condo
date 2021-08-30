import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import { get, map } from 'lodash'
import { Row, Col, Typography, Table } from 'antd'
import { EditFilled } from '@ant-design/icons'
import { green } from '@ant-design/colors'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { Button } from '@condo/domains/common/components/Button'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { useObject, useSoftDelete } from '@condo/domains/division/utils/clientSchema/Division'
import { Division } from '../../../schema'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import Error from 'next/error'
import { FeatureFlagRequired } from '@condo/domains/common/components/containers/FeatureFlag'

interface IDivisionPageContentProps {
    division: Division
}

const DivisionPageContent: React.FC<IDivisionPageContentProps> = ({ division }) => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.division.id.PageTitle' }, { name: division.name })
    const NameBlankMessage = intl.formatMessage({ id: 'pages.condo.division.id.NameBlank' })
    const ResponsibleLabelMessage = intl.formatMessage({ id: 'division.field.responsible' })
    const PropertiesLabelMessage = intl.formatMessage({ id: 'division.field.properties' })
    const ExecutorsLabelMessage = intl.formatMessage({ id: 'pages.condo.division.id.ExecutorsLabel' })
    const ExecutorNameMessage = intl.formatMessage({ id: 'pages.condo.division.id.executor.name' })
    const ExecutorPhoneMessage = intl.formatMessage({ id: 'pages.condo.division.id.executor.phone' })
    const ExecutorSpecializationsMessage = intl.formatMessage({ id: 'pages.condo.division.id.executor.specializations' })
    const ExecutorSpecializationBlankMessage = intl.formatMessage({ id: 'pages.condo.division.id.executor.SpecializationBlank' })
    const ExecutorsEmptyTitleMessage = intl.formatMessage({ id: 'pages.condo.division.id.ExecutorsEmpty.title' })
    const ExecutorsEmptyDescriptionMessage = intl.formatMessage({ id: 'pages.condo.division.id.ExecutorsEmpty.description' })

    const columns = [{
        title: ExecutorNameMessage,
        dataIndex: 'name',
        key: 'name',
        render: (_, { id, name }) => (
            <Link href={`/employee/${id}`}>
                <Typography.Link style={{ color: green[6], display: 'block' }}>
                    {name}
                </Typography.Link>
            </Link>
        ),
    }, {
        title: ExecutorPhoneMessage,
        dataIndex: 'phone',
        key: 'phone',
    }, {
        title: ExecutorSpecializationsMessage,
        dataIndex: 'specializations',
        key: 'specializations',
        render: specializations => (
            specializations.length > 0
                ? map(specializations, 'name').join(', ')
                : <Typography.Text strong>{ExecutorSpecializationBlankMessage}</Typography.Text>
        ),
    }]

    // Transform executors array to make `name` attribute required. This fixes following error:
    // TS2322: Type 'OrganizationEmployee[]' is not assignable to type 'readonly { id: any; name: any; }[]'.
    // Property 'name' is optional in type 'OrganizationEmployee' but required in type '{ id: any; name: any; }'.
    const executors = division.executors.map(executor => ({
        name: executor.name || '',
        ...executor,
    }))
    return (
        <>
            <Typography.Title style={{ marginBottom: '60px' }}>
                {division.name ? PageTitleMessage : NameBlankMessage}
            </Typography.Title>
            <Row gutter={[0, 20]}>
                <PageFieldRow labelSpan={5} title={ResponsibleLabelMessage} highlight>
                    {get(division, ['responsible', 'name'])}
                </PageFieldRow>
                <PageFieldRow labelSpan={5} title={PropertiesLabelMessage}>
                    {division.properties.map(property => (
                        <Link
                            key={property.id}
                            href={`/property/${get(property, 'id')}`}
                        >
                            <Typography.Link style={{ color: green[6], display: 'block' }}>
                                {property.name || property.address}
                            </Typography.Link>
                        </Link>
                    ))}
                </PageFieldRow>
                <Col span={24}>
                    <Typography.Title
                        level={2}
                        style={{ fontSize: '20px' }}
                    >
                        {ExecutorsLabelMessage}
                    </Typography.Title>
                </Col>
                <Col span={24}>
                    {executors.length > 0 ? (
                        <Table
                            bordered
                            tableLayout={'fixed'}
                            dataSource={executors}
                            columns={columns}
                            pagination={{
                                hideOnSinglePage: true,
                            }}
                        />
                    ) : (
                        <FocusContainer>
                            <BasicEmptyListView>
                                <Typography.Title level={3}>
                                    {ExecutorsEmptyTitleMessage}
                                </Typography.Title>
                                <Typography.Text style={{ width: '37ex', display: 'block' }}>
                                    {ExecutorsEmptyDescriptionMessage}
                                </Typography.Text>
                            </BasicEmptyListView>
                        </FocusContainer>
                    )}
                </Col>
            </Row>
        </>
    )
}

interface IDivisionPageProps extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const DivisionPage: IDivisionPageProps = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.division.id.PageTitle' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const UpdateTitle = intl.formatMessage({ id: 'Edit' })
    const DivisionNotFoundMessage = intl.formatMessage({ id: 'pages.condo.division.id.PageTitleNotFound' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'division.action.delete.confirm.title' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'division.action.delete.confirm.message' })
    const DeleteDivisionLabel = intl.formatMessage({ id: 'division.action.delete.confirm.ok' })

    const router = useRouter()
    const { query: { id } } = router
    const { loading, obj: division, error } = useObject({ where: { id: id as string } })

    const handleCompleteSoftDelete = () => {
        router.push('/property/')
    }

    const softDeleteAction = useSoftDelete({}, handleCompleteSoftDelete)

    if (error || loading) {
        return <LoadingOrErrorPage title={PageTitleMsg} loading={loading} error={error ? ServerErrorMsg : null}/>
    }

    if (!division) {
        return <LoadingOrErrorPage title={DivisionNotFoundMessage} loading={loading} error={error ? ServerErrorMsg : null}/>
    }


    return (
        <FeatureFlagRequired name={'division'} fallback={<Error statusCode={404}/>}>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <DivisionPageContent division={division}/>
                    <ActionBar>
                        <Link href={`/division/${division.id}/update`}>
                            <span>
                                <Button
                                    color={'green'}
                                    type={'sberPrimary'}
                                    secondary
                                    icon={<EditFilled />}
                                    size={'large'}
                                >
                                    {UpdateTitle}
                                </Button>
                            </span>
                        </Link>
                        <DeleteButtonWithConfirmModal
                            title={ConfirmDeleteTitle}
                            message={ConfirmDeleteMessage}
                            okButtonLabel={DeleteDivisionLabel}
                            action={() => softDeleteAction({}, division)}
                        />
                    </ActionBar>
                </PageContent>
            </PageWrapper>
        </FeatureFlagRequired>
    )
}

DivisionPage.headerAction = <ReturnBackHeaderAction descriptor={{ id: 'menu.AllProperties' }} path={'/property/'}/>
DivisionPage.requiredAccess = OrganizationRequired

export default DivisionPage