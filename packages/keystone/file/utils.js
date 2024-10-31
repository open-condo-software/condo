const { createReadStream } = require('fs')
const path = require('path')
const { Duplex } = require('stream')

const iconv = require('iconv-lite')
const jschardet = require('jschardet')

const INVISIBLE_CHARS_REGEXP = new RegExp('[\u200B-\u200D\uFEFF]', 'g')
const FORCE_ENCODING_CHANGE = {
    'X-MAC-CYRILLIC': 'WINDOWS-1251',
    'KOI8-R': 'WINDOWS-1251', // TODO: Find why KOI8 detected on WINDOWS-1251
    'ISO-8859-2': 'WINDOWS-1251',
}

const detectEncoding = (buffer) => {
    const { encoding: detectedEncoding } = jschardet.detect(buffer)
    if (detectedEncoding) {
        const encoding = detectedEncoding.toUpperCase()
        return FORCE_ENCODING_CHANGE[encoding] || encoding
    }
    return null
}
const encode = (buffer, encoding) => {
    if (!encoding) {
        return null
    }
    if (encoding === 'UTF-8') {
        return buffer.toString()
    }
    return iconv.decode(buffer, encoding).toString()
}
const convertEncoding = (buffer, encoding) => {
    return encode(buffer, encoding)
}

const clearString = (cell) => {
    // 0, false should be parsed as '0', 'false', not ''
    if (cell === null || cell === undefined) {
        return ''
    }
    if (typeof cell !== 'string') {
        cell = String(cell)
    }
    return cell
        .replace(/\s+/g, ' ')
        .replace(INVISIBLE_CHARS_REGEXP, '')
        .trim()
}

const readFileFromStream = async (stream) => new Promise((resolve, reject) => {
    const content = []
    stream.on('data', (chunk) => content.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(content)))
    stream.on('error', (error) => reject(error))
})

const getObjectStream = async (file, adapter) => new Promise((resolve, reject) => {
    const { filename } = file
    if (!adapter.s3 && adapter.src) {
        const fullPath = `${adapter.src}${path.sep}${filename}`
        return resolve(createReadStream(fullPath))
    }

    adapter.s3.getObject({
        Bucket: adapter.bucket,
        Key: `${adapter.folder}/${filename}`,
        SaveAsStream: true,
    }, (err, result) => {
        if (err) {
            return reject(err)
        }
        const { CommonMsg: { Status }, InterfaceResult } = result
        if (Status < 300 && InterfaceResult) {
            return resolve(InterfaceResult.Content)
        }
        return reject(Status)
    })
})

/**
 * returns number ranges as a string
 *
 * @param {number[]} lineNumbers lineNumbers
 * @param {number} maxRangeCount the maximum number of ranges in the result
 * @returns {{ranges: string, countLinesInRanges: number}}
 *
 * @example
 * Input: ([1,2,3, 5,6, 7,8, 9, 10], 2)
 * Output: {
 *     countLinesInRanges: 5,
 *     ranges: '1-3, 5-6'
 * }
 */
const toRanges = (lineNumbers = [], maxRangeCount = 10) => {
    let countLinesInRanges = 0
    const ranges = lineNumbers
        .slice()
        .sort((a, b) => a - b)
        .reduce((previousValue, currentValue, index, source) => {
            if ((index > 0) && ((currentValue - source[index - 1]) === 1)){
                previousValue[previousValue.length - 1].count++
                previousValue[previousValue.length - 1].range[1] = currentValue
            } else {
                previousValue.push({ range: [currentValue], count: 1 })
            }
            return previousValue
        }, [])
        .slice(0, maxRangeCount)
        .map(rangeData => {
            countLinesInRanges += rangeData.count
            return rangeData.range.join('-')
        })
        .join(', ')
    return {
        countLinesInRanges,
        ranges,
    }
}

const bufferToStream = (content) => {
    let stream = new Duplex()
    stream.push(content)
    stream.push(null)
    return stream
}

module.exports = {
    clearString,
    readFileFromStream,
    getObjectStream,
    bufferToStream,
    toRanges,
    detectEncoding,
    encode,
    convertEncoding,
}