import React, { useCallback, useEffect, useState } from 'react'

export const useSelectCareeteControls = (id: string) => {
    const [selectInputNode, setSelectInputNode] = useState(null)

    const setSelectRef = useCallback((node) => {
        try {
            if (node !== null) {
                const isSelectMounted = node.updater.isMounted(node)
                if (isSelectMounted) {
                    const addressInput = document.querySelector(`#${id}`)

                    setSelectInputNode(addressInput)
                }
            }
        } catch (e) {
            console.warn('Error while trying to set input element node: ', e)
        }
    }, [])

    const scrollInputCaretToEnd = React.useCallback((node) => {
        try {
            if (node) {
                setTimeout(() => {
                    const length = node.value.length

                    if (!length) {
                        return
                    }

                    // refs. to: https://www.geeksforgeeks.org/how-to-place-cursor-position-at-end-of-text-in-text-input-field-using-javascript/
                    if (node.setSelectionRange) {
                        node.blur()
                        node.focus()
                        node.setSelectionRange(length, length)
                    } else if (node.createTextRange) {
                        const t = node.createTextRange()
                        t.collapse(true)
                        t.moveEnd('character', length)
                        t.moveStart('character', length)
                        t.select()
                    }
                }, 0)
            }
        } catch (e) {
            console.warn('Error while trying to scroll on input end: ', e)
        }
    }, [])

    useEffect(() => {
        scrollInputCaretToEnd(selectInputNode)
    }, [selectInputNode])

    return [scrollInputCaretToEnd, setSelectRef, selectInputNode]
}
