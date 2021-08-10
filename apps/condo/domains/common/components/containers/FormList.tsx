// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Dropdown, Form, Input, List, Menu, Modal, Popconfirm, Skeleton, Typography } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import { DownOutlined, PlusOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import React, { FunctionComponent, useCallback, useState, useRef } from 'react'
import { useIntl } from '@core/next/intl'
import { useMutation } from '@core/next/apollo'
import { throttle } from 'lodash'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'

const identity = (x) => !!x
const NON_FIELD_ERROR_NAME = '_NON_FIELD_ERROR_'

class ValidationError extends Error {
    constructor (message, field = NON_FIELD_ERROR_NAME) {
        super(message)
        this.name = 'ValidationError'
        this.field = field
    }
}

const SListItemForm = styled(Form)`
  width: 100%;
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  align-items: stretch;
  align-content: stretch;
`

const SListItem = styled(List.Item)`
  padding: 0 !important;
`

const SListItemMeta = styled(List.Item.Meta)`
  flex: 1 0 55%;
  margin: 16px 24px;
`

const SListItemExtra = styled.div`
  flex: none;
  margin: 16px 24px;

  & ul:first-child {
    margin-top: 0;
  }
`

const SSkeleton = styled(Skeleton)`
  margin: 16px 24px;
`

const SListActionsUl = styled.ul`
  margin: 10px 10px 0;
  text-align: center;

  > li {
    margin: 0;
  }
`

function FormList ({ dataSource, renderItem, ...extra }) {
    if (!renderItem) throw new Error('renderItem prop is required')

    return <List
        size="large"
        itemLayout={'horizontal'}
        dataSource={dataSource}
        renderItem={renderItemWrapper}
        {...extra}
    />

    function renderItemWrapper (item) {
        const itemData = renderItem(item)
        const itemMeta = { key: item.id, ...(itemData.itemMeta || {}) }
        const formMeta = { layout: 'inline', ...(itemData.formMeta || {}) }
        const mainBlockMeta = { key: `m${item.id}`, ...(itemData.mainBlockMeta || {}) }
        const extraBlockMeta = { key: `e${item.id}`, ...(itemData.extraBlockMeta || {}) }
        return <SListItem {...itemMeta}>
            <SListItemForm {...formMeta}>
                <SSkeleton loading={item.loading} active>
                    <SListItemMeta
                        avatar={itemData.avatar}
                        title={itemData.title}
                        description={itemData.description}
                        {...mainBlockMeta} />
                    <SListItemExtra {...extraBlockMeta}>
                        {(itemData.actions && Array.isArray(itemData.actions)) ?
                            itemData.actions
                                .map((actionsLine, i) => {
                                    if (!actionsLine) return null
                                    if (!Array.isArray(actionsLine)) throw new Error('renderItem() => itemData.actions should be array of arrays')
                                    const cleanedActionsLine = actionsLine.filter(identity)
                                    const length = cleanedActionsLine.length
                                    if (length === 0) return null
                                    return <SListActionsUl key={i} className='ant-list-item-action'>
                                        {cleanedActionsLine
                                            .map((action, j) => {
                                                if (!action) return null
                                                return <li key={j} className='ant-list-item-action'>
                                                    {action}
                                                    {j !== length - 1 && <em className='ant-list-item-action-split' />}
                                                </li>
                                            })
                                        }
                                    </SListActionsUl>
                                })
                                .filter(identity)
                            : itemData.actions}
                    </SListItemExtra>
                </SSkeleton>
            </SListItemForm>
        </SListItem>
    }
}

function CreateFormListItemButton ({ label, ...extra }) {
    return <Button
        type="dashed"
        style={{ width: '100%' }}
        {...extra}
    >
        <PlusOutlined />{label}
    </Button>
}

function ExtraDropdownActionsMenu ({ actions }) {
    const actionsLine = actions.filter(identity)
    const [popConfirmProps, setPopConfirmProps] = useState({ visible: false, title: null, icon: null })

    function handleAction ({ key }) {
        const action = actionsLine[key]
        if (action.confirm) {
            setPopConfirmProps({
                visible: true,
                onConfirm: action.action,
                onCancel: () => setPopConfirmProps({ visible: false, title: null, icon: null }),
                ...action.confirm,
            })
        } else {
            setPopConfirmProps({ visible: false, title: null, icon: null })
            action.action()
        }
    }

    return <Popconfirm {...popConfirmProps}>
        <Dropdown overlay={<Menu onClick={handleAction}>
            {actionsLine.map((action, i) => <Menu.Item key={i}>{action.label}</Menu.Item>)}
        </Menu>}>
            <a> ... <DownOutlined /></a>
        </Dropdown>
    </Popconfirm>
}

