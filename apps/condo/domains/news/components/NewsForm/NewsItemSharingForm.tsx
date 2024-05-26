import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import dayjs from 'dayjs'
import get from 'lodash/get'
import React, { useEffect, useState } from 'react'
import { Options as ScrollOptions } from 'scroll-into-view-if-needed'

import { useIntl } from '@open-condo/next/intl'
import { ActionBar as UIActionBar, Alert, Button, Typography } from '@open-condo/ui'

import { GraphQlSearchInput } from '../../../common/components/GraphQlSearchInput'
import { GraphQlSearchInputWithCheckAll } from '../../../common/components/GraphQlSearchInputWithCheckAll'
import { LabelWithInfo } from '../../../common/components/LabelWithInfo'
import { useLayoutContext } from '../../../common/components/LayoutContext'
import { IFrame } from '../../../miniapp/components/IFrame'
import { SectionNameInput } from '../../../user/components/SectionNameInput'
import { UnitNameInput } from '../../../user/components/UnitNameInput'
import { NEWS_TYPE_COMMON, NEWS_TYPE_EMERGENCY } from '../../constants/newsTypes'
import MemoizedNewsPreview from '../NewsPreview'
import { RecipientCounter } from '../RecipientCounter'
import { TemplatesTabs } from '../TemplatesTabs'

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
    sharingApp: {
        id: string,
        newsSharingConfig: {
            customFormUrl?: string
            name: string
            icon?: {
                publicUrl: string,
            }
        }
    }

    onSubmit: (SharingAppValues) => void
    onSkip: (SharingAppValues) => void

    initialValues?: SharingAppValues

    // todo @toplenboren ADD TYPE HERE!
    newsItemData: {
        type: string,
        selectedValidBeforeText: string,
    }
}

export const NewsItemSharingForm: React.FC<INewsItemSharingForm> = ({ newsItemData, initialValues, onSkip, onSubmit, sharingApp: { id, newsSharingConfig }, children }) => {

    const { breakpoints } = useLayoutContext()
    const isMediumWindow = !breakpoints.DESKTOP_SMALL
    const formFieldsColSpan = isMediumWindow ? 24 : 14
    const formInfoColSpan = 24 - formFieldsColSpan

    const intl = useIntl()
    const SelectAddressLabel = intl.formatMessage({ id: 'news.fields.address.label' })

    const processedInitialValues = (initialValues && initialValues.formValues && initialValues.preview) ? initialValues : { formValues: {}, preview: { renderedTitle: '', renderedBody: '' } }

    const isCustomForm = !!newsSharingConfig.customFormUrl
    const [ sharingAppFormValues, setSharingAppFormValues ] = useState<SharingAppValues>(processedInitialValues)

    // TODO: @toplenboren ask @matthew about this :-)
    const handleSharingAppIFrameFormMessage = (event) => {
        const { handler, ctxId: eventCtxId, formValues, preview, isValid } = event.data
        if (handler === 'handleSharingAppIFrameFormMessage' && id === eventCtxId) {
            console.info('Incoming message from miniapp form', preview)
            setSharingAppFormValues({ formValues, preview, isValid })
        }
    }

    // Todo @toplenboren what if more then 1?
    useEffect(() => {
        if (typeof window !== 'undefined' && isCustomForm) {
            window.addEventListener('message', handleSharingAppIFrameFormMessage)

            return () => window.removeEventListener('message', handleSharingAppIFrameFormMessage)
        }
    }, [handleSharingAppIFrameFormMessage])

    return (
        <>
            {
                isCustomForm && (
                    <Col span={24} style={BIG_MARGIN_BOTTOM_STYLE}>
                        <Row gutter={BIG_HORIZONTAL_GUTTER} style={BIG_MARGIN_BOTTOM_STYLE}>
                            <Col style={{ marginLeft: '-5px', minHeight: '300px' }} span={formFieldsColSpan}>
                                <IFrame
                                    // src={
                                    //     `${getSteps()[currentStep].newsSharingConfig.customFormUrl}?ctxId=${getSteps()[currentStep].id}&formValues=${JSON.stringify(get(sharingAppsFormValues, [getSteps()[currentStep].id, 'formValues']))}`
                                    // }
                                    src={
                                        `${newsSharingConfig.customFormUrl}?ctxId=${id}`
                                    }
                                    reloadScope='organization'
                                    withLoader
                                    withPrefetch
                                    withResize
                                />
                            </Col>
                            <Col span={formInfoColSpan}>
                                {(!!get(sharingAppFormValues, ['preview', 'renderedTitle']) || !!get(sharingAppFormValues, ['preview', 'renderedBody'])) && (
                                    <MemoizedNewsPreview
                                        appType='sharing'
                                        // push={{
                                        //     appName: newsSharingConfig.name,
                                        //     appIcon: get(newsSharingConfig, ['icon', 'publicUrl']),
                                        // }}
                                        app={{
                                            containerStyle: { 'color': 'red' },
                                        }}
                                        newsItemData={{
                                            body: get(sharingAppFormValues, ['preview', 'renderedBody']),
                                            title: get(sharingAppFormValues, ['preview', 'renderedTitle']),
                                            validBefore: newsItemData.type === NEWS_TYPE_EMERGENCY ? newsItemData.selectedValidBeforeText : null,
                                        }}
                                    />
                                )}
                            </Col>
        
                            {/* We do not support editing news item scopes for custom news sharing integrations */}
                            <Col span={24}>
                                <Row gutter={BIG_HORIZONTAL_GUTTER}>
                                    <Col span={formFieldsColSpan}>
                                        <Row gutter={EXTRA_SMALL_VERTICAL_GUTTER}>
                                            <Col span={24} style={MARGIN_BOTTOM_24_STYLE}>
                                                <Typography.Title level={2}>Адресаты</Typography.Title>
                                            </Col>

                                            <Col span={24} style={{ maxWidth: '600px' }}>
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
                                children={ isMediumWindow ? 'Пропустить' : `Не отправлять новость в ${newsSharingConfig.name}` }
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
