import {
    extractHostname,
    extractRootDomain,
    extractOrigin,
    isSafeUrl,
} from './url.utils'

describe('extractHostname', () => {
    expect(extractHostname('http://www.blog.classroom.me.uk/index.php')).toEqual('www.blog.classroom.me.uk')
    expect(extractHostname('http://www.youtube.com/watch?v=ClkQA2Lb_iE')).toEqual('www.youtube.com')
    expect(extractHostname('https://www.youtube.com/watch?v=ClkQA2Lb_iE')).toEqual('www.youtube.com')
    expect(extractHostname('www.youtube.com/watch?v=ClkQA2Lb_iE')).toEqual('www.youtube.com')
    expect(extractHostname('ftps://ftp.websitename.com/dir/file.txt')).toEqual('ftp.websitename.com')
    expect(extractHostname('websitename.com:1234/dir/file.txt')).toEqual('websitename.com')
    expect(extractHostname('ftps://websitename.com:1234/dir/file.txt')).toEqual('websitename.com')
    expect(extractHostname('example.com?param=value')).toEqual('example.com')
    expect(extractHostname('https://facebook.github.io/jest/')).toEqual('facebook.github.io')
    expect(extractHostname('//youtube.com/watch?v=ClkQA2Lb_iE')).toEqual('youtube.com')
    expect(extractHostname('http://localhost:4200/watch?v=ClkQA2Lb_iE')).toEqual('localhost')
})

describe('exctractRootDomain', () => {
    expect(extractRootDomain('http://www.blog.classroom.me.uk/index.php')).toEqual('classroom.me.uk')
    expect(extractRootDomain('http://www.youtube.com/watch?v=ClkQA2Lb_iE')).toEqual('youtube.com')
    expect(extractRootDomain('https://www.youtube.com/watch?v=ClkQA2Lb_iE')).toEqual('youtube.com')
    expect(extractRootDomain('www.youtube.com/watch?v=ClkQA2Lb_iE')).toEqual('youtube.com')
    expect(extractRootDomain('ftps://ftp.websitename.com/dir/file.txt')).toEqual('websitename.com')
    expect(extractRootDomain('websitename.co.uk:1234/dir/file.txt')).toEqual('websitename.co.uk')
    expect(extractRootDomain('ftps://websitename.com:1234/dir/file.txt')).toEqual('websitename.com')
    expect(extractRootDomain('example.com?param=value')).toEqual('example.com')
    expect(extractRootDomain('https://facebook.github.io/jest/')).toEqual('github.io')
    expect(extractRootDomain('//youtube.com/watch?v=ClkQA2Lb_iE')).toEqual('youtube.com')
    expect(extractRootDomain('http://localhost:4200/watch?v=ClkQA2Lb_iE')).toEqual('localhost')
})

describe('extractOrigin', () => {
    expect(extractOrigin('http://www.blog.classroom.me.uk/index.php')).toEqual('http://www.blog.classroom.me.uk')
    expect(extractOrigin('http://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual('http://www.youtube.com')
    expect(extractOrigin('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual('https://www.youtube.com')
    expect(extractOrigin('http://localhost:3002/import')).toEqual('http://localhost:3002')
    expect(extractOrigin('https://mysite.com?param=1')).toEqual('https://mysite.com')
    expect(extractOrigin('asdhjjaks')).toEqual(null)
})

describe('isSafeUrl', () => {
    describe('safe url cases', () => {
        const safeCases = [
            'https://github.com',
            'https://v1.doma.ai/ticket',
            '%2Fticket',
            '/ticket',
        ]
        test.each(safeCases)('%p must be safe', (url) => {
            expect(isSafeUrl(url)).toEqual(true)
        })
    })
    describe('unsafe url cases', () => {
        const unsafeCases = [
            'javascript:alert(document.cookie)',
            'Jav%09ascript:alert(document.cookie)',
            '%09Jav%09ascript:alert(document.cookie)',
            'Jav%20ascRipt:alert(document.cookie)',
            '',
        ]
        test.each(unsafeCases)('%p must be unsafe', (url) => {
            expect(isSafeUrl(url)).toEqual(false)
        })
    })
})
