const PII_RULES = [
    {
        name: 'email',
        pattern: /\S+@\S+\.\S+/g,
    },
    {
        name: 'phone',
        pattern: /(?:^|\s|\()(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{2}[-.\s]?\d{2}\b(?:\s*(?:#|x\.?)\s*\d+)?/g,
    },
]

function processValue (value, piiMaps, piiCounters, path = '', visited = new WeakSet()) {
    if (typeof value === 'string') {
        for (const rule of PII_RULES) {
            if (rule.pattern.test(value) && rule.pattern.test(value.trim())) {
                return createReplacement(value, rule, piiMaps, piiCounters, path)
            }
        }
        return processStringForPII(value, piiMaps, piiCounters, path)
    }
    
    // This is the case of circular reference
    if (visited.has(value)) {
        return undefined
    }
    
    if (Array.isArray(value)) {
        return processArray(value, piiMaps, piiCounters, path, visited)
    }
    
    if (value !== null && typeof value === 'object') {
        return processObject(value, piiMaps, piiCounters, path, visited)
    }
    
    return { value }
}

function createReplacement (original, rule, piiMaps, piiCounters, path) {
    const key = `${path}:${original}`
    const ruleMap = piiMaps[rule.name]
    
    if (!ruleMap.has(key)) {
        piiCounters[rule.name] = (piiCounters[rule.name] || 0) + 1
        ruleMap.set(key, `<${rule.name}${piiCounters[rule.name]}>`)
    }
    
    const placeholder = ruleMap.get(key)
    return {
        value: placeholder,
        replacements: { [placeholder]: original },
    }
}

function processStringForPII (str, piiMaps, piiCounters, path) {
    let result = str
    const localReplacements = {}
    
    for (const rule of PII_RULES) {
        result = result.replace(rule.pattern, (match) => {
            if (!match || !match.trim() || !rule.pattern.test(match.trim())) return match
            
            const { value: placeholder, replacements } = createReplacement(match, rule, piiMaps, piiCounters, path)
            Object.assign(localReplacements, replacements)
            return placeholder
        })
    }
    
    return { 
        value: result, 
        replacements: localReplacements,
    }
}

function processArray (arr, piiMaps, piiCounters, path, visited) {
    visited.add(arr)
    const result = []
    const allReplacements = {}
    
    arr.forEach((item, index) => {
        const processed = processValue(item, piiMaps, piiCounters, `${path}[${index}]`, visited)
        if (processed !== undefined) {
            result.push(processed.value)
            Object.assign(allReplacements, processed.replacements || {})
        }
    })
    
    return {
        value: result,
        replacements: allReplacements,
    }
}

function processObject (obj, piiMaps, piiCounters, path, visited) {
    visited.add(obj)
    const result = {}
    const allReplacements = {}
    
    for (const [key, val] of Object.entries(obj)) {
        const processed = processValue(val, piiMaps, piiCounters, path ? `${path}.${key}` : key, visited)
        if (processed !== undefined) {
            result[key] = processed.value
            Object.assign(allReplacements, processed.replacements || {})
        }
    }
    
    for (const map of Object.values(piiMaps)) {
        for (const [matchKey, placeholder] of map.entries()) {
            allReplacements[placeholder] = matchKey.split(':').pop()
        }
    }
    
    return { 
        value: result, 
        replacements: allReplacements,
    }
}

function removeSensitiveDataFromObj (obj) {
    const piiMaps = {}
    const piiCounters = {}
    
    PII_RULES.forEach(rule => {
        piiMaps[rule.name] = new Map()
        piiCounters[rule.name] = 0
    })
    
    const { value: cleaned, replacements = {} } = processValue(obj, piiMaps, piiCounters)
    const allReplacements = { ...replacements }
    
    for (const rule of PII_RULES) {
        for (const [key, placeholder] of piiMaps[rule.name].entries()) {
            if (!allReplacements[placeholder]) {
                allReplacements[placeholder] = key.split(':').pop()
            }
        }
    }
    
    return {
        cleaned,
        replacements: allReplacements,
    }
}

function restoreSensitiveData (obj, replacements, path = '') {
    if (!obj || typeof obj !== 'object') {
        if (typeof obj !== 'string') return obj
        
        if (replacements[obj] !== undefined) {
            return replacements[obj]
        }
        
        return Object.entries(replacements).reduce(
            (str, [placeholder, original]) => str.split(placeholder).join(original),
            obj
        )
    }

    if (Array.isArray(obj)) {
        return obj.map((item, index) => 
            restoreSensitiveData(item, replacements, `${path}[${index}]`)
        )
    }

    const result = { ...obj }
    
    for (const [key, value] of Object.entries(result)) {
        const currentPath = path ? `${path}.${key}` : key
        
        if (typeof value === 'string') {
            result[key] = restoreSensitiveData(value, replacements, currentPath)
        } else if (value !== null && typeof value === 'object') {
            result[key] = restoreSensitiveData(value, replacements, currentPath)
        }
    }
    
    return result
}

module.exports = {
    removeSensitiveDataFromObj,
    restoreSensitiveData,
}
