const _xss = require('xss')

const whiteList = _xss.getDefaultWhiteList()
whiteList.p.push('style')
whiteList.span.push('style')
whiteList.li.push('style')
whiteList.a.push('style')

const xss = new _xss.FilterXSS({
    whiteList,
    css: {
        whiteList: {
            'text-align': true,
            'background-color': true,
        },
    },
})

const sanitizeXss = (html) => xss.process(html)

module.exports = { sanitizeXss }