import React from 'react'
import { FormWithAction } from '../containers/FormList'
import { Form, Input, Typography } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import Icon from '@ant-design/icons'
import { useIntl } from '@core/next/intl'
import styled from '@emotion/styled'
import { SendMessage } from '../icons/SendMessage'
import { colors } from '@condo/domains/common/constants/style'
import { useState } from 'react'
import { InputWithCounter } from '../InputWithCounter'

const Holder = styled.div`
  position: relative;
  button.ant-btn {
    position: absolute;
    right: 4px;
    bottom: 23px;
  }
  .ant-form-item-explain {
    display: none;
  }
  textarea {
    padding-right: 45px;
  }
`

interface ICommentFormProps {
    action: (formValues) => Promise<any>
    fieldName?: string
    initialValue?: string
}

export const MAX_COMMENT_LENGTH = 300

const CommentForm: React.FC<ICommentFormProps> = ({ initialValue, action, fieldName }) => {
    const intl = useIntl()
    const PlaceholderMessage = intl.formatMessage({ id: 'Comments.form.placeholder' })
    const [commentLength, setCommentLength] = useState<number>(0)

    const handleKeyUp = (event, form) => {
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

    const validations = {
        comment: [
            { required: true },
            {
                validator: (_, value) => {
                    if (!value || value.trim().length === 0) return Promise.reject()
                    return Promise.resolve()
                },
            },
        ],
    }

    return (
        <>
            <FormWithAction
                initialValues={{
                    [fieldName]: initialValue,
                }}
                action={action}
                resetOnComplete={true}
            >
                {({ handleSave, isLoading, form }) => (
                    <Holder>
                        <Form.Item
                            name={fieldName}
                            rules={validations.comment}
                        >
                            <InputWithCounter
                                InputComponent={Input.TextArea}
                                currentLength={commentLength}
                                maxLength={MAX_COMMENT_LENGTH}
                                placeholder={PlaceholderMessage}
                                className="white"
                                autoSize={{ minRows: 1, maxRows: 6 }}
                                onKeyDown={handleKeyDown}
                                onKeyUp={(event) => {handleKeyUp(event, form)}}
                                onChange={e => setCommentLength(e.target.value.length)}
                            />
                        </Form.Item>
                        <Button
                            type="sberPrimary"
                            size="middle"
                            icon={<Icon component={SendMessage} style={{ color: 'white' }}/>}
                            onClick={(e) => {
                                handleSave(e)
                                setCommentLength(0)
                            }}
                            loading={isLoading}
                        />
                    </Holder>
                )}
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