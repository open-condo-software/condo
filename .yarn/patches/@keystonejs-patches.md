# `@keystonejs/*` patches

## 1. `graphql-upload` bump
> Affected submodules: `@keystonejs/keystone`, `@keystonejs/app-graphql`  
> Date: 08.09.2023

```
Patch 1: @keystonejs-app-graphql-npm-6.3.2-26fe50b988.patch
Patch 2: @keystonejs-keystone-npm-19.3.4-2a53e53061.patch
Library PR: https://github.com/keystonejs/keystone-5/pull/415
Patch PR: https://github.com/open-condo-software/condo/pull/3815
```

### Problem:

This patch fixes a bug, when keystone crashes while processing multipart requests. It seems that the issue might be related to the old versions of the dicer and busboy packages.

Bug looks awfully similar to this security flaw: [GHSA-wm7h-9275-46v2](https://github.com/advisories/GHSA-wm7h-9275-46v2) and has already been [fixed](https://github.com/jaydenseric/graphql-upload/releases/tag/v15.0.0) in the apollo-graphql v15.0.0 release.

### Solution:

#### Implementation details

Patch is done using internal yarn functionality. Patch is applied when user runs `yarn` https://yarnpkg.com/cli/patch

1. Fix `graphql-upload` version in root `package.json` from `11.*.*` to `15.0.2`
   - Note: all projects (including `@keystone` use `graphql-upload@15.0.2`)
   - `15.0.2` has breaking changes realted to import/export. Patches should be made   
2. Create patches that implement support for `graphql-upload@15.*.*` in @keystonejs:
   1. Fix imports in `@keystonejs/app-graphql`
   2. Fix imports in `@keystonejs/keystone`
3. Fix `@keystonejs/keystone` and  `@keystonejs/app-graphql` versions to the patched version
   - Note: all projects (including submodules) that depend on keystone will use provided versions

### Caveats:
- KS version is fixed at 19.3.4
- GQL-upload is fixed at 15.0.2

---

## 2. Query args in access functions
> Affected submodules: `@keystonejs/keystone`, `@keystonejs/access-control`  
> Date: 28.02.2024

```
Patch 1: @keystonejs-keystone-npm-19.3.4-2a53e53061.patch
Patch 2: @keystonejs-access-control-npm-7.1.2-bec144d41a.patch
Library issue: https://github.com/keystonejs/keystone-5/issues/419
Patch PR: https://github.com/open-condo-software/condo/pull/3815
```

### Problem
Unlike custom queries / mutations, the access functions for standard read queries 
do not contain query arguments (where, first, etc.). 
This does not allow to implement flexible setting of filtering permissions 
(e.g., prohibit filtering by a certain field for all non-administrator users). 
This patch allows you to do it.

### Solution 
Pass down args, obtained by keystone, to access function


### Caveats:
- `@keystonejs/keystone` version is (still) fixed at 19.3.4
- `@keystonejs/access-control` version is fixed at 7.1.2