This directory contains domain **models**. 

We use Domain Driven Design to distribute the models into the folders.

Domain-driven design (DDD) is the practice of managing complexity of software applications 
by relating their underlying data models to domain logic. That’s a mouthful, 
so let’s break it down further.

Domain-driven design is specifically for handling the complexity of growing sites 
as they add more and more models. It doesn’t really make sense for a site with one model.

Each **model** have **own file** with the same name as the model. 
All model files are located inside the domain directory.
Each **domain** have **own folder**.

In addition, the same domain structure have:
 - `./access` -- each domain have own file (server)
 - `./constants` -- each domain have own file (client/server)
 - `./components` -- each domain have own folder (client)
 - `./gql` -- each domain have own file (client/server)
 - `./types` -- each domain have own folder (client/server)
 - `./utils/clientSchema` -- each domain have own folder (client)
 - `./utils/serverSchema` -- each domain have own file or if its complex a folder (server)
 - `./utils/testSchema` -- each domain have own file (server schema tests)
