jest.mock('@open-condo/config', () => {
    const conf = jest.requireActual('@open-condo/config')
    const get = (_, name) => {
        if (name === 'PASSPORT_GITHUB') {
            return '{"clientId": "123", "clientSecret": "321", "callbackUrl": "/api/github/auth/callback", "name": "github", "isEmailTrusted": true, "isPhoneTrusted": false}'
        }
        return conf[name]
    }
    return new Proxy(conf, { get, set: jest.fn() })
})

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const nock = require('nock')
const request = require('supertest')

const { fetch } = require('@open-condo/keystone/fetch')
const { makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')
const { setFakeClientMode } = require('@open-condo/keystone/test.utils')


describe('external authentication', () => {
    setFakeClientMode(index)
    let admin
    let serverUrl
    let agent

    const OLD_ENV = JSON.parse(JSON.stringify(process.env))

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        serverUrl = admin.serverUrl
        agent = request.agent(serverUrl)
        jest.resetModules()
    })
    afterAll(() => {
        nock.cleanAll()
        process.env = { ...OLD_ENV }
    })

    describe('Validation', () => {
        test('Auth url without userType query argument should fail', async () => {

            const result = await fetch(serverUrl + '/api/github/auth')
            const json = await result.json()

            expect(result.status).toEqual(400)
            expect(json).toHaveProperty('error', 'Bad Request')
            expect(json).toHaveProperty('message', 'The userType query parameter is required.')
        })

        test('Auth url with wrong userType should fail', async () => {
            const result = await fetch(serverUrl + '/api/github/auth?userType=service')
            const json = await result.json()

            expect(result.status).toEqual(400)
            expect(json).toHaveProperty('error', 'Bad Request')
            expect(json).toHaveProperty('message', 'Valid user types are resident, staff')
        })
    })

    describe('GitHub authentication flow', () => {
        test('should create user, userExternalIdentity and return oidc token', async () => {
            nock('https://github.com')
                .get('/login/oauth/authorize')
                .query(true)
                .reply(302, undefined,  { location: `${serverUrl}/api/github/auth/callback?code=some_gh_code` })

            nock('https://github.com')
                .post('/login/oauth/access_token')
                .reply(200, {
                    access_token: 'some_access_token',
                    scope:'user:email',
                    'token_type': 'bearer',
                })

            const fakedUserId = faker.datatype.uuid()
            const fakedUserEmail = faker.datatype.uuid() + faker.internet.email()

            const githubUserResponse = {
                'login': fakedUserId,
                'id': fakedUserId,
                'node_id': 'MDQ6VXNlcjE=',
                'avatar_url': 'https://github.com/images/error/octocat_happy.gif',
                'gravatar_id': '',
                'url': 'https://api.github.com/users/octocat',
                'html_url': 'https://github.com/octocat',
                'followers_url': 'https://api.github.com/users/octocat/followers',
                'following_url': 'https://api.github.com/users/octocat/following{/other_user}',
                'gists_url': 'https://api.github.com/users/octocat/gists{/gist_id}',
                'starred_url': 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
                'subscriptions_url': 'https://api.github.com/users/octocat/subscriptions',
                'organizations_url': 'https://api.github.com/users/octocat/orgs',
                'repos_url': 'https://api.github.com/users/octocat/repos',
                'events_url': 'https://api.github.com/users/octocat/events{/privacy}',
                'received_events_url': 'https://api.github.com/users/octocat/received_events',
                'type': 'User',
                'site_admin': false,
                'name': fakedUserId,
                'company': 'GitHub',
                'blog': 'https://github.com/blog',
                'location': 'San Francisco',
                'email': fakedUserEmail,
                'hireable': false,
                'bio': 'There once was...',
                'twitter_username': 'monatheoctocat',
                'public_repos': 2,
                'public_gists': 1,
                'followers': 20,
                'following': 0,
                'created_at': '2008-01-14T04:33:35Z',
                'updated_at': '2008-01-14T04:33:35Z',
                'private_gists': 81,
                'total_private_repos': 100,
                'owned_private_repos': 100,
                'disk_usage': 10000,
                'collaborators': 8,
                'two_factor_authentication': true,
                'plan': {
                    'name': 'Medium',
                    'space': 400,
                    'private_repos': 20,
                    'collaborators': 0,
                },
            }

            nock('https://api.github.com')
                .get('/user')
                .reply(200, githubUserResponse)

            nock('https://api.github.com')
                .get('/user/emails')
                .reply(200,
                    [
                        {
                            'email': fakedUserEmail,
                            'verified': true,
                            'primary': true,
                            'visibility': 'public',
                        },
                    ])
            const response = await agent.get('/api/github/auth?userType=staff')
            expect(response.statusCode).toEqual(302)

            const tokenResponse = await agent.get('/api/github/auth/callback?code=some_gh_code')
            expect(tokenResponse.body).toHaveProperty('accessToken')
            expect(tokenResponse.body).toHaveProperty('scope', 'openid')
            expect(tokenResponse.body).toHaveProperty('tokenType', 'Bearer')
            expect(tokenResponse.statusCode).toEqual(200)
        })
    })
})
