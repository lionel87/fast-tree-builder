# fast-tree-builder

[![Build Status](https://github.com/lionel87/fast-tree-builder/actions/workflows/coveralls.yaml/badge.svg)](https://github.com/lionel87/fast-tree-builder/actions/workflows/coveralls.yaml)
[![Coverage Status](https://coveralls.io/repos/github/lionel87/fast-tree-builder/badge.svg?branch=master)](https://coveralls.io/github/lionel87/fast-tree-builder?branch=master)
![npms.io (quality)](https://img.shields.io/npms-io/quality-score/fast-tree-builder?label=quality)
![Maintenance](https://img.shields.io/maintenance/yes/2023)

`fast-tree-builder` is an npm package that allows you to efficiently build trees from iterable data structures. With its optimized algorithm, strong TypeScript typings, and customizable node structure, it provides a reliable solution for organizing and manipulating hierarchical data.

## Prerequisites

- You have a list of items,
- where each item is identifiable by a unique value,
- and the items are connected via a parent relation.

## Features

- **Efficient Tree Building**: The package utilizes an optimized algorithm to construct trees efficiently in `O(n)` time, ensuring good performance even with large datasets.

- **Bi-Directional Tree Traversal**: Traverse the built tree in both directions, enabling easy navigation between parent and child nodes.

- **Strong TypeScript Typings**: Enjoy the benefits of type safety with comprehensive TypeScript typings. The package provides detailed type definitions to enhance your development experience.

- **Fully Customizable Node Structure**: Tailor the structure of the nodes in the built tree to meet your specific requirements. You have the freedom to define data, parent, and children key names according to your application's needs. To avoid circular references parent links can be turned off which helps generating JSON data.

- **Works on Any Iterable Data Structure**: Whether you have an array, set, or any other iterable data structure, `fast-tree-builder` can process it seamlessly, making it compatible with a wide range of use cases.

- **No Sorting Required**: The package does not require your input data to be sorted, saving you preprocessing time and effort.

- **Flexible Key and Parent Key Types**: You can use any JavaScript value for identifying items. Relations checked with `key === parentKey` comparison.

- **Map of Nodes**: Beside the root nodes you can retrieve a `Map` object containing the nodes of the built tree, enabling easy entry on any point of the tree.

- **Support for Multiple Root Nodes**: The package supports building trees with multiple root nodes.

- **Support for Parent Key Validation**: Enables you to validate parent keys while building the tree. When a node missing its parent, an error will be thrown.

- **Support for Tree Validation**: Ensures the recieved data structure is an acyclic graph.

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
  nodeDataKey: false, // merge item data into node
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


### Example 3: Crazy ideas

```typescript
import buildTree from 'fast-tree-builder';

const items = [
  '0001Root 1',
  '0002Root 2',
  '0103Child 1.1',
  '0104Child 1.2',
  '0205Child 2.1',
];

const { roots, nodes } = buildTree(items, {
  key(item) { return item.substring(2, 4); },
  parentKey(item) { return item.substring(0, 2); },
  mapNodeData(item) { return { name: item.substring(4) }; },
  nodeDataKey: false, // merge item data into node
});

console.log(roots[0].name);
// Expected output: Root 1

console.log(roots[0].children[1].name);
// Expected output: Child 1.2

console.log(roots);
// Expected output: [
//   { name: 'Root 1', children: [
//     { name: 'Child 1.1', parent: { ... } },
//     { name: 'Child 1.2', parent: { ... } }
//   ] },
//   { name: 'Root 2', children: [
//     { name: 'Child 2.1', parent: { ... } }
//   ] }
// ]
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
  - `validateTree`: (Optional) A boolean flag that determines whether to validate the resulting data structure. If the structure is a cyclic graph, an `Error` will be thrown. Requires additional `O(n)` time to compute. Defaults to `false`.

Returns

An object with the following properties:

- `roots`: An array of the root nodes of the built tree.
- `nodes`: A `Map` object containing all nodes of the built tree, with keys corresponding to their identifiers.

Throws `Error` when:

- A duplicate identifier is recieved,
- or `validateParentKeys` is set and an invalid parent key is recieved,
- or `validateTree` is set to `true` and a cyclic graph is the result.

## Comparison with other tree building libraries

The package aims to be feature complete and highly customizable, which usually opposes with performance. There are other packages that may be more `performant` but lacks features that I really needed in my daily coding. In standard scenarios this package should be more than enough.

I can imagine extreme cases with huge trees where this package can be slower, but you should write your own tree building implementation optimized for that exact case anyway.

Hey, its not more than:
```js
const roots = [];
const nodes = new Map();
for (const item of items) {
  let node = nodes.get(item.id);
  if (!node) {
    node = {};
    nodes.set(item.id, node);
  }
  node.data = item; // Or Object.assign(node, item);
  if (item.parentId) {
    let parent = nodes.get(item.parentId);
    if (!parent) {
      parent = {};
      nodes.set(item.parentId, parent);
    }
    if (!parent.children) parent.children = [];
    parent.children.push(node);
    node.parent = parent;
  } else {
    roots.push(node);
  }
}
```

## Contributions

Contributions to `fast-tree-builder` are welcome! If you have any bug reports, feature requests, or improvements, please open an issue on the [GitHub repository](https://github.com/lionel87/fast-tree-builder).

## License

`fast-tree-builder` is licensed under the [MIT License](https://github.com/lionel87/fast-tree-builder/blob/master/LICENSE).
