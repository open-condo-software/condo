import React, { useEffect, useState, useRef, useMemo } from 'react'
import { Select, Input } from 'antd'
import { useApolloClient } from '@core/next/apollo'
const { Option } = Select
import { uniqBy } from 'lodash'

enum TicketClassifierTypes {
    place,
    category,
    description,
}
interface ITicketClassifierUIState {
    id: string
    name: string
}
interface ITicketClassifierRuleUIState {
    id?: string
    place: Record<string, string>
    category: Record<string, string>
    description: Record<string, string>
}
interface ITicketThreeLevelsClassifierHookInput {
    initialValues: { classifierRule: string }
}
interface ITicketThreeLevelsClassifierHookOutput {
    ClassifierRuleHiddenInput: JSX.Element
    PlaceSelect: ClassifierSelectComponent
    CategorySelect: ClassifierSelectComponent
    DescriptionSelect: ClassifierSelectComponent
}

interface ITicketClassifierSelectHookInput {
    onChange: (id: string) => void
    type: TicketClassifierTypes
}

type ClassifierSelectComponent = React.FC<{
    disabled?: boolean
    style?: React.CSSProperties
}>

interface ITicketClassifierSelectHookOutput {
    set: {
        all: React.Dispatch<React.SetStateAction<ITicketClassifierUIState[]>>
        one: React.Dispatch<React.SetStateAction<string>>
    }
    SelectComponent: ClassifierSelectComponent
    ref: React.MutableRefObject<HTMLSelectElement>
}

