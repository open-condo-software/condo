
export function isNeedToLoadNewElements (scrollEvent, lastElementId: string, isLoading: boolean) {
    const dropdown = scrollEvent.currentTarget
    const containerTop = dropdown.getBoundingClientRect().top
    const containerHeight = dropdown.getBoundingClientRect().height
    const lastElement = document.getElementById(lastElementId)
    const lastElementTopPos = lastElement && lastElement.getBoundingClientRect().top - containerTop

    return lastElementTopPos && lastElementTopPos < containerHeight && !isLoading
}