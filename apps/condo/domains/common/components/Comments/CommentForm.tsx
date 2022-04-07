import React, { CSSProperties, useCallback, useEffect } from 'react'
import { FormWithAction } from '../containers/FormList'
import { Col, Form, FormInstance, Input, Row, Typography } from 'antd'
import { PaperClipOutlined } from '@ant-design/icons'
import { Button } from '@condo/domains/common/components/Button'
import Icon from '@ant-design/icons'
import { useIntl } from '@core/next/intl'
import styled from '@emotion/styled'
import { SendMessage } from '../icons/SendMessage'
import { useState } from 'react'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { useInputWithCounter } from '../../hooks/useInputWithCounter'
import { colors } from '@condo/domains/common/constants/style'
import { useMultipleFileUploadHook } from '../MultipleFileUpload'
import { TicketCommentFile, TicketFile } from '../../../ticket/utils/clientSchema'
import { useOrganization } from '@core/next/organization'

const Holder = styled.div`
  //position: relative;
  //button.ant-btn {
  //  position: absolute;
  //  right: 7px;
  //  bottom: 8px;
  //}
  .ant-form-item-explain {
    display: none;
  }
  textarea {
    padding-right: 45px;
  }
`

const COMMENT_HELPERS_ROW_STYLES: CSSProperties = { padding: '0 8px 8px 8px' }

const CommentHelper = styled(Col)`
  background-color: ${colors.textSecondary};
  padding: 2px 10px 4px;
  margin: 2px;
  border-radius: 100px;

  .ant-typography {
    color: ${colors.white};
    font-weight: 600;
  }
`

interface ICommentFormProps {
    action: (formValues) => Promise<any>
    fieldName?: string
    initialValue?: string
    editableComment
    setEditableComment
}

export const MAX_COMMENT_LENGTH = 300

const CommentForm: React.FC<ICommentFormProps> = ({ initialValue, action, fieldName, editableComment, setEditableComment }) => {
    const intl = useIntl()
    const PlaceholderMessage = intl.formatMessage({ id: 'Comments.form.placeholder' })
    const HelperMessage = intl.formatMessage({ id: 'Comments.form.helper' })

    const { InputWithCounter, Counter, setTextLength: setCommentLength, textLength: commentLength } = useInputWithCounter(Input.TextArea, MAX_COMMENT_LENGTH)
    const [form, setForm] = useState<FormInstance>()

    const { organization } = useOrganization()

    const { UploadComponent, syncModifiedFiles, resetModifiedFiles } = useMultipleFileUploadHook({
        Model: TicketCommentFile,
        relationField: 'ticketComment',
        initialFileList: editableComment?.meta?.files,
        initialCreateValues: { organization: organization.id },
        dependenciesForRerenderUploadComponent: [editableComment],
    })

    useEffect(() => {
        if (editableComment && form) {
            form.setFieldsValue({ [fieldName]: editableComment.content })
        }
    }, [editableComment, fieldName, form])

    const handleKeyUp = async (event, form) => {
        if (event.keyCode === 13 && !event.shiftKey) {
            form.submit()
            setCommentLength(0)
        }
    }

    const handleKeyDown = (event) => {
        if (event.keyCode === 13) {
            event.preventDefault()
        }
    }

    const { requiredValidator, trimValidator } = useValidations()
    const validations = {
        comment: [requiredValidator, trimValidator],
    }

    const [sending, setSending] = useState(false)

    const actionWithSyncComments = useCallback(async (values) => {
        setSending(true)
        await action(values, syncModifiedFiles)
        setSending(false)
        resetModifiedFiles()
    }, [action, resetModifiedFiles, syncModifiedFiles])

    const Mem = useCallback(() => (
        <UploadComponent
            initialFileList={editableComment?.meta?.files}
            UploadButton={() => (
                <Button type={'text'}>
                    <PaperClipOutlined />
                </Button>
            )}
        />
    ), [UploadComponent, editableComment, sending])

    return (
        <>
            <FormWithAction
                initialValues={{
                    [fieldName]: initialValue,
                }}
                action={actionWithSyncComments}
                resetOnComplete={true}
            >
                {({ handleSave: handleFormSave, isLoading, form: formInstance }) => {
                    if (!form) {
                        setForm(formInstance)
                    }

                    return (
                        <Holder>
                            {
                                commentLength > 0 ? (
                                    <Row justify={'space-between'} style={COMMENT_HELPERS_ROW_STYLES}>
                                        <CommentHelper>
                                            <Typography.Text>
                                                {HelperMessage}
                                            </Typography.Text>
                                        </CommentHelper>
                                        <CommentHelper>
                                            <Counter />
                                        </CommentHelper>
                                    </Row>
                                ) : null
                            }
                            <Form.Item
                                name={fieldName}
                                rules={validations.comment}
                            >
                                <InputWithCounter
                                    maxLength={MAX_COMMENT_LENGTH}
                                    placeholder={PlaceholderMessage}
                                    className="white"
                                    autoSize={{ minRows: 1, maxRows: 6 }}
                                    onKeyDown={handleKeyDown}
                                    onKeyUp={(event) => {handleKeyUp(event, form)}}
                                />
                            </Form.Item>
                            <Mem />
                        </Holder>
                    )
                }}
            </FormWithAction>
        </>

    )
}

CommentForm.defaultProps = {
    fieldName: 'content',
    initialValue: '',
}

export {
    CommentForm,
}