import React, { createContext, useContext, useState } from 'react';
import { useQuery, useMutation, useApolloClient } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import App from "next/app";

/**
 * AuthContext
 * -----------
 * This is the base react context instance. It should not be used
 * directly but is exported here to simplify testing.
 */
export const AuthContext = createContext({
  isAuthenticated: false,
  isLoading: true,
  signin: () => {throw new Error('no Auth.signin')},
  signout: () => {throw new Error('no Auth.signin')},
  user: {},
});

/**
 * useAuth
 * -------
 * A hook which provides access to the AuthContext
 */
export const useAuth = () => useContext(AuthContext);

const userFragment = `
  id
  name
  isAdmin
`;

const USER_QUERY = gql`
  query {
    authenticatedUser {
      ${userFragment}
    }
  }
`;

const SIGNIN_MUTATION = gql`
  mutation signin($email: String, $password: String) {
    authenticateUserWithPassword(email: $email, password: $password) {
      item {
        ${userFragment}
      }
    }
  }
`;

const SIGNOUT_MUTATION = gql`
  mutation {
    unauthenticateUser {
      success
    }
  }
`;

/**
 * AuthProvider
 * ------------
 * AuthProvider is a component which keeps track of the user's
 * authenticated state and provides methods for managing the auth state.
 */
const AuthProvider = ({ children, initialUserValue }) => {
  const [user, setUser] = useState(initialUserValue);
  const client = useApolloClient();

  const { loading: userLoading } = useQuery(USER_QUERY, {
    fetchPolicy: 'no-cache',
    onCompleted: ({ authenticatedUser, error }) => {
      if (error) {
        throw error;
      }

      setUser(authenticatedUser);
    },
    onError: console.error,
  });

  const [signin, { loading: signinLoading }] = useMutation(SIGNIN_MUTATION, {
    onCompleted: async ({ authenticateUserWithPassword: { item } = {}, error }) => {
      if (error) {
        throw error;
      }

      // Ensure there's no old unauthenticated data hanging around
      await client.resetStore();

      if (item) {
        setUser(item);
      }
    },
    onError: console.error,
  });

  const [signout, { loading: signoutLoading }] = useMutation(SIGNOUT_MUTATION, {
    onCompleted: async ({ unauthenticateUser: { success } = {}, error }) => {
      if (error) {
        throw error;
      }

      // Ensure there's no old authenticated data hanging around
      await client.resetStore();

      if (success) {
        setUser(null);
      }
    },
    onError: console.error,
  });

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading: userLoading || signinLoading || signoutLoading,
        signin,
        signout,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const withAuth = ({ ssr = false } = {}) => PageComponent => {
  const WithAuth = ({user, ...pageProps}) => {
    return (
        <AuthProvider initialUserValue={user}>
          <PageComponent {...pageProps} />
        </AuthProvider>
    )
  };

  // Set the correct displayName in development
  if (process.env.NODE_ENV !== 'production') {
    const displayName = PageComponent.displayName || PageComponent.name || 'Component';
    WithAuth.displayName = `withAuth(${displayName})`
  }

  if (ssr || PageComponent.getInitialProps) {
    WithAuth.getInitialProps = async ctx => {
      const isOnServerSide = typeof window === 'undefined';
      const inAppContext = Boolean(ctx.ctx);

      if (ctx.router.route === '/_error') {
        // prevent infinity loop: https://github.com/zeit/next.js/issues/6973
        console.dir(ctx.router);
        if (inAppContext && ctx.ctx.err) {
          throw ctx.ctx.err
        } else {
          throw new Error(`${WithAuth.displayName}: catch error!`)
        }
      }

      // Run wrapped getInitialProps methods
      let pageProps = {}
      if (PageComponent.getInitialProps) {
        pageProps = await PageComponent.getInitialProps(ctx)
      } else if (inAppContext) {
        pageProps = await App.getInitialProps(ctx)
      }

      let user;
      if (isOnServerSide) {
        try {
          const data = await ctx.apolloClient.query({
            query: gql`
              query {
                authenticatedUser {
                  id
                  name
                  isAdmin
                }
              }
            `,
            fetchPolicy: 'network-only',
          });
          user = data.data ? data.data.authenticatedUser : undefined;
        } catch (error) {
          // Prevent Apollo Client GraphQL errors from crashing SSR.
          // Handle them in components via the data.error prop:
          // https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-data-error
          console.error('Error while running `withAuth`', error)
        }
      }

      return {
        ...pageProps,
        user,
      }
    }
  }

  return WithAuth
};
