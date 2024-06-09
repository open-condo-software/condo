import { B2BApp, NewsItem } from '@app/condo/schema'
import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import React, { useEffect, useRef, useState } from 'react'
import { Options as ScrollOptions } from 'scroll-into-view-if-needed'

import { useIntl } from '@open-condo/next/intl'
import { ActionBar as UIActionBar, Alert, Button, Typography } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'

import { NEWS_TYPE_EMERGENCY } from '../../constants/newsTypes'
import { MemoizedSharingNewsPreview } from '../NewsPreview'


const BIG_MARGIN_BOTTOM_STYLE: React.CSSProperties = { marginBottom: '60px' }
export const SCROLL_TO_FIRST_ERROR_CONFIG: ScrollOptions = { behavior: 'smooth', block: 'center' }
const EXTRA_SMALL_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 10]
const BIG_HORIZONTAL_GUTTER: [Gutter, Gutter] = [50, 0]
const MARGIN_BOTTOM_24_STYLE = { marginBottom: '24px' }

export type SharingAppValues = {
    formValues: Record<string, unknown>,
    preview: {
        renderedTitle: string,
        renderedBody: string,
    }
    isValid: boolean
}

// Todo @toplenboren Infer types!
interface INewsItemSharingForm {
    sharingApp: B2BApp

    onSubmit: (SharingAppValues) => void
    onSkip: (SharingAppValues) => void

    initialValues: SharingAppValues | undefined

    newsItemData: {
        type: string,
        validBefore?: Pick<NewsItem, 'validBefore'>,
        title: string,
        body: string,
    }
}

