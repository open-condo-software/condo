import { BaseModalForm } from '@condo/domains/common/components/containers/FormList'
import React, { useEffect, useState } from 'react'
import { StoreValue } from 'rc-field-form/lib/interface'
import { useIntl } from '@core/next/intl'
import { ResourcesList } from '../components/createMeterModal/ResourcesList'
import { MeterInfo } from '../components/createMeterModal/MeterInfo'
import { resourceIdToCreateMeterTitleIdMap } from '../utils/clientSchema'
import { FormattedMessage } from 'react-intl'
import { IMeterResourceUIState } from '../utils/clientSchema/MeterResource'
import { Modal } from 'antd'
import { IMeterFormState } from '../utils/clientSchema/Meter'
import Form from 'antd/lib/form'

type MeterInfoModalTitleProps = {
    resourceId: string
}

const MeterInfoModalTitle = ({ resourceId }: MeterInfoModalTitleProps) => {
    const intl = useIntl()
    const ResourceTitle = intl.formatMessage({ id: resourceIdToCreateMeterTitleIdMap[resourceId] })

    return (
        <FormattedMessage
            id='pages.condo.meter.AddMeterModalTitleTemplate'
            values={{
                resource: ResourceTitle,
            }}
        />
    )
}

type CreateMeterModalProps = {
    addMeterToFormAction: (defaultValue?: StoreValue, insertIndex?: number) => void
    resources: IMeterResourceUIState[]
    newMeters: IMeterFormState[]
}

export const useCreateMeterModal = ()=> {
    const intl = useIntl()
    const ChooseServiceMessage = intl.formatMessage({ id: 'pages.condo.meter.ChooseService' })
    const AddMessage = intl.formatMessage({ id: 'Add' })

    const [isCreateMeterModalVisible, setIsCreateMeterModalVisible] = useState<boolean>(false)
    const [selectedMeterResourceId, setSelectedMeterResourceId] = useState<string | null>(null)

    const [form] = Form.useForm()

    useEffect(() => {
        setSelectedMeterResourceId(null)
    }, [isCreateMeterModalVisible])

    const CreateMeterModal = ({ addMeterToFormAction, resources, newMeters }: CreateMeterModalProps) => {
        return !selectedMeterResourceId ? (
            <Modal
                title={ChooseServiceMessage}
                visible={isCreateMeterModalVisible}
                centered={true}
                footer={[]}
                onCancel={() => setIsCreateMeterModalVisible(false)}
            >
                <ResourcesList
                    resources={resources}
                    setSelectedMeterResource={setSelectedMeterResourceId}
                />
            </Modal>
        ) : (
            <BaseModalForm
                visible={isCreateMeterModalVisible}
                cancelModal={() => setIsCreateMeterModalVisible(false)}
                ModalTitleMsg={<MeterInfoModalTitle resourceId={selectedMeterResourceId}/>}
                ModalSaveButtonLabelMsg={AddMessage}
                showCancelButton={false}
                validateTrigger={['onBlur', 'onSubmit']}
                handleSubmit={
                    (values) => {
                        addMeterToFormAction({ ...values, resource: selectedMeterResourceId })
                        setIsCreateMeterModalVisible(false)
                    }
                }
                form={form}
            >
                <MeterInfo
                    form={form}
                    newMeters={newMeters}
                    resource={resources.find(resource => resource.id === selectedMeterResourceId)}
                />
            </BaseModalForm>
        )
    }

    return {
        CreateMeterModal,
        setIsCreateMeterModalVisible,
    }
}