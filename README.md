![Hackathon workflow](https://image.shutterstock.com/image-vector/banner-hackathon-design-sprintlike-event-260nw-1418226719.jpg)

# Rapid Development Node.js Hackathon template 

This template based on [KeystoneJS](https://github.com/keystonejs/keystone) and [Next.js](https://github.com/vercel/next.js).

We also use [Expo](https://github.com/expo/expo) for React based mobile app development.
[Ant Design](https://github.com/ant-design/ant-design) as React Web UI kit and [UI Kitten](https://github.com/akveo/react-native-ui-kitten) as React Native UI kit 

KeystoneJS is just a glue between [Express](https://github.com/expressjs/express), 
[ApolloGraphql](https://github.com/apollographql/), Mongoose/Knex/Prisma (as ORM).

Next.js is just a zero config React based framework.

### Contents

* [Motivation & Features](#why)
* [Getting started](docs/getting-started.md)
* [Deploy](docs/deploy.md)
* [Contibuting](docs/contributing.md)

## Why?

Javascript ecosystem is full of tutorials, open-source and helpful materials,
but still, it's often **up to the developer** to implement such **basic** features like:
* Authentication workflow (register-login-reset)
* Permission mechanism
* Import/Export
* Logic reusability between web and mobile
* And more

This project provides you with these basic features, allowing you to focus on core business logic 

Our primary focus is startup developers and hackaton teams

## Features

**VERSION**: 0.0.1 **𝛼**

* Based on Appolo, KeystoneJS and NextJS
* Authentication workflow
  * Registration
  * Authentication and Authorization
  * Change password
  * Reset password
* Organization entity
  * Managment of organization members
  * Invite users by email
  * Add users from excel table
* With frontend — fronend templates based on Ant design
* A lot of examples — check /apps
* Pluggable — use only what you need
* Deployable — check [deploy.md](docs/deploy.md)

Full list of features and requested features is found under [contibuting.md](docs/contributing.md) and issues

## Getting started

Check [getting-started.md](docs/getting-started.md)

## Deploying

Check [deploy.md](docs/deploy.md)

## Contibuting

Check [contibuting.md](docs/contributing.md)
