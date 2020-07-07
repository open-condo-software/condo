import { Button, Dropdown, Form, List, Menu, Popconfirm, Skeleton } from 'antd'
import { PlusOutlined, DownOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { useState } from 'react'

const identity = (x) => !!x

const SListItemForm = styled(Form)`
    width: 100%;
    display: flex;
    flex-flow: row wrap;
    justify-content: center;
    align-items: stretch;
    align-content: stretch;
`

const SListItem = styled(List.Item)`
`

const SListItemMeta = styled(List.Item.Meta)`
    flex: 1 0 65%;
`

const SListItemExtra = styled.div`
    flex: none;
`

const SListActionsUl = styled.ul`
    margin: 10px 10px 0;
    text-align: center;
    
    > li {
        margin: 0;
    }
`

function FormList ({ renderItem, ...extra }) {
    return <List
        size="large"
        itemLayout={'horizontal'}
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
                <Skeleton loading={item.loading} active>
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
                </Skeleton>
            </SListItemForm>
        </SListItem>
    }
}

function CreateFormListItemButton ({ label, ...extra }) {
    return <Button
        type="dashed"
        style={{
            width: '100%',
            marginBottom: 8,
        }}
        {...extra}
    >
        <PlusOutlined/>{label}
    </Button>
}

function ExtraDropdownActionsMenu ({ actions }) {
    const [v, setV] = useState({ visible: false, title: null, icon: null })

    function handleAction ({ key }) {
        const action = actions[key]
        if (action.confirm) {
            setV({
                visible: true,
                onConfirm: action.action,
                onCancel: () => setV({ visible: false, title: null, icon: null }),
                ...action.confirm,
            })
        } else {
            setV({ visible: false, title: null, icon: null })
            action.action()
        }
    }

    return <Popconfirm {...v}>
        <Dropdown overlay={<Menu onClick={handleAction}>
            {actions.map((action, i) => <Menu.Item key={i}>{action.label}</Menu.Item>)}
        </Menu>}>
            <a> ... <DownOutlined/></a>
        </Dropdown>
    </Popconfirm>
}

export {
    CreateFormListItemButton,
    ExtraDropdownActionsMenu,
}
export default FormList
