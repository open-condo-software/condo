import get from 'lodash/get'

export function isNeedToLoadNewElements (scrollEvent, isLoading: boolean) {
    const target = get(scrollEvent, 'target')
    if (!target) return false

    const scrollTop = target.scrollTop
    let scrollTopMax = target.scrollTopMax
    scrollTopMax = scrollTopMax || target.scrollHeight - target.clientHeight

    return scrollTopMax - 100 < scrollTop && !isLoading
}