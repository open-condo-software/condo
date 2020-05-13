import qs from 'qs'

function getQueryParams () {
    if (typeof window === 'undefined' || !window.location) return {}
    return (window.location.href.includes('?') ? qs.parse(window.location.href.split('?', 2)[1]) : {})
}

export {
    getQueryParams,
}
