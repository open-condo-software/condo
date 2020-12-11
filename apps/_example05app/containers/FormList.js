import { Button, Dropdown, Form, Input, List, Menu, Modal, Popconfirm, Skeleton, Typography } from 'antd'
import { DownOutlined, PlusOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import React, { useState } from 'react'
import { useIntl } from '@core/next/intl'
import { useMutation } from '@core/next/apollo'

import { runMutation } from '../utils/mutations.utils'

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
                        {...mainBlockMeta}/>
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
                                                    {j !== length - 1 && <em className='ant-list-item-action-split'/>}
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
        <PlusOutlined/>{label}
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
            <a> ... <DownOutlined/></a>
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

function CreateModalFormWithButton ({ CreateButtonLabelMsg, OnCreatedMsg, ...props }) { // eslint-disable-line no-unused-vars
    // TODO(pahaz): use it somewhere as example! (and remove eslint-disable-line)
    const { visible, openCreateModal, cancelModal } = useCreateAndEditModalForm()

    const intl = useIntl()
    const CreateMsg = intl.formatMessage({ id: 'Create' })
    const CreatedMsg = intl.formatMessage({ id: 'Created' })
    const SaveMsg = intl.formatMessage({ id: 'Save' })

    return <>
        <CreateFormListItemButton onClick={openCreateModal} label={CreateButtonLabelMsg || CreateMsg}/>
        <BaseModalForm {...{
            ...props,
            visible,
            cancelModal,
            ModalTitleMsg: props.ModalTitleMsg || CreateMsg,
            ModalSaveButtonLabelMsg: props.ModalSaveButtonLabelMsg || SaveMsg,
            OnCompletedMsg: OnCreatedMsg || CreatedMsg,
        }} />
    </>
}

function CRUDListBlock () { // eslint-disable-line no-unused-vars
    // TODO(pahaz): inside organizations logic here (and remove eslint-disable-line)
}

function BaseModalForm ({ action, mutation, mutationExtraVariables, mutationExtraData, mutationOptions, formValuesToMutationDataPreprocessor, formValuesToMutationDataPreprocessorContext, formInitialValues, children, onMutationCompleted, onFormValuesChange, modalExtraFooter = [], visible, cancelModal, ModalTitleMsg, ModalCancelButtonLabelMsg, ModalSaveButtonLabelMsg, ErrorToFormFieldMsgMapping, OnErrorMsg, OnCompletedMsg }) {
    // TODO(pahaz): refactor all (mutation, mutationExtraVariables, mutationOptions, mutationExtraData) and remove it
    if (mutationOptions) throw new Error('mutationOptions is not supported!')
    if (!children) throw new Error('need to define Form.Item inside ModalForm')
    if (!mutation && !action) throw new Error('need to pass mutation or action prop')
    if (action && mutation) throw new Error('impossible to pass mutation and action prop')
    if (action && mutationExtraVariables) throw new Error('impossible to pass action and mutationExtraVariables prop')
    if (action && mutationExtraData) throw new Error('impossible to pass action and mutationExtraData prop')
    if (typeof visible === 'undefined') throw new Error('need to pass visible prop')
    if (typeof cancelModal === 'undefined') throw new Error('need to pass cancelModal prop')
    if (!mutationExtraData) mutationExtraData = {}
    if (!mutationExtraVariables) mutationExtraVariables = {}
    if (typeof mutationExtraData !== 'object') throw new Error('wrong mutationExtraData prop')
    if (typeof mutationExtraVariables !== 'object') throw new Error('wrong mutationExtraVariables prop')

    const [form] = Form.useForm()
    const [isLoading, setIsLoading] = useState(false)
    let create = null
    if (!action) {
        [create] = useMutation(mutation) // eslint-disable-line react-hooks/rules-of-hooks
    }

    const intl = useIntl()
    const CancelMsg = intl.formatMessage({ id: 'Cancel' })
    const SaveMsg = intl.formatMessage({ id: 'Save' })
    const ClientSideErrorMsg = intl.formatMessage({ id: 'ClientSideError' })

    function handleFormSubmit (values) {
        if (values.hasOwnProperty(NON_FIELD_ERROR_NAME)) delete values[NON_FIELD_ERROR_NAME]
        let data
        try {
            data = (formValuesToMutationDataPreprocessor) ? formValuesToMutationDataPreprocessor(values, formValuesToMutationDataPreprocessorContext) : values
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

        const actionOrMutationProps = (!action) ?
            { mutation: create, variables: { data: { ...data, ...mutationExtraData }, ...mutationExtraVariables } } :
            { action: () => action({ ...data }) }

        return runMutation({
            ...actionOrMutationProps,
            onCompleted: () => {
                if (onMutationCompleted) onMutationCompleted()
                form.resetFields()
            },
            onFinally: () => {
                setIsLoading(false)
                cancelModal()
            },
            intl,
            form,
            ErrorToFormFieldMsgMapping,
            OnErrorMsg,
            OnCompletedMsg,
        })
    }

    function handleSave () {
        form.submit()
    }

    function handleChangeForm (changedValues, allValues) {
        if (onFormValuesChange) onFormValuesChange(changedValues, allValues)
    }

    return (<Modal
        title={ModalTitleMsg || ''}
        visible={visible}
        onCancel={cancelModal}
        footer={[
            ...modalExtraFooter,
            <Button key="cancel" onClick={cancelModal}>{ModalCancelButtonLabelMsg || CancelMsg}</Button>,
            <Button key="submit" onClick={handleSave} type="primary" loading={isLoading}>
                {ModalSaveButtonLabelMsg || SaveMsg}
            </Button>,
        ]}
    >
        <Form
            form={form}
            layout="vertical"
            onFinish={handleFormSubmit}
            initialValues={formInitialValues}
            onValuesChange={handleChangeForm}
        >
            <Form.Item className='ant-non-field-error' name={NON_FIELD_ERROR_NAME}><Input/></Form.Item>
            {children}
        </Form>
    </Modal>)
}

export {
    ValidationError,
    useCreateAndEditModalForm,
    BaseModalForm,
    CreateFormListItemButton,
    ExtraDropdownActionsMenu,
    ExpandableDescription,
}

export default FormList
