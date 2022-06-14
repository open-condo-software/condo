How to add new domain schemas
=====

Command: `yarn workspace @app/condo createschema <domain>.<ModelName> "<field>: <type>; ..."`

Examples:

```shell
yarn workspace @app/condo createschema user.User "name:Text; password?:Password; isAdmin?:Checkbox; email?:Text; isEmailVerified?:Checkbox; phone?:Text; isPhoneVerified?:Checkbox; avatar?:File; meta:Json; importId:Text;"
yarn workspace @app/condo createschema ticket.Ticket "organization:Relationship:Organization:PROTECT; statusReopenedCounter:Integer; statusReason?:Text; status:Relationship:TicketStatus:PROTECT; number?:Integer; client?:Relationship:User:SET_NULL; clientName:Text; clientEmail:Text; clientPhone:Text; operator:Relationship:User:SET_NULL; assignee?:Relationship:User:SET_NULL; details:Text; meta?:Json;
yarn workspace @app/condo createschema billing.BillingIntegrationLog 'context:Relationship:BillingIntegrationOrganizationContext:CASCADE; type:Text; message:Text; meta:Json'
```

Fields:

- you can use `?` at the end of the field name if field is optional
- simple types:
    - `name:Text;`, `password?:Password;`,
    - `number?:Integer;`, `toPay:Decimal;`,
    - `image:File;`,
    - `date:DateTimeUtc;`, `date:CalendarDay;`,
    - `meta?:Json`,
    - `isAdmin:Checkbox`,
    - `type:Select:new_or_created,processing,completed,closed`
- relations `<field>:Relationship:<ref-model>:<on-delete-action>`:
    - `user:Relationship:User:PROTECT;` -- `PROTECT`: Forbid the deletion of the referenced object. To delete it you will have to delete all objects that reference it manually. SQL equivalent: `RESTRICT`.
    - `organization:Relationship:Organization:PROTECT;` -- PROTECT example ^^
    - `client?:Relationship:User:SET_NULL;` -- `SET_NULL`: Set the reference to NULL (requires the field to be nullable). For instance, when you delete a User, you might want to keep the comments he posted on blog posts, but say it was posted by an anonymous (or deleted) user. SQL equivalent: SET NULL.
    - `operator:Relationship:User:SET_NULL;` -- SET_NULL example ^^
    - `user:Relationship:User:CASCADE;` -- `CASCADE`: When the referenced object is deleted, also delete the objects that have references to it (when you remove a blog post for instance, you might want to delete comments as well). SQL equivalent: CASCADE.
    - `property:Relationship:Property:CASCADE;` -- CASCADE ^^