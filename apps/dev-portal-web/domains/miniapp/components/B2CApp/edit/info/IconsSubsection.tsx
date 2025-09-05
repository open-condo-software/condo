import { Upload, Row, Col, Form, notification } from 'antd'
import get from 'lodash/get'
import React, { useCallback } from 'react'
import { useIntl } from 'react-intl'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Button, Typography, Alert } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { UploadText } from '@/domains/miniapp/components/UploadText'
import {
    DEFAULT_B2C_LOGO_URL,
    B2C_LOGO_SIZE,
    B2C_LOGO_MAIN_COLOR,
    B2C_LOGO_SECONDARY_COLOR,
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
const ICON_WARNING_ROW_GUTTER: RowProps['gutter'] = [0, 0]
const FORM_BUTTON_ROW_GUTTER: RowProps['gutter'] = [60, 60]
const FULL_COL_SPAN = 24
const ICONS_STYLE_GUIDE_LINK = 'https://www.figma.com/file/kcIVFtPIEZCADGkqHGPoiW/B2C-mini-apps-%E2%80%94-guide-for-partners?type=design&node-id=980%3A410&mode=design&t=KufWfS9FTHDDl0xH-1'

function getFormFile (e: UploadChangeParam) {
    return e.fileList
}

type IconsFormValues = {
    mainIcon: Array<UploadFile>
}

const ColorSpan: React.FC<{ children: string, color: string, bg: string }> = ({ color, children, bg })=> {
    const intl = useIntl()
    const ColorCopiedMessage = intl.formatMessage({ id: 'apps.id.notifications.colorCopied.title' })

    const handleClick = useCallback(() => {
        if (typeof navigator !== 'undefined') {
            navigator.clipboard.writeText(children)
            notification.success({ message: ColorCopiedMessage })
        }
    }, [ColorCopiedMessage, children])

    return <span style={{ color, backgroundColor: bg }} className={styles.colorSelection} onClick={handleClick}>{children}</span>
}

export const IconsSubsection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const SaveButtonLabel = intl.formatMessage({ id: 'global.actions.save' })
    const MainIconTitle = intl.formatMessage({ id: 'apps.b2c.sections.info.icons.items.main.title' })
    const MainIconDescription = intl.formatMessage({ id: 'apps.b2c.sections.info.icons.items.main.description' }, {
        format: <Typography.Text size='medium' strong>png</Typography.Text>,
        size: <Typography.Text size='medium' strong>{B2C_LOGO_SIZE}×{B2C_LOGO_SIZE}</Typography.Text>,
        mainColor: <ColorSpan color={colors.white} bg={B2C_LOGO_MAIN_COLOR}>{B2C_LOGO_MAIN_COLOR}</ColorSpan>,
        secondaryColor: <ColorSpan color={colors.black} bg={B2C_LOGO_SECONDARY_COLOR}>{B2C_LOGO_SECONDARY_COLOR}</ColorSpan>,
    })
    const IconGuideLinkText = intl.formatMessage({ id: 'apps.b2c.sections.info.icons.items.main.guide.link' })
    const IconGuideText = intl.formatMessage({ id: 'apps.b2c.sections.info.icons.items.main.guide.text' }, {
        link: <Typography.Link href={ICONS_STYLE_GUIDE_LINK} target='_blank'>{IconGuideLinkText}</Typography.Link>,
    })
    const RulesWarningText = intl.formatMessage({ id: 'apps.b2c.sections.info.icons.warning.description' })
    const UploadImageMessage = intl.formatMessage({ id: 'apps.b2c.sections.info.icons.actions.uploadImage' })

    const { data } = useGetB2CAppQuery({ variables: { id } })

    const name = get(data, ['app', 'name'], '') as string
    const logo = get(data, ['app', 'logo', 'publicUrl'], DEFAULT_B2C_LOGO_URL) as string

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
            max: { width: B2C_LOGO_SIZE, height: B2C_LOGO_SIZE },
            min: { width: B2C_LOGO_SIZE, height: B2C_LOGO_SIZE },
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
                <Col span={FULL_COL_SPAN}>
                    <Row gutter={ICON_WARNING_ROW_GUTTER}>
                        <Col span={FULL_COL_SPAN} className={styles.subSectionContainer}>
                            <div className={styles.subSectionContainer}>
                                <B2CAppCard name={name} logo={logo}/>
                                <Row gutter={ROW_ICONS_CONTENT_GUTTER}>
                                    <Col span={FULL_COL_SPAN}>
                                        <Typography.Title type='secondary' level={4}>{MainIconTitle}</Typography.Title>
                                    </Col>
                                    <Col span={FULL_COL_SPAN}>
                                        <Typography.Paragraph size='medium'>{MainIconDescription}</Typography.Paragraph>
                                        <Typography.Paragraph size='medium'>{IconGuideText}</Typography.Paragraph>
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
                            </div>
                        </Col>
                        <Col span={FULL_COL_SPAN}>
                            <Alert
                                showIcon
                                type='warning'
                                description={RulesWarningText}
                            />
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