const useTicketClassifierSelectHook = ({
    onChange,
    type,
}: ITicketClassifierSelectHookInput): ITicketClassifierSelectHookOutput => {
    const [selected, setSelected] = useState<string>(null)
    const [classifiers, setClassifiersFromLinks] = useState<ITicketClassifierUIState[]>([])
    const [searchClassifiers, setSearchClassifiers] = useState<ITicketClassifierUIState[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const classifiersRef = useRef<HTMLSelectElement>(null)
    const optionsRef = useRef<ITicketClassifierUIState[]>([])

    const setClassifiers = (classifiers) => {
        setClassifiersFromLinks(classifiers)
        // We need to remove search classifiers
        setSearchClassifiers([])
    }

    const handleSearch = async (input) => {
        setIsLoading(true)
        // const loaded = await loadClassifiers(client, { name_contains: input })
        // setSearchClassifiers(loaded.map(({ id, name }) => ({ id, name })))
        setIsLoading(false)
    }

    const buildOptions = () => {
        optionsRef.current = uniqBy([...classifiers, ...searchClassifiers], 'id')
    }

    useEffect(() => {
        buildOptions()
    }, [classifiers, searchClassifiers])

    const SelectComponent = useMemo(() => {
        const SelectComponentWrapper: React.FC<{ disabled?: boolean, style?: React.CSSProperties }> = (props) => {
            const { disabled, style } = props
            return (
                <Select
                    showSearch
                    style={style}
                    allowClear={true}
                    onSelect={onChange}
                    onSearch={handleSearch}
                    onClear={() => onChange(null)}
                    optionFilterProp={'title'}
                    defaultActiveFirstOption={false}
                    value={selected}
                    disabled={disabled}
                    loading={isLoading}
                    ref={classifiersRef}
                    showAction={['focus', 'click']}
                >
                    {
                        optionsRef.current.map(classifier => (
                            <Option value={classifier.id} key={classifier.id} title={classifier.name}>{classifier.name}</Option>
                        ))
                    }

                </Select>
            )
        }
        return SelectComponentWrapper
    }, [selected, classifiers])

    return {
        SelectComponent,
        set: {
            all: setClassifiers,
            one: setSelected,
        },
        ref: classifiersRef,
    }
}

const linksToOptions = (data, field): ITicketClassifierUIState[] => {
    const fromLinks = Object.fromEntries(data.map(link => {
        if (link[field]) {
            return [link[field].id, link[field]]
        } else {
            return [null, { id: null, name: '' }]
        }
    }))
    if (isEmpty(fromLinks)) {
        return []
    } else {
        return sortBy(Object.values(fromLinks), 'name')
    }
}

export const useTicketThreeLevelsClassifierHook = ({ initialValues: { classifierRule } }: ITicketThreeLevelsClassifierHookInput): ITicketThreeLevelsClassifierHookOutput => {
    const initialState = { place: null, category:null, description: null }
    const threeLvlSelectState = useRef(initialState)
    const [selectedRule, setSelectedRule] = useState<string>(classifierRule ? classifierRule : null)
    const client = useApolloClient()

    const onUserSelect = (id, type) => {
        threeLvlSelectState.current = { ...threeLvlSelectState.current, [type]: id }
        updateLevels({ [type]: id })
    }

    const {
        set: descriptionSet,
        SelectComponent: DescriptionSelect,
    } = useTicketClassifierSelectHook({
        onChange: (id) => onUserSelect(id, TicketClassifierTypes.description),
        type: TicketClassifierTypes.place,
    })

    const {
        set: categorySet,
        SelectComponent: CategorySelect,
        ref: categoryRef,
    } = useTicketClassifierSelectHook({
        onChange: (id) => onUserSelect(id, TicketClassifierTypes.category),
        type: TicketClassifierTypes.category,
    })

    const {
        set: placeSet,
        SelectComponent: PlaceSelect,
        ref: placeRef,
    } = useTicketClassifierSelectHook({
        onChange: (id) => onUserSelect(id, TicketClassifierTypes.place),
        type: TicketClassifierTypes.place,
    })

    const Setter = {
        place: placeSet,
        category: categorySet,
        description: descriptionSet,
    }

    useEffect(() => {
        if (selectedRule) {
            loadClassifierLinks(client, { id: selectedRule }).then(([link]) => {
                const { place, category, description } = link
                threeLvlSelectState.current = { place: place.id, category: category.id, description: description.id }
                updateLevels(threeLvlSelectState.current)
            })
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const ClassifierRuleHiddenInput = useMemo(() => {
        return (
            <Input type='text' value={selectedRule}></Input>
        )
    }, [selectedRule])

    const load3levels = async () => {
        const { place, category, description } = threeLvlSelectState.current
        const loadedLinks = await Promise.all([
            { category, description, type: 'location' },
            { place, description, type: 'category' },
            { place, category, type: 'subject' },
        ].map(selector => {
            const { type, ...querySelectors } = selector
            return new Promise<unknown[]>(resolve => {
                const query = {}
                for (const key in querySelectors) {
                    if (querySelectors[key]) {
                        query[key] = { id: querySelectors[key] }
                    }
                }
                loadClassifierLinks(client, query).then(data => resolve([type, linksToOptions(data, type)]))
            })
        }))
        const result = Object.fromEntries(loadedLinks)
        return result
    }

    const openSelect = (ref) => {
        if (ref.current) {
            ref.current.blur()
            setTimeout(ref.current.focus, 0)
        }
    }

    const updateLevels = async (selected = {}) => {
        threeLvlSelectState.current = { ...threeLvlSelectState.current, ...selected }
        const options = await load3levels()
        const state = threeLvlSelectState.current
        const updateEmptyState = {}
        Object.keys(Setter).forEach(type => {
            const isExisted = options[type].find(x => x.id === state[type])
            if (!isExisted && state[type]) {
                updateEmptyState[type] = null
            }
        })
        if (!isEmpty(updateEmptyState)) {
            threeLvlSelectState.current = { ...threeLvlSelectState.current, ...updateEmptyState, ...selected }
            return await updateLevels(selected)
        }
        Object.keys(Setter).forEach(type => {
            Setter[type].all(options[type])
            const isExisted = options[type].find(option => option.id === state[type])
            Setter[type].one(isExisted ? state[type] : null)
        })
        if (!state.place && state.category) {
            openSelect(placeRef)
        } else if (!state.category && state.place) {
            openSelect(categoryRef)
        }
    }



    return {
        ClassifierRuleHiddenInput,
        PlaceSelect,
        CategorySelect,
        DescriptionSelect,
    }
}
