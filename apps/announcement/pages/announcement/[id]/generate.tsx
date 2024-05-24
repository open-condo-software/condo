import styled from '@emotion/styled'
import { Col, Form, FormProps, Row } from 'antd'
import get from 'lodash/get'
import getConfig from 'next/config'
import Head from 'next/head'
import { useRouter } from 'next/router'
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Input, Space, Typography } from '@open-condo/ui'

import { AnnouncementTemplate } from '@announcement/domains/announcement/utils/clientSchema'
import { PageContent, PageHeader, PageWrapper } from '@announcement/domains/common/components/containers/BaseLayout'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { Loader } from '@condo/domains/common/components/Loader'


const { publicRuntimeConfig: { serverUrl } } = getConfig()


pdfMake.vfs = pdfFonts.pdfMake.vfs

const fonts = {
    Montserrat: {
        normal: `${serverUrl}/fonts/montserrat/Montserrat-Regular.ttf`,
        bold: `${serverUrl}/fonts/montserrat/Montserrat-Bold.ttf`,
    },
}

const getFormattedAnnouncementTitle = (text, formValues) => {
    let resultText = text.replaceAll('\\n', '\n')

    for (const fieldKey of Object.keys(formValues)) {
        resultText = resultText.replaceAll(`{${fieldKey}}`, formValues[fieldKey])
    }

    return resultText
}

const getFormattedAnnouncementBody = (text, obj) => {
    const str = text.replaceAll('\\n', '\n')
    const regex = /\{(\w+)\}/g
    const result = []
    let lastIndex = 0

    let match
    while ((match = regex.exec(str)) !== null) {
        if (match.index > lastIndex) {
            result.push(str.slice(lastIndex, match.index))
        }

        const fieldName = match[1]
        if (obj[fieldName] !== undefined) {
            result.push({ text: obj[fieldName], style: 'bold' })
        } else {
            result.push(match[0])
        }
        lastIndex = regex.lastIndex
    }

    if (lastIndex < str.length) {
        result.push(str.slice(lastIndex))
    }

    return result
}

function parseText (text, fields) {
    const parts = text.split(/({[^{}]+})/g)

    return parts.map((part) => {
        if (part.startsWith('{') && part.endsWith('}')) {
            const inputName = part.slice(1, -1)
            const fieldDescription = fields.find(field => field.name === inputName)

            return (
                <Form.Item name={inputName}>
                    <Input placeholder={get(fieldDescription, 'placeholder')} />
                </Form.Item>
            )
        }

        return part
    })
}


const DynamicText = ({ text, fields }) => {
    const parsedElements = parseText(text, fields)

    return (
        <div>
            {parsedElements}
        </div>
    )
}

// const FontWrapper = styled.div`
//   @font-face {
//     font-family: 'MontserratBold';
//     src: url('${serverUrl}/fonts/montserrat/Montserrat-Bold.ttf');
//   }
//   @font-face {
//     font-family: 'MontserratRegular';
//     src: url('${serverUrl}/fonts/montserrat/Montserrat-Regular.ttf');
//   }
//
//   & .announcement-template-title .condo-typography {
//     font-family: 'MontserratBold', serif;
//   }
//
//   & .announcement-template-body .condo-typography {
//     font-family: 'MontserratRegular', serif;
//   }
// `

const AnnouncementTemplatePreview = ({ template }) => {
    const title = useMemo(() => get(template, 'title'), [template])
    const body = useMemo(() => get(template, 'body'), [template])
    const imageUrl = useMemo(() => get(template, 'image.publicUrl'), [template])
    const fields = useMemo(() => get(template, 'fields'), [template])

    return (
        <FocusContainer padding='30px' margin='0px' style={{ maxWidth: '650px' }}>
            <Row gutter={[0, 60]}>
                <Col>
                    <img src={imageUrl} style={{ width: '100%' }} />
                </Col>
                <Col className='announcement-template-title'>
                    <Row gutter={[0, 30]}>
                        <Col span={24}>
                            {title.split('\\n').map(line => (
                                <Typography.Title level={3} key={line}>
                                    <DynamicText text={line} fields={fields} />
                                </Typography.Title>
                            ))}
                        </Col>
                        <Col className='announcement-template-body'>
                            <Row>
                                {body && body.split('\\n').map(line => (
                                    <Col span={24} key={line}>
                                        <Typography.Text key={line}>
                                            <DynamicText text={line} fields={fields} />
                                        </Typography.Text>
                                    </Col>
                                ))}
                            </Row>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </FocusContainer>
    )
}

const GenerateAnnouncementTemplatePage = () => {
    const intl = useIntl()
    const GenerateMessage = intl.formatMessage({ id: 'pages.announcement.id.generate' })
    const BackMessage = intl.formatMessage({ id: 'pages.announcement.id.back' })

    const router = useRouter()
    const { id } = router.query

    const { obj: template, loading: templateLoading } = AnnouncementTemplate.useObject({
        where: { id: id as string },
    })

    const PageTitle = useMemo(() => get(template, 'name', ''), [template])

    const imageUrl = useMemo(() => get(template, 'image.publicUrl'), [template])
    const title = useMemo(() => get(template, 'title'), [template])
    const body = useMemo(() => get(template, 'body'), [template])

    const onFinish: FormProps['onFinish'] = async (values) => {
        pdfMake.createPdf({
            pageSize: 'a5',
            content: [
                {
                    image: 'headerImage',
                    width: 355,
                },
                {
                    text: getFormattedAnnouncementTitle(title, values),
                    style: 'header',
                    margin: [0, 40, 0, 0],
                },
                body && {
                    text: getFormattedAnnouncementBody(body, values),
                    style: 'body',
                    margin: [0, 20, 0, 0],
                },
            ],
            pageMargins: [30, 30, 30, 30],
            images: {
                headerImage: imageUrl,
            },
            styles: {
                header: {
                    fontSize: 22,
                    bold: true,
                },
                body: {
                    fontSize: 12,
                },
                bold: {
                    bold: true,
                },
            },
            defaultStyle: {
                font: 'Montserrat',
            },
        }, null, fonts).download(`pdf-${+new Date()}.pdf`)
    }

    if (templateLoading) {
        return <Loader />
    }
    
    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader>
                    <Typography.Title level={2}>{PageTitle}</Typography.Title>
                </PageHeader>
                <PageContent>
                    <Form
                        onFinish={onFinish}
                    >
                        <Row gutter={[0, 60]}>
                            <Col span={24}>
                                <AnnouncementTemplatePreview template={template} />
                            </Col>
                            <Col span={24}>
                                <Space direction='horizontal' size={20}>
                                    <Form.Item>
                                        <Button type='primary' htmlType='submit'>
                                            {GenerateMessage}
                                        </Button>
                                    </Form.Item>
                                    <Button type='secondary' onClick={() => router.push('/announcement')}>
                                        {BackMessage}
                                    </Button>
                                </Space>
                            </Col>
                        </Row>
                    </Form>
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default GenerateAnnouncementTemplatePage