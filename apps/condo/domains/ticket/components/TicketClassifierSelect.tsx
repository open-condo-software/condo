import React, { useEffect, useState, useRef } from 'react'
import { Select, Typography, Space } from 'antd'
import { ITicketClassifierUIState, TicketClassifierSelectWhereInput } from '@condo/domains/ticket/utils/clientSchema/TicketClassifier'
import { TicketClassifier as TicketClassifierGQL } from '@condo/domains/ticket/gql'
import { useIntl } from '@core/next/intl'
import { useApolloClient, ApolloClient } from '@core/next/apollo'
import isEmpty from 'lodash/isEmpty'

export async function loadClassifiers (client: ApolloClient, variables: TicketClassifierSelectWhereInput): Promise<ITicketClassifierUIState[]> {
    const data = await client.query({
        query: TicketClassifierGQL.GET_ALL_OBJS_QUERY,
        variables: { sortBy: 'name_ASC', where: variables },
    })
    return data.data.objs
}

const selectStyle = {
    width: '264px',
    marginRight: '44px',
}
interface ITicketClassifierSelectHookInput {
    label: string
    allowClear?: boolean
    showAction?: ('focus' | 'click') []
    onChange: (id: string) => void
}
interface ITicketClassifierSelectHookOutput {
    load: (variables: TicketClassifierSelectWhereInput) => Promise<void>
    SelectComponent: React.FC<{
        disabled?: boolean;
    }>
    setSelected: React.Dispatch<React.SetStateAction<string>>;
    reset: () => void;
    ref: React.MutableRefObject<HTMLSelectElement>;
}

const useTicketClassifierSelectHook = ({ 
    label, 
    onChange, 
    allowClear = true, 
    showAction = ['focus', 'click'],
}: ITicketClassifierSelectHookInput): ITicketClassifierSelectHookOutput => {
    const [classifiers, setClassifiers] = useState<ITicketClassifierUIState[]>([])
    const [selected, setSelected] = useState<string>(null)
    const [loading, setLoading] = useState(false)
    const classifiersRef = useRef<HTMLSelectElement>()
    const client = useApolloClient()
    async function load (variables) {
        setLoading(true)
        const data = await loadClassifiers(client, variables)
        const loaded = data.map(({ id, name }) => ({ id, name }))        
        setClassifiers(loaded)
        setLoading(false)
    }
    const onSelect = (id = null) => {
        setSelected(id)
        onChange(id)
    }
    const reset = () => {
        setSelected(null)
        setClassifiers([])   
    }
    const SelectComponent: React.FC<{ disabled?: boolean }> = (props) => {
        const { disabled } = props
        return (
            !isEmpty(classifiers) &&
            <Space direction={'vertical'} size={8}>
                <Typography.Text type={'secondary'}>{label}</Typography.Text>
                <Select
                    showSearch
                    style={selectStyle}
                    allowClear={allowClear}
                    onSelect={onSelect}
                    onClear={onSelect}
                    optionFilterProp={'title'}
                    value={selected}
                    disabled={disabled}
                    loading={loading}
                    ref={classifiersRef}
                    showAction={showAction}
                >
                    {
                        classifiers.map(place => (
                            <Select.Option value={place.id} key={place.id} title={place.name}>{place.name}</Select.Option>
                        ))
                    }
                </Select>
            </Space>            
        )
    }
    return {
        load,
        SelectComponent,
        setSelected,
        reset,
        ref: classifiersRef,
    }
}


interface ITicketClassifierSelect {
    disabled?: boolean
    initialValue?: string
    onSelect: (id: string) => null
}

export const TicketClassifierSelect: React.FC<ITicketClassifierSelect> = (props) => {
    const { onSelect, disabled, initialValue } = props
    const intl = useIntl()
    const PlacesLabel = intl.formatMessage({ id: 'component.ticketclassifier.PlacesLabel' })
    const CategoriesLabel = intl.formatMessage({ id: 'component.ticketclassifier.CategoriesLabel' })
    const SubjectsLabel = intl.formatMessage({ id: 'component.ticketclassifier.SubjectsLabel' })
    const client = useApolloClient()
   
    const { 
        load: loadSubjects, 
        SelectComponent: SubjectSelect,
        reset: resetSubjects,
        setSelected: setSubject,
        ref: subjectRef,
    } = useTicketClassifierSelectHook({ label: SubjectsLabel, onChange: (id) => {
        onSelect(id)
    } })

    const onCategoryChange = (id) => {
        resetSubjects()
        if (id) {
            loadSubjects({ parent: { id } }).then(_ => 
                subjectRef.current && subjectRef.current.focus()
            )
        }
    } 

    const { 
        load: loadCategories, 
        SelectComponent: CategorySelect,
        reset: resetCategories,
        setSelected: setCategory,
        ref: categoryRef,
    } = useTicketClassifierSelectHook({ label: CategoriesLabel, onChange: onCategoryChange })
    const onPlaceChange = (id) => {
        resetSubjects()
        resetCategories()
        if (id) {    
            loadCategories({ parent: { id } }).then(_ => 
                categoryRef.current && categoryRef.current.focus()
            )
        }
    }
    
    const { 
        load: loadPlaces, 
        SelectComponent: PlaceSelect,
        setSelected: setPlace,
    } = useTicketClassifierSelectHook({ label: PlacesLabel, allowClear: false, showAction: ['click'], onChange: onPlaceChange })

    useEffect(() => {
        loadPlaces({ parent_is_null: true })
        if (initialValue){
            loadClassifiers(client, { id: initialValue }).then(data => {
                const [loadedClassifier] = data
                const { id: subject, parent: { id: category, parent: { id: place } } } = loadedClassifier
                Promise.all([
                    loadCategories({ parent: { id: place } }),
                    loadSubjects({ parent: { id: category } }),
                ]).then(_ => {
                    setPlace(place)
                    setCategory(category)
                    setSubject(subject)
                })
            }).catch(err => console.error(err))
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div style={{ whiteSpace: 'nowrap' }}>
            <PlaceSelect disabled={disabled} />
            <CategorySelect disabled={disabled} />
            <SubjectSelect  disabled={disabled} />
        </div>
    )
}