function ExpandableDescription ({ children }) {
    const intl = useIntl()
    const ReadMoreMsg = intl.formatMessage({ id: 'ReadMore' })

    return <Typography.Paragraph ellipsis={{ rows: 3, expandable: true, symbol: ReadMoreMsg }}>
        {children}
    </Typography.Paragraph>
}

function useCreateAndEditModalForm () {
    const [visible, setIsModalVisible] = useState(false)
    const [editableItem, setModalObject] = useState(null)

    function openCreateModal () {
        setIsModalVisible(true)
        setModalObject(null)
    }

    function openEditModal (item) {
        setIsModalVisible(true)
        setModalObject(item)
    }

    function cancelModal () {
        setIsModalVisible(false)
        setModalObject(null)
    }

    return { visible, editableItem, openCreateModal, openEditModal, cancelModal }
}

type IFormValuesType = Record<string, string | number | { id: string } | { disconnectId: string }>

// TODO(Dimitreee): add children type/interface
// TODO(Dimitreee): remove any
interface IFormWithAction {
    action?: (formValues) => Promise<any>
    mutation?: Document.Node
    initialValues?: Record<string, unknown>
    onChange?: (changedValues: Record<string, unknown>, allValues: Record<string, unknown>) => void
    handleSubmit?: (values) => void
    validateTrigger?: string | string[]
    resetOnComplete?: boolean
    layout?: 'vertical' | 'horizontal'
    colon?: boolean
    formValuesToMutationDataPreprocessor?: (values: IFormValuesType) => IFormValuesType
    ErrorToFormFieldMsgMapping?: Record<string, {
        name: string
        errors: string[]
    }>
    mutationExtraVariables?: Record<string, unknown>
    mutationExtraData?: Record<string, unknown>
    formValuesToMutationDataPreprocessor?: (values) => values
    formValuesToMutationDataPreprocessorContext?: Record<string, unknown>
    OnErrorMsg?: string
    OnCompletedMsg?: string
    onMutationCompleted?: (result) => void
}