export const NewsItemSharingForm: React.FC<INewsItemSharingForm> = ({ newsItemData, initialValues, onSkip, onSubmit, sharingApp: { id, newsSharingConfig } }) => {

    const { breakpoints } = useLayoutContext()
    const isMediumWindow = !breakpoints.DESKTOP_SMALL
    const formFieldsColSpan = isMediumWindow ? 24 : 14
    const formInfoColSpan = 24 - formFieldsColSpan

    const appName = newsSharingConfig.name
    const appIcon = newsSharingConfig.icon.publicUrl
    const appPreviewUrl = newsSharingConfig.previewUrl

    const iFramePreviewRef = useRef(null)

    const processedInitialValues = (initialValues && initialValues.formValues && initialValues.preview) ? initialValues : { formValues: {}, preview: { renderedTitle: '', renderedBody: '' }, isValid: false }

    const isCustomForm = !!newsSharingConfig.customFormUrl
    const [ sharingAppFormValues, setSharingAppFormValues ] = useState<SharingAppValues>(processedInitialValues)

    const handleSharingAppIFrameFormMessage = (event) => {
        const { handler, ctxId: eventCtxId, formValues, preview, isValid } = event.data
        if (handler === 'handleSharingAppIFrameFormMessage' && id === eventCtxId) {
            console.info('Incoming message from miniapp form', { formValues, preview, isValid })
            setSharingAppFormValues({ formValues, preview, isValid })
        }
    }

    useEffect(() => {

        const title = get(sharingAppFormValues, ['preview', 'renderedTitle'])
        const body = get(sharingAppFormValues, ['preview', 'renderedBody'])

        // Todo: @toplenboren, ask @matthew about postmessages
        if (iFramePreviewRef.current) {
            iFramePreviewRef.current.contentWindow.postMessage({ handler: 'handleUpdateFromCondo', title, body }, '*')
            console.info('Sent message to miniapp preview', { title, body })
        }
    }, [sharingAppFormValues, iFramePreviewRef])

    useEffect(() => {
        if (typeof window !== 'undefined' && isCustomForm) {
            window.addEventListener('message', handleSharingAppIFrameFormMessage)

            return () => window.removeEventListener('message', handleSharingAppIFrameFormMessage)
        }
    }, [handleSharingAppIFrameFormMessage, isCustomForm])

    return (
        <>
            {
                isCustomForm && (
                    <Col span={24} style={BIG_MARGIN_BOTTOM_STYLE}>
                        <Row gutter={BIG_HORIZONTAL_GUTTER} style={BIG_MARGIN_BOTTOM_STYLE}>
                            {/* marginLeft -10 is to allow component shadows from iFrame to render normally */}
                            <Col style={{ marginLeft: '-10px', minHeight: '500px' }} span={formFieldsColSpan}>
                                <IFrame
                                    src={
                                        `${newsSharingConfig.customFormUrl}?ctxId=${id}&title=${newsItemData.title}&body=${newsItemData.body}&type=${newsItemData.type}&initialValues=${JSON.stringify(processedInitialValues)}`
                                    }
                                    reloadScope='organization'
                                    withLoader
                                    withPrefetch
                                    withResize
                                />
                            </Col>
                            {/* marginLeft 10 is to compensate for marginLeft -10 */}
                            <Col style={{ marginLeft: '10px' }} span={formInfoColSpan}>
                                {(!!get(sharingAppFormValues, ['preview', 'renderedTitle']) || !!get(sharingAppFormValues, ['preview', 'renderedBody'])) && (
                                    <MemoizedSharingNewsPreview
                                        hasPush={false}

                                        appName={appName}
                                        appIcon={appIcon}
                                        iFrameUrl={appPreviewUrl}
                                        iFrameRef={iFramePreviewRef}

                                        body={get(sharingAppFormValues, ['preview', 'renderedBody'])}
                                        title={get(sharingAppFormValues, ['preview', 'renderedTitle'])}
                                        validBefore={newsItemData.type === NEWS_TYPE_EMERGENCY ? newsItemData.validBefore : null}
                                    />
                                )}
                            </Col>
        
                            {/* Condo does not support editing news item scopes for custom news sharing integrations */}
                            <Col span={24}>
                                <Row gutter={BIG_HORIZONTAL_GUTTER}>
                                    <Col span={formFieldsColSpan}>
                                        <Row gutter={EXTRA_SMALL_VERTICAL_GUTTER}>
                                            <Col span={24} style={MARGIN_BOTTOM_24_STYLE}>
                                                <Typography.Title level={2}>Адресаты</Typography.Title>
                                            </Col>

                                            <Col span={24}>
                                                <Alert
                                                    type='info'
                                                    showIcon
                                                    description='Новости будут отправлены на дома, подъезды и квартиры выбранные на прошлом шаге'
                                                    // description={(
                                                    //     <Row>
                                                    //         <Col span={24}>
                                                    //             <Typography.Text>Для редактирования адресатов перейдите на прошлый шаг –
                                                    //                 нажмите на Doma в верхнем меню</Typography.Text>
                                                    //         </Col>
                                                    //     </Row>
                                                    // )}
                                                />
                                            </Col>

                                            <Col span={24}>

                                            </Col>
        
                                            {/*<Col span={24}>*/}
                                            {/*    {newsItemForOneProperty && (*/}
                                            {/*        <Form.Item*/}
                                            {/*            {...propertySelectFormItemProps}*/}
                                            {/*            name='property'*/}
                                            {/*        >*/}
                                            {/*            <GraphQlSearchInput*/}
                                            {/*                {...propertySelectProps(form)}*/}
                                            {/*                onAllDataLoading={handleAllPropertiesLoading(form)}*/}
                                            {/*                disabled={true}*/}
                                            {/*            />*/}
                                            {/*        </Form.Item>*/}
                                            {/*    )}*/}
                                            {/*    <HiddenBlock hide={newsItemForOneProperty}>*/}
                                            {/*        <GraphQlSearchInputWithCheckAll*/}
                                            {/*            checkAllFieldName='hasAllProperties'*/}
                                            {/*            checkAllInitialValue={get(initialValues, 'hasAllProperties', false)}*/}
                                            {/*            selectFormItemProps={propertySelectFormItemProps}*/}
                                            {/*            selectProps={propertySelectProps(form)}*/}
                                            {/*            onCheckBoxChange={propertyCheckboxChange(form)}*/}
                                            {/*            CheckAllMessage={CheckAllLabel}*/}
                                            {/*            onDataLoaded={handleAllPropertiesDataLoading}*/}
                                            {/*            form={form}*/}
                                            {/*            disabled={true}*/}
                                            {/*        />*/}
                                            {/*    </HiddenBlock>*/}
                                            {/*</Col>*/}
                                        </Row>
                                    </Col>
                                    <Col span={formInfoColSpan}>
                                        {/*{(newsItemScopesNoInstance.length > 0) && (*/}
                                        {/*    <RecipientCounter newsItemScopes={newsItemScopesNoInstance}/>*/}
                                        {/*)}*/}
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Col>
                )
            }

            {
                !isCustomForm && (
                    <>We do not support this right now...</>
                )
            }

            <Row style={{ width: '100%' }}>
                <Col span={24}>
                    <UIActionBar
                        actions={[
                            <Button
                                key='submit'
                                type='primary'
                                children='Далее'
                                onClick={() => onSubmit(sharingAppFormValues)}
                                disabled={!sharingAppFormValues.isValid}
                            />,
                            <Button
                                key='submit'
                                type='secondary'
                                children={ isMediumWindow ? 'Пропустить' : `Не отправлять новость в ${appName}` }
                                onClick={() => onSkip(sharingAppFormValues)}
                                disabled={false}
                            />,
                        ]}
                    />
                </Col>
            </Row>
        </>
    )
}
