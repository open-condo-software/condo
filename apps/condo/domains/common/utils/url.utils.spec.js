import { getQueryParams, extractHostname, extractRootDomain, extractOrigin } from './url.utils'

describe('getQueryParams()', () => {
    test('with ? case', () => {
        window.history.replaceState({}, '', 'http://localhost:3000/auth/change-password?token=bc55276e&name=Nika')
        expect(getQueryParams()).toEqual({ token: 'bc55276e', name: 'Nika' })
    })

    test('with # case', () => {
        window.history.replaceState({}, '', 'http://localhost:3000/auth/change-password?token=bc55276e&name=Nika#!someval=some2')
        expect(getQueryParams()).toEqual({ token: 'bc55276e', name: 'Nika' })
    })

    test('no ? just # case', () => {
        window.history.replaceState({}, '', 'http://localhost:3000/auth/change-password#!nothing')
        expect(getQueryParams()).toEqual({})
    })

    test('no ? no # case', () => {
        window.history.replaceState({}, '', 'http://localhost:3000/auth/change-password')
        expect(getQueryParams()).toEqual({})
    })
})

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
