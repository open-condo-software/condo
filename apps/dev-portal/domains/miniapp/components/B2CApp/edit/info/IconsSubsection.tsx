import { Upload, Row, Col, Form } from 'antd'
import get from 'lodash/get'
import React, { useCallback } from 'react'
import { useIntl } from 'react-intl'

import { Button, Typography } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { getClientSideSenderInfo } from '@/domains/common/utils/userid.utils'
import { UploadText } from '@/domains/miniapp/components/UploadText'
import {
    DEFAULT_B2C_LOGO_URL,
    B2C_LOGO_MIN_SIZE,
    B2C_LOGO_MAX_SIZE,
    B2C_LOGO_ALLOWED_MIMETYPES,
    B2C_LOGO_MAX_FILE_SIZE_IN_BYTES,
} from '@/domains/miniapp/constants/common'
import { useFileValidator } from '@/domains/miniapp/hooks/useFileValidator'
import { useMutationCompletedHandler } from '@/domains/miniapp/hooks/useMutationCompletedHandler'

import { B2CAppCard } from './B2CAppCard'
import styles from './IconsSubsection.module.css'

import type { RowProps } from 'antd'
import type { UploadChangeParam, UploadFile } from 'antd/lib/upload/interface'

import { AllAppsDocument, GetB2CAppDocument, useGetB2CAppQuery, useUpdateB2CAppMutation } from '@/lib/gql'

const ROW_ICONS_CONTENT_GUTTER: RowProps['gutter'] = [12, 12]
const FORM_BUTTON_ROW_GUTTER: RowProps['gutter'] = [32, 32]
const FULL_COL_SPAN = 24

function getFormFile (e: UploadChangeParam) {
    return e.fileList
}

type IconsFormValues = {
    mainIcon: Array<UploadFile>
}

export const IconsSubsection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const SaveButtonLabel = intl.formatMessage({ id: 'global.actions.save' })
    const MainIconTitle = intl.formatMessage({ id: 'apps.b2c.sections.info.icons.items.main.title' })
    const MainIconDescription = intl.formatMessage({ id: 'apps.b2c.sections.info.icons.items.main.description' }, {
        format: 'png',
        minSize: B2C_LOGO_MIN_SIZE,
        maxSize: B2C_LOGO_MAX_SIZE,
    })
    const UploadImageMessage = intl.formatMessage({ id: 'apps.b2c.sections.info.icons.actions.uploadImage' })

    const { data } = useGetB2CAppQuery({ variables: { id } })

    const name = get(data, ['app', 'name'], '')
    const logo = get(data, ['app', 'logo', 'publicUrl'], DEFAULT_B2C_LOGO_URL)

    const [form] = Form.useForm()

    const onCompletedInform = useMutationCompletedHandler()
    const onError = useMutationErrorHandler()
    const onCompleted = useCallback(() => {
        onCompletedInform()
        form.resetFields()
    }, [form, onCompletedInform])
    const [updateB2CAppMutation] = useUpdateB2CAppMutation({
        refetchQueries: [
            AllAppsDocument,
            {
                query: GetB2CAppDocument,
                variables: { id },
            },
        ],
        onError,
        onCompleted,
    })

    const beforeUpload = useFileValidator({
        restrictMimeTypes: B2C_LOGO_ALLOWED_MIMETYPES,
        sizeLimit: B2C_LOGO_MAX_FILE_SIZE_IN_BYTES,
        dimensionsLimit: {
            max: { width: B2C_LOGO_MAX_SIZE, height: B2C_LOGO_MAX_SIZE },
            min: { width: B2C_LOGO_MIN_SIZE, height: B2C_LOGO_MIN_SIZE },
        },
    })

    const handleIconSave = useCallback((values: IconsFormValues) => {
        if (values.mainIcon.length) {
            updateB2CAppMutation({
                variables: {
                    id,
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        logo: values.mainIcon[0].originFileObj,
                    },
                },
            })
        }
    }, [id, updateB2CAppMutation])

    return (
        <Form
            form={form}
            onFinish={handleIconSave}
        >
            <Row gutter={FORM_BUTTON_ROW_GUTTER}>
                <Col span={FULL_COL_SPAN} className={styles.subSectionContainer}>
                    <B2CAppCard name={name} logo={logo}/>
                    <Row gutter={ROW_ICONS_CONTENT_GUTTER}>
                        <Col span={FULL_COL_SPAN}>
                            <Typography.Title type='secondary' level={4}>{MainIconTitle}</Typography.Title>
                        </Col>
                        <Col span={FULL_COL_SPAN}>
                            <Typography.Paragraph size='medium'>{MainIconDescription}</Typography.Paragraph>
                        </Col>
                        <Col span={FULL_COL_SPAN}>
                            <Form.Item name='mainIcon' valuePropName='fileList' getValueFromEvent={getFormFile}>
                                <Upload
                                    listType='picture'
                                    beforeUpload={beforeUpload}
                                    maxCount={1}
                                    multiple={false}
                                >
                                    <UploadText>{UploadImageMessage}</UploadText>
                                </Upload>
                            </Form.Item>
                        </Col>
                    </Row>
                </Col>
                <Col span={FULL_COL_SPAN}>
                    <Button type='primary' htmlType='submit'>
                        {SaveButtonLabel}
                    </Button>
                </Col>
            </Row>
        </Form>
    )
}