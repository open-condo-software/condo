import { Table, Row, Col, RowProps, Form, Upload } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

import { useCachePersistor } from '@open-condo/apollo'
import { PlusCircle } from '@open-condo/icons'
import { nonNull } from '@open-condo/miniapp-utils/helpers/collections'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Button, Modal, Input, Alert, Typography } from '@open-condo/ui'

import { EmptyTableFiller } from '@/domains/common/components/EmptyTableFiller'
import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'
import { Section, SubSection } from '@/domains/miniapp/components/AppSettings'
import { CurrentBuildsInfo } from '@/domains/miniapp/components/B2CApp/edit/builds/CurrentBuildsInfo'
import { UploadText } from '@/domains/miniapp/components/UploadText'
import {
    B2C_BUILD_ALLOWED_MIMETYPES,
    B2C_BUILD_MAX_FILE_SIZE_IN_BYTES,
    B2C_BUILD_VERSION_REGEXP,
    DEFAULT_PAGE_SIZE,
} from '@/domains/miniapp/constants/common'
import { useFileSizeFormatter } from '@/domains/miniapp/hooks/useFileSizeFormatter'
import { useFileValidator } from '@/domains/miniapp/hooks/useFileValidator'
import { useMutationCompletedHandler } from '@/domains/miniapp/hooks/useMutationCompletedHandler'
import { getCurrentPage } from '@/domains/miniapp/utils/query'
import { INVALID_MIMETYPE } from '@dev-portal-api/domains/common/constants/errors'
import { B2C_APP_BUILD_UNIQUE_VERSION_CONSTRAINT } from '@dev-portal-api/domains/miniapp/constants/constraints'
import { INVALID_BUILD_VERSION } from '@dev-portal-api/domains/miniapp/constants/errors'

import styles from './BuildsSection.module.css'

import type { UploadChangeParam, UploadFile } from 'antd/lib/upload/interface'

import {
    useCreateB2CAppBuildMutation,
    useAllB2CAppBuildsQuery,
} from '@/gql'


const ROW_BUTTON_GUTTER: RowProps['gutter'] = [60, 60]
const ROW_BUILDS_GUTTER: RowProps['gutter'] = [40, 40]
const ROW_FORM_GUTTER: RowProps['gutter'] = [0, 0]
const FULL_COL_SPAN = 24
const PAGINATION_POSITION = ['bottomLeft' as const]
const BUILD_FORM_ERROR_TO_FIELD_MAPPING = {
    [B2C_APP_BUILD_UNIQUE_VERSION_CONSTRAINT]: 'version',
    [INVALID_BUILD_VERSION]: 'version',
    [INVALID_MIMETYPE]: 'data',
}
const SEMVER_RULES_LINK = 'https://semver.org'

function getFormFile (e: UploadChangeParam) {
    return e.fileList
}

type BuildFormValues = {
    version: string
    data: Array<UploadFile>
}

