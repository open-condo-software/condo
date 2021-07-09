import React from 'react'
import { FormWithAction } from '../containers/FormList'
import { Form, Input } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import Icon from '@ant-design/icons'
import { useIntl } from '@core/next/intl'
import styled from '@emotion/styled'
import { SendMessage } from '../icons/SendMessage'

const Holder = styled.div`
  position: relative;
  button.ant-btn {
    position: absolute;
    right: 4px;
    bottom: 4px;
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

const MAX_COMMENT_LENGTH = 300

const CommentForm: React.FC<ICommentFormProps> = ({ initialValue, action, fieldName }) => {
    const intl = useIntl()
    const PlaceholderMessage = intl.formatMessage({ id: 'Comments.form.placeholder' }, {
        maxLength: MAX_COMMENT_LENGTH,
    })
    return (
        <FormWithAction
            initialValues={{
                [fieldName]: initialValue,
            }}
            action={action}
            resetOnComplete={true}
        >
            {({ handleSave, isLoading }) => (
                <Holder>
                    <Form.Item
                        name={fieldName}
                        rules={[{ required: true }]}
                    >
                        <Input.TextArea
                            placeholder={PlaceholderMessage}
                            className="white"
                            autoSize={{ minRows: 1, maxRows: 6 }}
                            maxLength={MAX_COMMENT_LENGTH}
                        />
                    </Form.Item>
                    <Button
                        type="sberPrimary"
                        size="middle"
                        icon={<Icon component={SendMessage} style={{ color: 'white' }}/>}
                        onClick={handleSave}
                        loading={isLoading}
                    />
                </Holder>
            )}
        </FormWithAction>
    )
}

CommentForm.defaultProps = {
    fieldName: 'content',
    initialValue: '',
}

export {
    CommentForm,
}