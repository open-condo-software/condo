This directory contains **domain**-separated logic. Each domain has own folder. 

We use Domain Driven Design to distribute logic into the domain folders.

Domain-driven design (DDD) is the practice of managing complexity of software applications 
by relating their underlying data models to domain logic. That’s a mouthful, 
so let’s break it down further.

Domain-driven design is specifically for handling the complexity of growing sites 
as they add more and more models. It doesn’t really make sense for 
a site with one domain model.

The same domain structure have:
 - `./<domain>/access` -- each domain have own file (server)
 - `./<domain>/constants` -- each domain have own file (client/server)
 - `./<domain>/components` -- each domain have own folder (client)
 - `./<domain>/gql` -- each domain have own file (client/server)
 - `./<domain>/utils/clientSchema` -- each domain have own folder (client)
 - `./<domain>/utils/serverSchema` -- each domain have own file or if its complex a folder (server)
 - `./<domain>/utils/testSchema` -- each domain have own file (server schema tests)
