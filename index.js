const { Keystone } = require('@keystonejs/keystone');
const { PasswordAuthStrategy } = require('@keystonejs/auth-password');
const { GraphQLApp } = require('@keystonejs/app-graphql');
const { AdminUIApp } = require('@keystonejs/app-admin-ui');
const { NextApp } = require('@keystonejs/app-next');
const { StaticApp } = require('@keystonejs/app-static');

const conf = require('./config');
const access = require("./core/access");
const { getAdapter } = require("./core/adapter.utils");
const { registerLists } = require("./core/lists");

const keystone = new Keystone({
    name: conf.PROJECT_NAME,
    adapter: getAdapter(conf.DATABASE_URL),
    defaultAccess: { list: false, field: true, custom: false },
    queryLimits: { maxTotalResults: 1000 },
    onConnect: async () => {
        // Initialise some data
        if (conf.NODE_ENV !== 'development') return; // Just for dev env purposes!
        const users = await keystone.lists.User.adapter.findAll();
        if (!users.length) {
            const initialData = require('./initial-data');
            await keystone.createItems(initialData);
        }
    },
});

registerLists(keystone, [
    require('./schema/User'),
    require('./schema/Condominium'),
    require('./schema/Todo'),
]);

keystone.extendGraphQLSchema({
    types: [{ type: 'type FooBar { foo: Int, bar: Float }' }],
    queries: [
        {
            schema: 'getUserByName(name: String!): Boolean',
            resolver: async (item, context, info) => 'hohoho',
            access: true,
        },
    ],
    mutations: [
        {
            schema: 'double(x: Int): Int',
            resolver: (_, { x }) => 2 * x,
            access: ({ authentication: { item, listKey } }) => {
                return true;
            },
        },
    ],
});

const authStrategy = keystone.createAuthStrategy({
    type: PasswordAuthStrategy,
    list: 'User',
});

module.exports = {
    distDir: conf.DIST_DIR,
    keystone,
    apps: [
        new GraphQLApp(),
        new StaticApp({ path: conf.MEDIA_URL, src: conf.MEDIA_ROOT }),
        new AdminUIApp({
            adminPath: '/admin',
            hooks: require.resolve('./admin-ui/'),
            enableDefaultRoute: true,
            isAccessAllowed: access.userIsAdmin,
            authStrategy,
        }),
    ],
};
