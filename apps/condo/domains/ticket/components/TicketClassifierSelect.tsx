import React, { useEffect, useState, useRef } from 'react'
import { Select } from 'antd'
import { TicketClassifierSelectWhereInput } from '@condo/domains/ticket/utils/clientSchema/TicketClassifier'
import { TicketClassifier as TicketClassifierGQL } from '@condo/domains/ticket/gql'
import { useApolloClient, ApolloClient } from '@core/next/apollo'
import { TicketClassifierTypeType } from '../../../schema'

export async function loadClassifiers (client: ApolloClient, variables: TicketClassifierSelectWhereInput): Promise<ITicketClassifierUIState[]> {
    const data = await client.query({
        query: TicketClassifierGQL.GET_ALL_OBJS_QUERY,
        variables: { sortBy: 'name_ASC', where: variables },
    })
    return data.data.objs
}

interface ITicketClassifierUIState {
    id: string
    name: string
    type?: TicketClassifierTypeType
    relatesOnClassifiers?: ITicketClassifierUIState[]
}
interface ITicketClassifierSelectHookInput {
    allowClear?: boolean
    showAction?: ('focus' | 'click') []
    onChange: (id: string) => void
}

type ClassifierSelectComponent = React.FC<{
    disabled?: boolean
    selectStyle?: React.CSSProperties
}>

interface ITicketClassifierSelectHookOutput {
    load: (variables: TicketClassifierSelectWhereInput) => Promise<void>
    setClassifiers: React.Dispatch<React.SetStateAction<ITicketClassifierUIState[]>>
    SelectComponent: ClassifierSelectComponent
    setSelected: React.Dispatch<React.SetStateAction<string>>
    reset: () => void
    ref: React.MutableRefObject<HTMLSelectElement>
}

const useTicketClassifierSelectHook = ({
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
    const SelectComponent: React.FC<{ disabled?: boolean, selectStyle?: React.CSSProperties }> = (props) => {
        const { disabled, selectStyle } = props
        return (
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
                    classifiers.map(classifier => (
                        <Select.Option value={classifier.id} key={classifier.id} title={classifier.name}>{classifier.name}</Select.Option>
                    ))
                }
            </Select>
        )
    }
    return {
        load,
        setClassifiers,
        SelectComponent,
        setSelected,
        reset,
        ref: classifiersRef,
    }
}
interface ITicketThreeLevelsClassifierHookInput {
    initialValues: Record<string, string>
}
interface ITicketThreeLevelsClassifierHookOutput {
    LocationSelect: ClassifierSelectComponent
    CategorySelect: ClassifierSelectComponent
    SubjectSelect: ClassifierSelectComponent
}

export const useTicketThreeLevelsClassifierHook = ({ initialValues }: ITicketThreeLevelsClassifierHookInput): ITicketThreeLevelsClassifierHookOutput => {
    console.log('initialValues', initialValues)
    const { locationClassifier, categoryClassifier, subjectClassifier } = initialValues
    console.log('locationClassifier, categoryClassifier, subjectClassifier', locationClassifier, categoryClassifier, subjectClassifier)
    const client = useApolloClient()
    const {
        load: loadSubjects,
        setClassifiers: setSubjects,
        SelectComponent: SubjectSelect,
        reset: resetSubjects,
        setSelected: setSubject,
        ref: subjectRef,
    } = useTicketClassifierSelectHook({ onChange: (id) => {
        // onSelect( { subjectClassifier: id })
    } })

    const onCategoryChange = (id) => {
        resetSubjects()
        if (id) {
            loadSubjects({ type: 'subject' as TicketClassifierTypeType }) // no focus on subjects

            loadCategories({ type: 'category' as TicketClassifierTypeType }).then(_ =>
                categoryRef.current && categoryRef.current.focus()
            )
        }
    }

    const {
        load: loadCategories,
        setClassifiers: setCategories,
        SelectComponent: CategorySelect,
        reset: resetCategories,
        setSelected: setCategory,
        ref: categoryRef,
    } = useTicketClassifierSelectHook({ onChange: onCategoryChange })
    const onLocationChange = (id) => {
        resetSubjects()
        resetCategories()
        if (id) {
            loadCategories({ type: 'category' as TicketClassifierTypeType }).then(_ =>
                categoryRef.current && categoryRef.current.focus()
            )
        }
    }

    const {
        load: loadLocations,
        setClassifiers: setLocations,
        SelectComponent: LocationSelect,
        setSelected: setLocation,
    } = useTicketClassifierSelectHook({ onChange: onLocationChange })

    useEffect(() => {
        loadLocations({ type: 'location' as TicketClassifierTypeType })
        loadCategories({ type: 'category' as TicketClassifierTypeType })

        /*
        if (locationClassifier) {
            setLocation(locationClassifier)
        }
        if (categoryClassifier) {
            setCategory(categoryClassifier)
        }
        if (subjectClassifier) {
            loadClassifiers(client, { id: subjectClassifier }).then(([data]) => {
                const locations = data.relatesOnClassifiers.filter(classifier => classifier.type === 'location' as TicketClassifierTypeType)
                const categories = data.relatesOnClassifiers.filter(classifier => classifier.type === 'category' as TicketClassifierTypeType)
                setLocations(locations)
                setCategories(categories)
            })
        }
        */
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return {
        LocationSelect,
        CategorySelect,
        SubjectSelect,
    }
}