export const BuildsSection: React.FC<{ id: string }> = ({ id }) => {
    const formatFileSize = useFileSizeFormatter()
    const intl = useIntl()
    const BuildsTitle = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.builds.title' })
    const VersionColumnTitle = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.builds.table.columns.version.title' })
    const CreatedAtColumnTitle = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.builds.table.columns.createdAt.title' })
    const AddBuildLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.builds.actions.addBuild' })
    const NewBuildModalTitle = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.builds.newBuildModal.title' })
    const VersionFormLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.builds.newBuildModal.form.items.version.label' })
    const UploadBuildMessage = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.builds.newBuildModal.form.items.uploadBuild.label' })
    const UploadActionLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.builds.newBuildModal.form.actions.upload' })
    const NonSemanticVersionErrorMessage = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.builds.newBuildModal.form.items.version.validations.nonSemantic.message' })
    const NonUniqueVersionErrorMessage = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.builds.newBuildModal.form.items.version.validations.nonUnique.message' })
    const BuildLimitationsTitle = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.builds.newBuildModal.form.info.limitations.title' })
    const EmptyTableMessage = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.builds.table.empty.message' })
    const SemVerFragment = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.builds.newBuildModal.form.info.limitations.version.semVerCorrect.fragment' })
    const VersionLimitationsMessage = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.builds.newBuildModal.form.info.limitations.version.message' }, {
        semVerCorrect: (
            <Typography.Link target='_blank' href={SEMVER_RULES_LINK}>
                {SemVerFragment}
            </Typography.Link>
        ),
    })
    const FormatLimitationsMessage = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.builds.newBuildModal.form.info.limitations.format.message' }, {
        format: '.zip',
    })
    const SizeLimitationsMessage = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.builds.newBuildModal.form.info.limitations.size.message' }, {
        limit: formatFileSize(B2C_BUILD_MAX_FILE_SIZE_IN_BYTES),
    })

    const { persistor } = useCachePersistor()

    const [isUploading, setIsUploading] = useState(false)

    const router = useRouter()
    const { p } = router.query
    const page = getCurrentPage(p)

    const { data } = useAllB2CAppBuildsQuery({
        variables: {
            where: { app: { id } },
            first: DEFAULT_PAGE_SIZE,
            skip: DEFAULT_PAGE_SIZE * (page - 1),
        },
        skip: !persistor,
    })

    const builds = (data?.builds || []).filter(nonNull)


    const [uploadModalOpen, setUploadModalOpen] = useState(false)

    const [form] = Form.useForm()

    const handleOpenModal = useCallback(() => {
        setUploadModalOpen(true)
    }, [])

    const handleCloseModal = useCallback(() => {
        setUploadModalOpen(false)
        form.resetFields()
    }, [form])

    const onError = useMutationErrorHandler({
        form,
        typeToFieldMapping: BUILD_FORM_ERROR_TO_FIELD_MAPPING,
        constraintToMessageMapping: {
            [B2C_APP_BUILD_UNIQUE_VERSION_CONSTRAINT]: NonUniqueVersionErrorMessage,
        },
    })
    const onCompletedInform = useMutationCompletedHandler()
    const onCompleted = useCallback(() => {
        onCompletedInform()
        handleCloseModal()
    }, [handleCloseModal, onCompletedInform])
    const [createB2CAppBuildMutation] = useCreateB2CAppBuildMutation({
        onError,
        onCompleted,
        update: (cache) => {
            cache.evict({ id: 'ROOT_QUERY', fieldName: 'allB2CAppBuilds' })
            cache.gc()
        },
    })

    const handleUploadBuild = useCallback((values: BuildFormValues) => {
        setIsUploading(true)
        createB2CAppBuildMutation({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    version: values.version,
                    data: values.data[0].originFileObj,
                    app: { connect: { id } },
                },
            },
        }).finally(() => setIsUploading(false))
    }, [createB2CAppBuildMutation, id])

    const handlePaginationChange = useCallback((newPage: number) => {
        router.replace({ query: { ...router.query, p: newPage } },  undefined, { locale: router.locale })
    }, [router])

    const beforeUpload = useFileValidator({
        restrictMimeTypes: B2C_BUILD_ALLOWED_MIMETYPES,
        sizeLimit: B2C_BUILD_MAX_FILE_SIZE_IN_BYTES,
    })

    const { trimValidator, requiredFileValidator } = useValidations()

    const columns = [
        {
            title: VersionColumnTitle,
            dataIndex: 'version',
            key: 'version',
            width: '70%',
        },
        {
            title: CreatedAtColumnTitle,
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: '30%',
            render: (text: string) => intl.formatDate(text),
        },
    ]

    return (
        <Section>
            <SubSection title={BuildsTitle}>
                <Row gutter={ROW_BUILDS_GUTTER}>
                    <Col span={FULL_COL_SPAN}>
                        <CurrentBuildsInfo id={id}/>
                    </Col>
                    <Col span={FULL_COL_SPAN}>
                        <Row gutter={ROW_BUTTON_GUTTER}>
                            <Col span={FULL_COL_SPAN}>
                                <Table
                                    columns={columns}
                                    bordered
                                    dataSource={builds}
                                    pagination={{
                                        pageSize: DEFAULT_PAGE_SIZE,
                                        position: PAGINATION_POSITION,
                                        showSizeChanger: false,
                                        total: data?.meta?.count || 0,
                                        simple: true,
                                        current: page,
                                        onChange: handlePaginationChange,
                                    }}
                                    rowKey='version'
                                    locale={{ emptyText: <EmptyTableFiller message={EmptyTableMessage}/> }}
                                />
                            </Col>
                            <Col span={FULL_COL_SPAN}>
                                <Button type='primary' icon={<PlusCircle size='medium'/>} onClick={handleOpenModal}>
                                    {AddBuildLabel}
                                </Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>
                {uploadModalOpen && (
                    <Modal
                        open={uploadModalOpen}
                        title={NewBuildModalTitle}
                        onCancel={handleCloseModal}
                        footer={<Button type='primary' disabled={isUploading} loading={isUploading} onClick={form.submit}>{UploadActionLabel}</Button>}
                    >
                        <Form
                            name='create-app-build'
                            layout='vertical'
                            form={form}
                            onFinish={handleUploadBuild}
                        >
                            <Row gutter={ROW_FORM_GUTTER}>
                                <Col span={FULL_COL_SPAN}>
                                    <Form.Item name='version' label={VersionFormLabel} rules={[trimValidator, {
                                        pattern: B2C_BUILD_VERSION_REGEXP,
                                        message: NonSemanticVersionErrorMessage,
                                    }]}>
                                        <Input placeholder='1.0.0-development'/>
                                    </Form.Item>
                                </Col>
                                <Col span={FULL_COL_SPAN}>
                                    <Form.Item name='data' valuePropName='fileList' getValueFromEvent={getFormFile} rules={[requiredFileValidator]}>
                                        <Upload
                                            maxCount={1}
                                            listType='picture'
                                            beforeUpload={beforeUpload}
                                            multiple={false}
                                        >
                                            <UploadText>{UploadBuildMessage}</UploadText>
                                        </Upload>
                                    </Form.Item>
                                </Col>
                                <Col span={FULL_COL_SPAN}>
                                    <Alert type='info' message={BuildLimitationsTitle} description={
                                        <ul className={styles.limitationsList}>
                                            <li><Typography.Paragraph size='medium'>{VersionLimitationsMessage}</Typography.Paragraph></li>
                                            <li><Typography.Paragraph size='medium'>{FormatLimitationsMessage}</Typography.Paragraph></li>
                                            <li><Typography.Paragraph size='medium'>{SizeLimitationsMessage}</Typography.Paragraph></li>
                                        </ul>
                                    }/>
                                </Col>
                            </Row>
                        </Form>
                    </Modal>
                )}
            </SubSection>
        </Section>
    )
}