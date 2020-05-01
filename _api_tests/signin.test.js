"use strict";

const { makeClient, makeLoggedInClient, DEFAULT_TEST_USER_IDENTITY, DEFAULT_TEST_USER_SECRET, gql } = require('../core/test.utils');

const SIGNIN_MUTATION = gql`
    mutation sigin($identity: String, $secret: String) {
        auth: authenticateUserWithPassword(email: $identity, password: $secret) {
            user: item {
                id
            }
        }
    }
`;

const GET_MY_USERINFO = gql`
    query getUser {
        user: authenticatedUser {
            id
        }
    }
`;

test('anonymous: try to sign in', async () => {
    const client = await makeClient();
    const { data } = await client.mutate(SIGNIN_MUTATION, {
        "identity": DEFAULT_TEST_USER_IDENTITY,
        "secret": DEFAULT_TEST_USER_SECRET
    });
    expect(data.auth.user.id).toMatch(/[a-zA-Z0-9-_]+/);
});

test('anonymous: get user info', async () => {
    const client = await makeClient();
    const { data } = await client.query(GET_MY_USERINFO);
    expect(data).toEqual({ "user": null });
});


test('get user info after sign in', async () => {
    const client = await makeLoggedInClient();
    const { data } = await client.query(GET_MY_USERINFO);
    expect(data.user).toEqual({ id: client.user.id });
});

