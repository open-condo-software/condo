export const flatten = (object) => {
    return Object.assign({}, ...function _flatten ( objectBit, path = '', prefix = '') {
        return [].concat(
            ...Object.keys(objectBit).map(
                key => typeof objectBit[key] === 'object' ?
                    _flatten(objectBit[key],`${path}${prefix}${key}`, '.') :
                    ({ [`${path}${prefix}${key}`]: objectBit[key] })
            )
        )
    }(object))
}
