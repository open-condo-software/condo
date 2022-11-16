# kmigrator


Kmigrator – is a CLI for managing database schema using migrations, that are stored in `migrations` folder. 
You can change a table and column options. For tables, you can set constraints and indexes.

## kmigrator columns options

you can set options: 
 - `null` -- to allow for this column to be nullable
 - `unique` -- create db level unique constraint for this column
 - `db_index` -- create db level index for this column
 - `on_delete` -- for foreign key on delete behaviour (see details below) 

Example:

```
const User = new GQLListSchema('User', {
    schemaDoc: 'Individual / person / service account / impersonal company account',
    fields: {
        ...
        email: {
            schemaDoc: 'Email. Transformed to lower case',
            type: Text,
            kmigratorOptions: { null: false, unique: true },
        },
        birth: {
            type: DateTimeUtc,
            kmigratorOptions: { db_index: true },
        },
        ...
    },
})
```

#### on_delete

Determines, what will happen with foreign key, when a row, it referenced to, will be deleted.

For example, for a foreign key `Ticket.assignee`, that points to `User.id` you need to specify behaviour, when a row from `User` table will be deleted. 
 
You can use options:

 - `models.PROTECT` forbids deletion of the referenced object. To delete it you will have to delete all objects that referencing it. SQL equivalent: `RESTRICT`.
 - `models.SET_NULL` sets the reference to NULL (requires the field to be nullable). For instance, when you delete a User, you might want to keep the comments he posted on blog posts, but say it was posted by an anonymous (or deleted) user. SQL equivalent: `SET NULL`.
 - `models.CASCADE` deletes the object on delete of referenced object. (when you remove a blog post for instance, you might want to delete comments as well). SQL equivalent: `CASCADE`.

## kmigrator table options

you can set options: 
 - `constraints` -- to create database level constrains
 - `indexes` -- to create database level indexes

#### constraints

Example:

```
const User = new GQLListSchema('User', {
    schemaDoc: 'Individual / person who have some access to service',
    fields: {
        type: {
            schemaDoc: 'We have b2b and b2c user segments',
            type: Select,
            dataType: 'enum',
            options: ['b2b', 'b2c', 'sys'],
            defaultValue: 'b2b',
            isRequired: true,
        },
        phone: {
            schemaDoc: 'Phone. In international E.164 format without spaces',
            type: Text,
            isRequired: true,
        },
        ...
    },
    kmigratorOptions: {
        constraints: [
            {
                type: 'models.UniqueConstraint',
                fields: ['type', 'phone'],
                name: 'unique_type_and_phone',
            },
        ],
    },
})
```

This example generate following SQL: `ALTER TABLE "User" ADD CONSTRAINT "unique_type_and_phone" UNIQUE ("type", "phone");`

Another example:
```
const User = new GQLListSchema('User', {
    schemaDoc: 'Individual / person who have some access to service',
    fields: {
        phone: {
            schemaDoc: 'Phone. In international E.164 format without spaces',
            type: Text,
            isRequired: false,
        },
        email: {
            schemaDoc: 'Email',
            type: Text,
            isRequired: false,
        },
        ...
    },
    kmigratorOptions: {
        constraints: [
            {
                type: 'models.CheckConstraint',
                check: 'Q(phone__isnull=False) | Q(email__isnull=False)',
                name: 'has_phone_or_email',
            },
        ],
    },
})
```

This example generates following SQL: `ALTER TABLE "User" ADD CONSTRAINT "has_phone_or_email" CHECK (("phone" IS NOT NULL OR "email" IS NOT NULL));`

You can also define a `condition` for `models.UniqueConstraint`:

```
{
    type: 'models.UniqueConstraint',
    fields: ['type', 'phone'],
    condition: 'Q(deletedAt__isnull=True)',
    name: 'unique_type_and_phone',
},
```

SQL result: `CREATE UNIQUE INDEX "unique_type_and_phone" ON "User" ("type", "phone") WHERE "deletedAt" IS NULL;`

You can also create an `index`:

```
indexes: [
    {
        type: 'BloomIndex',
        fields: '["phone", "email"]',
        name: 'phone_email_idx',
    },
],
```

SQL result: `CREATE INDEX "phone_email_idx" ON "User" USING bloom ("phone", "email");`

Another example:
```
{
    type: 'models.CheckConstraint',
    check: 'Q(type__in=["b2b", "b2c", "sys"])',
    name: 'b2b_b2c_or_sys_type',
},
```

SQL result: `ALTER TABLE "User" ADD CONSTRAINT "b2b_b2c_or_sys_type" CHECK ("type" IN ('b2b', 'b2c', 'sys'));`

Some examples for `Q` queries:
 - `Q(age__gte=18)` -- Ensures the age field is never less than 18, SQL: `id >= 18`
 - `Q(age__gt=18)` -- Ensures the age field is greater than 18, SQL: `id > 18`
 - `Q(age__lt=18)` -- Ensures the age field is less than 18, SQL: `id < 18`
 - `Q(startAt__lt=models.F("finishAt"))` ensures, that `startAt < finishAt`
 - `Q(id__exact=14)` -- Exact match, SQL: `id = 14`
 - `Q(id__exact=None)` -- If the value provided for comparison is None, it will be interpreted as an SQL NULL, SQL: `id IS NULL`
 - `Q(name__iexact='beatles blog')` -- Case-insensitive exact match
 - `Q(name__iexact=None) & Q(sname__iexact='beatles blog')` -- SQL: `name ILIKE 'beatles blog' AND sname IS NULL`
 - `Q(name__iexact=None) | Q(sname__iexact='beatles blog')` -- SQL: `name ILIKE 'beatles blog' OR sname IS NULL`
 - `Q(headline__contains='Lennon')` -- Case-sensitive containment test, SQL: `headline LIKE '%Lennon%'`
 - `Q(headline__icontains='Lennon')` -- Case-insensitive containment test, SQL: `headline ILIKE '%Lennon%'`
 - `Q(id__in=[1, 3, 4])` -- In a given list, SQL: `id IN (1, 3, 4)`
 - `Q(headline__in='abc')` -- In a given list, SQL: `headline IN ('a', 'b', 'c')`
 - `Q(pub_date__range=(date(2005, 1, 1), date(2005, 3, 31)))` -- Range test (inclusive), SQL: `pub_date BETWEEN '2005-01-01' and '2005-03-31'`
 - `Q(pub_time__date__gt=date(2005, 1, 1))` -- For datetime fields, casts the value as date, SQL: `pub_time >= '2005-01-01'`
 - `Q(pub_date__year=2005)` -- For date and datetime fields, an exact year match, SQL: `pub_date BETWEEN '2005-01-01' AND '2005-12-31'`
 - `Q(pub_date__time=time(14, 30))` -- For datetime fields, casts the value as time
 - `Q(title__iregex=r'^(An?|The) +')` -- Case-insensitive regular expression match, SQL: `title ~* '^(An?|The) +'`
 - `Q(phone__isnull=False)` -- SQL: `phone IS NULL`

You can look the whole list of lookups [here](https://docs.djangoproject.com/en/3.2/ref/models/querysets/#field-lookups)
