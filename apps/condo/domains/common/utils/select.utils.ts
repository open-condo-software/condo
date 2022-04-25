
export function isNeedToLoadNewElements (scrollEvent, isLoading: boolean) {
    const scrollTop = scrollEvent.target.scrollTop
    const scrollTopMax = scrollEvent.target.scrollTopMax

    return scrollTopMax - 100 < scrollTop && !isLoading
}