const FormWithAction: FunctionComponent<IFormWithAction> = (props) => {
    const intl = useIntl()
    const ClientSideErrorMsg = intl.formatMessage({ id: 'ClientSideError' })

    const {
        action,
        mutation,
        mutationExtraVariables,
        mutationExtraData,
        formValuesToMutationDataPreprocessor,
        formValuesToMutationDataPreprocessorContext,
        children,
        onMutationCompleted,
        ErrorToFormFieldMsgMapping,
        OnErrorMsg,
        OnCompletedMsg,
        initialValues,
        handleSubmit,
        resetOnComplete,
        onChange,
        colon = true,
        layout = 'vertical',
        validateTrigger,
    } = props

    const [form] = Form.useForm()
    const [isLoading, setIsLoading] = useState(false)

    let create = null

    if (!action) {
        [create] = useMutation(mutation) // eslint-disable-line react-hooks/rules-of-hooks
    }

    const _handleSubmit = useCallback((values) => {
        if (handleSubmit) {
            return handleSubmit(values)
        }
        if (values.hasOwnProperty(NON_FIELD_ERROR_NAME)) delete values[NON_FIELD_ERROR_NAME]
        let data
        try {
            data = (formValuesToMutationDataPreprocessor) ? formValuesToMutationDataPreprocessor(values, formValuesToMutationDataPreprocessorContext, form) : values
        } catch (err) {
            if (err instanceof ValidationError) {
                let errors = []
                if (ErrorToFormFieldMsgMapping) {
                    const errorString = `${err}`
                    Object.keys(ErrorToFormFieldMsgMapping).forEach((msg) => {
                        if (errorString.includes(msg)) {
                            errors.push(ErrorToFormFieldMsgMapping[msg])
                        }
                    })
                }
                if (errors.length === 0) {
                    errors = [{ name: err.field || NON_FIELD_ERROR_NAME, errors: [String(err.message)] }]
                }
                form.setFields(errors)
                return
            } else {
                form.setFields([{ name: NON_FIELD_ERROR_NAME, errors: [ClientSideErrorMsg] }])
                throw err  // unknown error, rethrow it (**)
            }
        }
        form.setFields([{ name: NON_FIELD_ERROR_NAME, errors: [] }])
        setIsLoading(true)

        const actionOrMutationProps = !action
            ? { mutation: create, variables: { data: { ...data, ...mutationExtraData }, ...mutationExtraVariables } }
            : { action: () => action({ ...data }) }

        return runMutation({
            ...actionOrMutationProps,
            onCompleted: (...args) => {
                if (onMutationCompleted) {
                    onMutationCompleted(...args)
                }
                if (resetOnComplete) {
                    form.resetFields()
                }
            },
            onFinally: () => {
                setIsLoading(false)
            },
            intl,
            form,
            ErrorToFormFieldMsgMapping,
            OnErrorMsg,
            OnCompletedMsg,
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function handleSave () {
        // TODO(zuch) Possible bug: If user press save button and form not touched he will stay on edit screen with no response from system
        // if (form.isFieldsTouched()) {
        form.submit()
        //}
    }

    const errors = {}

    const throttledValidateFields = throttle((field) => {
        const item = form.getFieldsError().find(item => item.name[0] === field)

        errors[field] = errors[field] || Boolean(item.errors.length)
        errors[field] && form.validateFields([field])
    }, 400)

    async function handleChange (changedValues, allValues) {
        const field = Object.keys(changedValues)[0]
        throttledValidateFields(field)

        if (onChange) onChange(changedValues, allValues)
    }

    return (
        <Form
            form={form}
            layout={layout}
            onFinish={_handleSubmit}
            initialValues={initialValues}
            validateTrigger={validateTrigger}
            onValuesChange={handleChange}
            colon={colon}
            scrollToFirstError
        >
            <Form.Item className='ant-non-field-error' name={NON_FIELD_ERROR_NAME}><Input /></Form.Item>
            {children({ handleSave, isLoading, handleSubmit: _handleSubmit, form })}
        </Form>
    )
}

interface IBaseModalFormProps extends IFormWithAction {
    visible: boolean
    cancelModal: () => void
    ModalTitleMsg: string | JSX.Element
    showCancelButton?: boolean
    ModalCancelButtonLabelMsg?: string
    ModalSaveButtonLabelMsg?: string
    modalExtraFooter?: JSX.Element[]
}

const BaseModalForm: FunctionComponent<IBaseModalFormProps> = ({
    visible,
    cancelModal,
    ModalTitleMsg = '',
    showCancelButton = true,
    ModalCancelButtonLabelMsg,
    ModalSaveButtonLabelMsg,
    modalExtraFooter = [],
    children,
    ...props
}) => {
    const intl = useIntl()
    const CancelMessage = ModalCancelButtonLabelMsg ? ModalCancelButtonLabelMsg : intl.formatMessage({ id: 'Cancel' })
    const SaveMessage = ModalSaveButtonLabelMsg ? ModalSaveButtonLabelMsg : intl.formatMessage({ id: 'Save' })
    const handleSaveRef = useRef(null)
    const Buttons = []
    if (showCancelButton) {
        Buttons.push((<Button key="cancel" type="sberPrimary" secondary onClick={cancelModal}>{CancelMessage}</Button>))
    }
    return (<Modal
        title={<h2 style={{ fontWeight: 'bold', lineHeight: '22px', marginBottom: '0px' }}>{ModalTitleMsg}</h2>}
        visible={visible}
        onCancel={cancelModal}
        footer={[
            ...modalExtraFooter,
            ...Buttons,
            <Button key="submit" onClick={() => {
                handleSaveRef.current()
            }} type="sberPrimary" >{SaveMessage}</Button>,
        ]}
    >
        <FormWithAction {...props}>
            {
                ({ handleSave }) => {
                    handleSaveRef.current = handleSave
                    return (
                        <>
                            {children}
                        </>
                    )
                }
            }
        </FormWithAction>
    </Modal>)
}


export {
    ValidationError,
    useCreateAndEditModalForm,
    BaseModalForm,
    CreateFormListItemButton,
    ExtraDropdownActionsMenu,
    ExpandableDescription,
    FormWithAction,
}

export default FormList
