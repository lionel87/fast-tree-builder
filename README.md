# fast-tree-builder

[![Build Status](https://github.com/lionel87/fast-tree-builder/actions/workflows/coveralls.yaml/badge.svg)](https://github.com/lionel87/fast-tree-builder/actions/workflows/coveralls.yaml)
[![Coverage Status](https://coveralls.io/repos/github/lionel87/fast-tree-builder/badge.svg?branch=master)](https://coveralls.io/github/lionel87/fast-tree-builder?branch=master)
![npms.io (quality)](https://img.shields.io/npms-io/quality-score/fast-tree-builder?label=quality)
![Maintenance](https://img.shields.io/maintenance/yes/2023)

`fast-tree-builder` is an npm package that allows you to efficiently build trees from iterable data structures. With its optimized algorithm, strong TypeScript typings, and customizable node structure, it provides a reliable solution for organizing and manipulating hierarchical data.

## Prerequisites

- You have an iterable data type,
- where each item is identifiable by any valid JavaScript type,
- and the tree is connected via a parent identifier.

## Features

- **Efficient Tree Building**: The package utilizes an optimized algorithm to construct trees efficiently, ensuring quick performance even with large datasets.

- **Bi-Directional Tree Traversal**: Traverse the built tree in both directions, enabling easy navigation between parent and child nodes.

- **Strong TypeScript Typings**: Enjoy the benefits of type safety with comprehensive TypeScript typings. The package provides detailed type definitions to enhance your development experience.

- **Fully Customizable Node Structure**: Tailor the structure of the nodes in the built tree to meet your specific requirements. You have the freedom to define data, parent, and children key names according to your application's needs. To avoid circular references parent links can be turned off which helps generating JSON data.

- **Works on Any Iterable Data Structure**: Whether you have an array, set, or any other iterable data structure, `fast-tree-builder` can process it seamlessly, making it compatible with a wide range of use cases.

- **No Sorting Required**: The package does not require your input data to be sorted, saving you preprocessing time and effort.

- **Flexible Key and Parent Key Types**: You can use any JavaScript type as keys. Items are matched by comparing `key === parentKey`.

- **Map of Nodes**: Beside the root nodes you can retrieve a `Map` object containing the nodes of the built tree, enabling easy entry on any point of the tree.

- **Support for Multiple Root Nodes**: The package supports building trees with multiple root nodes.

- **Support for Parent Key Validation**: Enables you to validate parent keys while building the tree. When a node missing its parent, an error will be thrown.

- **Support for Tree Validation**: Ensures the recieved datastructure is an acyclic tree.

## Installation

To install `fast-tree-builder`, use npm:

```sh
npm install fast-tree-builder
```

or

```sh
yarn add fast-tree-builder
```


## Usage

Here are some examples showcasing the usage of `fast-tree-builder` and their expected outputs:

### Example 1: Basic Tree Building

```typescript
import buildTree from 'fast-tree-builder';

const items = [
  { id: 1, parent: null, name: 'Root 1' },
  { id: 2, parent: null, name: 'Root 2' },
  { id: 3, parent: 1, name: 'Child 1.1' },
  { id: 4, parent: 1, name: 'Child 1.2' },
  { id: 5, parent: 2, name: 'Child 2.1' },
];

const { roots, nodes } = buildTree(items, {
  key: 'id',
  parentKey: 'parent',
  nodeDataKey: 'data',
  nodeParentKey: 'parent',
  nodeChildrenKey: 'children',
});

console.log(roots[0].data.name);
// Expected output: Root 1

console.log(roots[0].children[1].data.name);
// Expected output: Child 1.2

console.log(roots[0].children[1].parent.data.name);
// Expected output: Root 1

console.log(roots);
// Expected output: [
//   { data: { id: 1, parent: null, name: 'Root 1' }, children: [
//     { data: { id: 3, parent: 1, name: 'Child 1.1' }, parent: { ... } },
//     { data: { id: 4, parent: 1, name: 'Child 1.2' }, parent: { ... } }
//   ] },
//   { data: { id: 2, parent: null, name: 'Root 2' }, children: [
//     { data: { id: 5, parent: 2, name: 'Child 2.1' }, parent: { ... } }
//   ] }
// ]

console.log(nodes);
// Expected output: Map {
//   1 => { data: { id: 1, parent: null, name: 'Root 1' }, children: [
//     { data: { id: 3, parent: 1, name: 'Child 1.1' }, parent: { ... } },
//     { data: { id: 4, parent: 1, name: 'Child 1.2' }, parent: { ... } }
//   ] },
//   2 => { data: { id: 2, parent: null, name: 'Root 2' }, children: [
//     { data: { id: 5, parent: 2, name: 'Child 2.1' }, parent: { ... } }
//   ] },
//   3 => { data: { id: 3, parent: 1, name: 'Child 1.1' }, parent: { ... } },
//   4 => { data: { id: 4, parent: 1, name: 'Child 1.2' }, parent: { ... } },
//   5 => { data: { id: 5, parent: 2, name: 'Child 2.1' }, parent: { ... } }
// }
```


### Example 2: Customized Node Structure

```typescript
import buildTree from 'fast-tree-builder';

const items = [
  { key: { n: 1 }, parentKey: null, name: 'Root 1' },
  { key: { n: 2 }, parentKey: null, name: 'Root 2' },
  { key: { n: 3 }, parentKey: { n: 1 }, name: 'Child 1.1' },
  { key: { n: 4 }, parentKey: { n: 1 }, name: 'Child 1.2' },
  { key: { n: 5 }, parentKey: { n: 2 }, name: 'Child 2.1' },
];

const { roots, nodes } = buildTree(items, {
  key(item) { return item.key?.n; },
  parentKey(item) { return item.parentKey?.n; },
  nodeDataKey: false, // don't store data separately on the node
  nodeParentKey: 'up',
  nodeChildrenKey: 'down',
  mapNodeData(item) { return { title: item.name }; },
});

console.log(roots[0].title);
// Expected output: Root 1

console.log(roots[0].down[1].title);
// Expected output: Child 1.2

console.log(roots[0].down[1].up.title);
// Expected output: Root 1

console.log(roots);
// Expected output: [
//   { title: 'Root 1', down: [
//     { title: 'Child 1.1', up: { ... } },
//     { title: 'Child 1.2', up: { ... } }
//   ] },
//   { title: 'Root 2', down: [
//     { title: 'Child 2.1', up: { ... } }
//   ] }
// ]

console.log(nodes);
// Expected output: Map {
//   1 => { title: 'Root 1', down: [
//     { title: 'Child 1.1', up: { ... } },
//     { title: 'Child 1.2', up: { ... } }
//   ] },
//   2 => { title: 'Root 2', down: [
//     { title: 'Child 2.1', up: { ... } }
//   ] },
//   3 => { title: 'Child 1.1', up: { ... } },
//   4 => { title: 'Child 1.2', up: { ... } },
//   5 => { title: 'Child 2.1', up: { ... } }
// }
```


## Documentation

### `buildTree(items: Iterable<T>, options: BuildTreeOptions): TreeResult<T>`

Builds a tree from the given iterable `items` using the specified `options`.

Parameters

- `items`: An iterable data structure containing the items to build the tree from.
- `options`: An object specifying the build options. It has the following properties:
	- `key`: (Optional) The key used to identify items. It can be a string, number, symbol, or a function that extracts the key from an item. Defaults to `'id'`.
	- `parentKey`: (Optional) The key used to identify the parent of each item. It can be a string, number, symbol, or a function that extracts the parent key from an item. Defaults to `'parent'`.
	- `nodeDataKey`: (Optional) The key used to store the item's data in each node. It can be a string, number, symbol, or false if the data should be merged directly into the node. Defaults to `'data'`.
	- `nodeParentKey`: (Optional) The key used to store the parent node in each node. It can be a string, number, symbol, or false if the parent node should not be included. Defaults to `'parent'`.
	- `nodeChildrenKey`: (Optional) The key used to store the children nodes in each node. It can be a string, number, symbol. Defaults to `'children'`.
	- `mapNodeData`: (Optional) A function that maps an item to its corresponding node data. It allows transforming the item before assigning it to the node. Defaults to `undefined`.
	- `validateParentKeys`: (Optional) An iterable containing keys that should be validated as existing parent keys. If provided, any item with a parent key not present in this iterable will cause an error to be thrown. Defaults to `undefined`.
  - `validateTree`: (Optional) A boolean indicating whether to validate the resulting datastructure. If the result is a cyclic graph an `Error` is being thrown. Defaults to `false`.
  - `validateTree`: (Optional) A boolean flag that determines whether to validate the resulting data structure. If the structure is a cyclic graph, an `Error` will be thrown. Requires additional `O(n)` time to compute. Defaults to `false`.

Returns

An object with the following properties:

- `roots`: An array of the root nodes of the built tree.
- `nodes`: A `Map` object containing all nodes of the built tree, with keys corresponding to their identifiers.

Throws `Error` When

- duplicate identifier is recieved,
- `validateParentKeys` is set and invalid parent key is recieved,
- `validateTree` is set to `true` and a cyclic graph is the result.

## Contributions

Contributions to `fast-tree-builder` are welcome! If you have any bug reports, feature requests, or improvements, please open an issue on the [GitHub repository](https://github.com/lionel87/fast-tree-builder).

## License

`fast-tree-builder` is licensed under the [MIT License](https://github.com/lionel87/fast-tree-builder/blob/master/LICENSE).
