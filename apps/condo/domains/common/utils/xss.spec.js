const { sanitizeXss } = require('@condo/domains/common/utils/xss')

const ALLOWED_STYLE_ATTR = 'style="text-align:center; background-color:red;"'
const getValidHtmlTagsWithStyles = style => `<li ${style}><p ${style}><a ${style}>lorem</a> <span ${style}>ipsum</span></p>`

describe('xss', () => {
    it('allow text-align and background-color style attribute values to p, span, li, a, tags', () => {
        const html = getValidHtmlTagsWithStyles(ALLOWED_STYLE_ATTR)

        expect(sanitizeXss(html)).toEqual(html)
    })

    it('not allow other style attribute values to p, span, li, a, tags', () => {
        const html = getValidHtmlTagsWithStyles('style="width: expression(alert(\'XSS\'));"')
        const expectedResult = '<li style><p style><a style>lorem</a> <span style>ipsum</span></p>'

        expect(sanitizeXss(html)).toEqual(expectedResult)
    })

    it('not allow style attribute to other tags', () => {
        const html = '<div style="background-image: url(javascript:alert(\'XSS\'))">123</div>'
        const expectedResult = '<div>123</div>'

        expect(sanitizeXss(html)).toEqual(expectedResult)
    })

    it('escape script tag', () => {
        const html = '<script> console.log(\'123\') </script>'
        const expectedResult = '&lt;script&gt; console.log(\'123\') &lt;/script&gt;'

        expect(sanitizeXss(html)).toEqual(expectedResult)
    })
})