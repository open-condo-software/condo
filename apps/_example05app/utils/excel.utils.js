function isValidEmail (email) {
    const re = /^[a-zA-Z0-9_.-]+@(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})$/gi
    return re.test(email.toLowerCase())
}

function getAnyEmail (email) {
    const someMails = email.match(/[a-zA-Z0-9_.-]+@(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})/gi)
    if (someMails && someMails.length === 1) return someMails[0]
    return undefined
}

function isValidPhone (phone) {
    const re = /^[+]?[0-9-. ()]{7,}[0-9]$/gi
    return re.test(phone)
}

function getAnyPhone (phone) {
    const somePhone = phone.match(/[+]?[0-9-. ()]{7,}[0-9]/gi)
    if (somePhone && somePhone.length === 1) return somePhone[0]
    return undefined
}

function formatPhone (p) {
    if (p.length === 11) return `${p[0]} (${p[1]}${p[2]}${p[3]}) ${p[4]}${p[5]}${p[6]} ${p[7]}${p[8]} ${p[9]}${p[10]}`
    const offset = p.length - 11
    const x = p.substring(0, offset)
    const t = p.substring(0 + offset, 11 + offset)
    return `${x}${t[0]} (${t[1]}${t[2]}${t[3]}) ${t[4]}${t[5]}${t[6]} ${t[7]}${t[8]} ${t[9]}${t[10]}`
}

