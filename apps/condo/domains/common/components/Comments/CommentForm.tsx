import React, { CSSProperties, useCallback, useEffect, useMemo } from 'react'
import { FormWithAction } from '../containers/FormList'
import { Col, Form, FormInstance, Input, Row, Typography } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import { useIntl } from '@core/next/intl'
import styled from '@emotion/styled'
import { useState } from 'react'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { useInputWithCounter } from '../../hooks/useInputWithCounter'
import { colors } from '@condo/domains/common/constants/style'
import { useMultipleFileUploadHook } from '../MultipleFileUpload'
import { TicketCommentFile } from '@condo/domains/ticket/utils/clientSchema'
import { useOrganization } from '@core/next/organization'
import { ClipIcon } from '../icons/ClipIcon'
import { TComment } from './index'

const Holder = styled.div`
  .wrapper {
    position: relative;

    button.ant-btn {
      position: absolute;
      right: 8px;
      top: 2px;
      padding: 0;
    }
  }

  
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
    action: (formValues, syncModifiedFiles) => Promise<any>
    fieldName?: string
    initialValue?: string
    editableComment: TComment
    setEditableComment: React.Dispatch<React.SetStateAction<TComment>>
    sending: boolean
}

export const MAX_COMMENT_LENGTH = 300

const CommentForm: React.FC<ICommentFormProps> = ({ initialValue, action, fieldName, editableComment, sending }) => {
    const intl = useIntl()
    const PlaceholderMessage = intl.formatMessage({ id: 'Comments.form.placeholder' })
    const HelperMessage = intl.formatMessage({ id: 'Comments.form.helper' })

    const { InputWithCounter, Counter, setTextLength: setCommentLength, textLength: commentLength } = useInputWithCounter(Input.TextArea, MAX_COMMENT_LENGTH)
    const [form, setForm] = useState<FormInstance>()

    const { organization } = useOrganization()

    const { UploadComponent, syncModifiedFiles, resetModifiedFiles, filesCount } = useMultipleFileUploadHook({
        Model: TicketCommentFile,
        relationField: 'ticketComment',
        initialFileList: editableComment?.files,
        initialCreateValues: { organization: organization.id },
        dependenciesForRerenderUploadComponent: [editableComment],
    })

    useEffect(() => {
        if (editableComment && form) {
            form.setFieldsValue({ [fieldName]: editableComment.content })
            setCommentLength(editableComment.content.length)
        }
    }, [editableComment, fieldName, form, setCommentLength])

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

    const validations = useMemo(() => ({
        comment: filesCount > 0 ? [] : [requiredValidator, trimValidator],
    }), [filesCount, requiredValidator, trimValidator])

    const actionWithSyncComments = useCallback(async (values) => {
        await action(values, syncModifiedFiles)
        await resetModifiedFiles()
    }, [action, resetModifiedFiles, syncModifiedFiles])

    const MemoizedUploadComponent = useCallback(() => (
        <UploadComponent
            initialFileList={editableComment?.files}
            UploadButton={() => (
                <Button type={'text'}>
                    <ClipIcon />
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
                {({ handleSave, isLoading, form: formInstance }) => {
                    if (!form) {
                        setForm(formInstance)
                    }

                    return (
                        <Holder>
                            {
                                commentLength > 0 || editableComment ? (
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
                            <div className={'wrapper'}>
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
                                <MemoizedUploadComponent />
                            </div>
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