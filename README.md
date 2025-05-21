# fast-tree-builder

[![NPM version](https://img.shields.io/npm/v/fast-tree-builder.svg)](https://npmjs.org/package/fast-tree-builder)
[![NPM downloads](https://img.shields.io/npm/dm/fast-tree-builder.svg)](https://npmjs.org/package/fast-tree-builder)
[![Build Status](https://github.com/lionel87/fast-tree-builder/actions/workflows/build.yaml/badge.svg)](https://github.com/lionel87/fast-tree-builder/actions/workflows/build.yaml)
[![Coverage Status](https://coveralls.io/repos/github/lionel87/fast-tree-builder/badge.svg?branch=master)](https://coveralls.io/github/lionel87/fast-tree-builder?branch=master)
![Maintenance](https://img.shields.io/maintenance/yes/2025)

`fast-tree-builder` is a utility for easy tree building from iterable collections, enabling safe and predictable access to hierarchical data. It supports highly customizable input and output shapes.


## Prerequisites

- You have a list of items,
- each item is identifiable by a unique id,
- the items are connected via a *parent id* OR *child ids*.


## Features

- **Supports `parentId` and `childIds` Models** – Choose your relation style via options.
- **Fully Typed** – TypeScript support with correct types for the built tree.
- **Highly Customizable** – Design the node structure as you like.
- **Any Iterable Accepted** – Works on arrays, sets, or any iterable type.
- **Flexible ID Types** – Anything can be an identifier; relations matched with `childId === parentId`.
- **Efficient Tree Construction** – Builds trees from unordered data in O(n) time.
- **Bi-Directional Tree Links** – Nodes can store both `children` and `parent` references.
- **Multi-Root Support** – Handles disjoint trees naturally.
- **Arbitary Node Access** – Returns a `Map` that allows constant-time access to any node.
- **Tree Validation** – Detects cycles or nodes reachable through multiple paths.
- **Reference Validation** – Optionally enforce that all parent/child links are valid.
- **Depth Values** – Optionally includes a depth value in each node.

## Installation

```sh
npm install fast-tree-builder
```

or

```sh
yarn add fast-tree-builder
```


## Documentation

### `buildTree(items: Iterable<T>, options: Options): TreeResult`

Builds a tree structure from an iterable list of items.

#### Parameters

* `items`: Any iterable of input items.
* `options`: Configuration object:

##### Required

- `id`: A key or function used to extract the unique identifier from each item.

##### One of:

- `parentId`: A key or function that access the parent ID of the item.
- `childIds`: A key or function that access an iterable of child IDs for the item.

##### Optional

- `nodeValueMapper`: Function to map an item to a custom value stored in the node. Optional.
- `nodeValueKey`: Key where the item's data is stored in the output node. Set to `false` to inline the item directly into the node. Default: `'value'`.
- `nodeParentKey`: Key where the node's parent reference is stored. Set to `false` to omit parent links. Default: `'parent'`.
- `nodeChildrenKey`: Key where the node's children are stored. Default: `'children'`.
- `withDepth`: When `true`, adds a `depth` property to each node indicating its depth in the tree. Also implies `validateTree`. Default: `false`.
- `validateReferences`: When `true`, verifies all `parentId` or `childIds` resolve to real items. Errors are thrown on invalid references. Default: `false`.
- `validateTree`: When `true`, verifies that the final structure is a valid tree (no cycles or nodes reachable via multipla paths). Errors are thrown if the check fails. Default: `false`.

#### Returns

```ts
{
  roots: TreeNode[],         // top-level nodes
  nodes: Map<id, TreeNode>   // all nodes by id
}
```

#### Throws

- Missing required `id`, `parentId`/`childIds`, or `options` parameter
- Duplicate item identifiers in input
- Invalid reference (if `validateReferences` is enabled)
- Cycle or structural error (if `validateTree` or `withDepth` is enabled)


## Usage

Here are some examples showcasing the usage of `fast-tree-builder` and their expected outputs:

### Example 1: Basic Tree Building

```typescript
import buildTree from 'fast-tree-builder';
// OR
const { default: buildTree } = require('fast-tree-builder');

const items = [
  { id: 1, parent: null, name: 'Root 1' },
  { id: 2, parent: null, name: 'Root 2' },
  { id: 3, parent: 1, name: 'Child 1.1' },
  { id: 4, parent: 1, name: 'Child 1.2' },
  { id: 5, parent: 2, name: 'Child 2.1' },
];

const { roots, nodes } = buildTree(items, {
  // the input items:
  id: 'id',
  parentId: 'parent',
  // the built node:
  nodeValueKey: 'value',
  nodeParentKey: 'parent',
  nodeChildrenKey: 'children',
});

console.log(roots[0].value.name);
// Expected output: Root 1

console.log(roots[0].children[1].value.name);
// Expected output: Child 1.2

console.log(roots[0].children[1].parent.value.name);
// Expected output: Root 1

console.log(roots);
// Expected output: [
//   { value: { id: 1, parent: null, name: 'Root 1' }, children: [
//     { value: { id: 3, parent: 1, name: 'Child 1.1' }, parent: { ... } },
//     { value: { id: 4, parent: 1, name: 'Child 1.2' }, parent: { ... } }
//   ] },
//   { value: { id: 2, parent: null, name: 'Root 2' }, children: [
//     { value: { id: 5, parent: 2, name: 'Child 2.1' }, parent: { ... } }
//   ] }
// ]

console.log(nodes);
// Expected output: Map {
//   1 => { value: { id: 1, parent: null, name: 'Root 1' }, children: [
//     { value: { id: 3, parent: 1, name: 'Child 1.1' }, parent: { ... } },
//     { value: { id: 4, parent: 1, name: 'Child 1.2' }, parent: { ... } }
//   ] },
//   2 => { value: { id: 2, parent: null, name: 'Root 2' }, children: [
//     { value: { id: 5, parent: 2, name: 'Child 2.1' }, parent: { ... } }
//   ] },
//   3 => { value: { id: 3, parent: 1, name: 'Child 1.1' }, parent: { ... } },
//   4 => { value: { id: 4, parent: 1, name: 'Child 1.2' }, parent: { ... } },
//   5 => { value: { id: 5, parent: 2, name: 'Child 2.1' }, parent: { ... } }
// }
```


### Example 2: Build tree by children

```typescript
import buildTree from 'fast-tree-builder';

const items = [
  { id: 1, children: [3, 4], name: 'Root 1' },
  { id: 2, children: [5], name: 'Root 2' },
  { id: 3, name: 'Child 1.1' },
  { id: 4, name: 'Child 1.2' },
  { id: 5, name: 'Child 2.1' },
];

const { roots, nodes } = buildTree(items, {
  id: 'id',
  childIds: 'children',
});
```

> Produces the same output as **Example 1**.

### Example 3: Customized Node Structure

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
  id: item => item.key?.n,
  parentId: item => item.parentKey?.n,
  nodeValueMapper: item => ({ title: item.name }),
  nodeValueKey: false, // merge item data into node
  nodeParentKey: 'up',
  nodeChildrenKey: 'down',
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


### Example 4: Crazy ideas

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
  id: item => item.substring(2, 4),
  parentKey: item => item.substring(0, 2),
  nodeValueMapper: item => ({ name: item.substring(4) }),
  nodeValueKey: false, // merge item data into node
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


## FAQ

1. How can I get the exact type of the built tree nodes easily?
    ```typescript
    const { roots } = buildTree(items, { ... });
    type TreeNode = typeof roots[number];
    ```

## Comparison with other tree building libraries

The package aims to be feature complete and highly customizable, which usually opposes with performance. There are other packages that may be more *performant* but lacks features that I really needed in my daily coding. In standard scenarios this package should perform more than enough and nearly as good as any other package.

For scenarios where performance is critical and you start to benchmark tree building libraries, consider  implementing your custom algorithm instead. It could be as simple as:
```js
const roots = [];
const nodes = new Map();
for (const item of items) {
  let node = nodes.get(item.id);
  if (!node) {
    node = {};
    nodes.set(item.id, node);
  }
  node.value = item; // Or Object.assign(node, item);
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