function defaultValidator (value) {
    value = value.replace(/\p{Z}+/gu, ' ')
    value = value.replace(/[ ]*\p{Pd}+[ \p{Pd}]*/gu, '-')
    value = value.replace(/["\u00B6]+/gu, '')
    value = value.replace(/\s+/g, ' ')
    value = value.replace(/^\s+|\s+$/g, '')
    if (/[™×÷‼‽⁇⁈⁉©®±°$¢£¤¥¦§{}=*;:&^%@!?<>]/g.test(value)) {
        return {
            status: 'error',
            message: '[has.bad.char]',
        }
    }
    return {
        status: 'ok',
        cleanedValue: value,
        formattedValue: value,
    }
}

function addressValidator (value) {
    value = value.replace(/\p{Z}+/gu, ' ')
    value = value.replace(/[ ]*\p{Pd}+[ \p{Pd}]*/gu, '-')
    value = value.replace(/["\u00B6]+/gu, '')
    value = value.replace(/\s+/g, ' ')
    value = value.replace(/^\s+|\s+$/g, '')
    if (!isNaN(value.replace(/[0-9,. -]+/g, ''))) {
        return {
            status: 'error',
            message: '[is.number]',
        }
    }
    if (/[™×÷‼‽⁇⁈⁉©®±°$¢£¤¥¦§{}=*;:&^%@!?<>]/g.test(value)) {
        return {
            status: 'error',
            message: '[has.bad.char]',
        }
    }
    const letters = value.replace(/\p{N}+/gu, '').match(/\p{L}+/gu)
    if (!letters || letters.join('').length < 4) {
        return {
            status: 'error',
            message: '[too.short.address]',
        }
    }
    if (!value.includes(' ')) {
        return {
            status: 'warn',
            message: '[no.name.space]',
            cleanedValue: value,
            formattedValue: value,
        }
    }
    return {
        status: 'ok',
        cleanedValue: value,
        formattedValue: value,
    }
}

function nameValidator (value) {
    value = value.replace(/\p{Z}+/gu, ' ')
    value = value.replace(/[ ]*\p{Pd}+[ \p{Pd}]*/gu, '-')
    value = value.replace(/["\u00B6]+/gu, '')
    value = value.replace(/\s+/g, ' ')
    value = value.replace(/^\s+|\s+$/g, '')
    if (!isNaN(value.replace(/[0-9,. -]+/g, ''))) {
        return {
            status: 'error',
            message: '[is.number]',
        }
    }
    if (/[™×÷‼‽⁇⁈⁉©®±°¢£¤¥¦§{}()_=+*;:&^%$#@!?<>|№\\/[\]]/g.test(value)) {
        return {
            status: 'error',
            message: '[has.bad.char]',
        }
    }
    const letters = value.replace(/\p{N}+/gu, '').match(/\p{L}+/gu)
    if (!letters || letters.join('').length < 4) {
        return {
            status: 'error',
            message: '[too.short.name]',
        }
    }
    if (!value.includes(' ')) {
        return {
            status: 'warn',
            message: '[no.name.space]',
            cleanedValue: value,
            formattedValue: value,
        }
    }
    return {
        status: 'ok',
        cleanedValue: value,
        formattedValue: value,
    }
}

function emailValidator (value) {
    if (!value.includes('@')) {
        return {
            status: 'error',
            message: '[no.email.sign]',
        }
    }
    value = value.replace(/^\s+|\s+$/g, '')
    if (isValidEmail(value)) {
        return {
            status: 'ok',
            cleanedValue: value.toLowerCase(),
            formattedValue: value,
        }
    }
    value = getAnyEmail(value)
    if (value) {
        return {
            status: 'warn',
            message: '[warn.email.format]',
            cleanedValue: value.toLowerCase(),
            formattedValue: value,
        }
    }
    return {
        status: 'error',
        message: '[error.email.format]',
    }
}

function phoneValidator (value) {
    value = value.replace(/^\s+|\s+$/g, '')
    let digits = (value.match(/[0-9]+/g) || []).join('')
    if (digits.length < 10) {
        return {
            status: 'error',
            message: '[too.short.phone]',
        }
    }
    if (digits.length > 15) {
        return {
            status: 'error',
            message: '[too.long.phone]',
        }
    }
    if (isValidPhone(value)) {
        return {
            status: 'ok',
            cleanedValue: digits,
            formattedValue: formatPhone(digits),
        }
    }
    value = getAnyPhone(value)
    if (value) {
        return {
            status: 'warn',
            message: '[warn.phone.format]',
            cleanedValue: digits,
            formattedValue: formatPhone(digits),
        }
    }
    return {
        status: 'error',
        message: '[error.phone.format]',
    }
}

const VALIDATORS = {
    'flat': defaultValidator,
    'floor': defaultValidator,
    'section': defaultValidator,
    'address': addressValidator,
    'name': nameValidator,
    'email': emailValidator,
    'phone': phoneValidator,
}

function validate (formatter, value, validators = VALIDATORS) {
    if (!validators[formatter]) throw new Error(`unknown formatter ${formatter}`)
    const validator = validators[formatter]
    if (value === null || value === undefined) value = ''
    value = String(value).normalize()
    return validator(value)
}

function toExData (data) {
    const exData = new Array(data.length)
    const rowLength = Math.max.apply(null, data.map(x => x.length))
    for (let i = 0; i < data.length; i++) {
        exData[i] = new Array(rowLength)
        for (let j = 0; j < rowLength; j++) {
            exData[i][j] = { value: data[i][j] }
        }
    }
    return exData
}

function reValidateExData (exData, currentSettings, newSettings, validators = VALIDATORS) {
    Object.entries(newSettings).forEach(([colIndex, formatter]) => {
        if (!formatter) return
        for (let i = 0; i < exData.length; i++) {
            let value = exData[i][colIndex].value
            const { status, message, cleanedValue, formattedValue } = validate(formatter, value, validators)
            Object.assign(exData[i][colIndex], { status, message, cleanedValue, formattedValue })
        }
    })
    Object.entries(currentSettings).forEach(([colIndex, formatter]) => {
        if (!formatter) return
        if (!validators[formatter]) throw new Error(`unknown formatter ${formatter}`)
        if (newSettings[colIndex]) return
        for (let i = 0; i < exData.length; i++) {
            const { status, message, cleanedValue, formattedValue } = {}
            Object.assign(exData[i][colIndex], { status, message, cleanedValue, formattedValue })
        }
    })
}

function fromExData (exData, mapping, { uniqueBy = [], randomKey = 'id' } = {}) {
    const unique = Object.fromEntries((uniqueBy) ? uniqueBy.map((key) => [key, new Set()]) : [])
    const result = []
    for (let i = 0; i < exData.length; i++) {
        const row = {}
        let skip = false
        Object.entries(mapping).forEach(([colIndex, formatter]) => {
            const name = formatter
            const objValue = exData[i][colIndex]
            if (typeof objValue !== 'object') { throw new Error('exData should have Object as exData[i][j] type') }
            const value = objValue.cleanedValue || objValue.value
            if (unique[name]) {
                if (unique[name].has(value)) {skip = true} else {unique[name].add(value)}
            }
            row[name] = value
        })
        if (!skip) {
            row[randomKey] = Math.random()
            result.push(row)
        }
    }
    return result
}

const isExValue = (x) => (typeof x === 'object' && x.hasOwnProperty('value'))

module.exports = {
    isExValue,
    toExData,
    fromExData,
    reValidateExData,
    validate,
    defaultValidator,
    addressValidator,
    nameValidator,
    emailValidator,
    phoneValidator,
}
