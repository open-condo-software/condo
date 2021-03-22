This directory contains all client side GraphQL data-fetching wrappers, hooks and utilities 
for all models used on the client side. 

You should not directly call GraphQL queries inside your components. You should create a utility function and use it.
The idea for extracting a separate layer of utilities for data-fetching utilities is inspired by https://react-query.tanstack.com/overview

In addition to the logic of data-fetching the data, this layer is a single point of transformation the server data before using it in the UI.

You can read more detail about domain logic in the [domains/README](../../../README.md) file.
