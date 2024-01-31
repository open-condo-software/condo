### What is this for?

We want to provide the miniapp with access to objects of organizations that have connected this miniapp.
___

### How it works?

In schemes that are somehow connected with the organization scheme, we add a additional access for server users.

#### What is it checking?

1) Request on behalf of service user
2) The organization is connected to B2BApp A (have B2BAppContext)
3) Service user connected to B2BApp A (have B2BAppAccessRight)
4) B2BAppAccessRightSet connected to B2BAppAccessRight
5) In the scheme B2BAppAccessRightSet for the B2BApp A the necessary rights were issued to execute the request
___

### How setup new schema

Read in [config file](config.js)