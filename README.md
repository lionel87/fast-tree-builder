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
- **Fully Typed** – Carefully written TypeScript types for the built tree.
- **Highly Customizable** – Design the node structure as you like.
- **Any Iterable Accepted** – Works on arrays, sets, or any iterable type.
- **Flexible ID Types** – Anything can be an identifier; relations matched with `childId === parentId`.
- **Efficient Tree Construction** – Builds trees from unordered data in O(n) time.
- **Bi-Directional Tree Links** – Nodes can store both `children` and `parent` references.
- **Multi-Root Support** – Handles disjoint trees naturally.
- **Arbitary Node Access** – Returns a `Map` that allows constant-time access to any node.
- **Tree Validation** – Detects cycles or nodes reachable through multiple paths.
- **Reference Validation** – Optionally enforce that all parent/child links are valid.
- **Depth Values** – Optionally include a depth value in each node.

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

##### One of

- `parentId`: A key or a function that returns the parent ID of the item.
- `childIds`: A key or a function that returns an iterable of child IDs for the item.

##### Optional

- `valueResolver`: Function to transform an item to a custom value stored in the node. Defaults to use the input item as is.
- `valueKey`: Key where the item is stored in the output node. Set to `false` to merge the item's properties directly into the node (shallow copy). Defaults to `'value'`.
- `parentKey`: Key where the node's parent reference is stored in the output node. Set to `false` to omit parent links. Defaults to `'parent'`.
- `childrenKey`: Key where the node's children are stored in the output node. Defaults to `'children'`.
- `depthKey`: Key where the node's depth (with root = 0) is stored in the output node. Set to `false` to omit depth values. Setting this enables validateTree implicitly, as depth calculation requires full tree validation. Defaults to `false`.
- `includeEmptyChildrenArray`: Leaf nodes will include an empty children array when this is set to `true`. Otherwise they are left as `undefined`. Defaults to `false`.
- `validateReferences`: When `true`, verifies all `parentId` or `childIds` resolve to real items. Only `null` and `undefined` are acceptable parent ids for root nodes when enabled. Errors are thrown on invalid references. Defaults to `false`.
- `validateTree`: When `true`, verifies that the final structure is a valid tree (no cycles or nodes reachable via multiple paths). Errors are thrown if the check fails. Defaults to `false`.

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
- Cycle or structural error (if `validateTree` is enabled or `depthKey` is string)

### Good to know

> **Input Accessors vs. Output Keys in Options**
>
> * `id`, `parentId`, `childIds` works on the input item and can be property names or functions.
> * `valueKey`, `parentKey`, `childrenKey`, `depthKey` are always strings or `false` and are used as keys in the output nodes.
>
> I considered prefixing these two groups with `input` and `output` to distinguish them, but in the end, this note in the README felt good enough.


> **Identifiers**
>
> The library makes no assumptions about ID values — any unique JavaScript value is accepted, including `null` and `undefined`.


> **Child Node Ordering**
>
> This library preserves the order of items when building tree structures, depending on how the tree is constructed:
>
> When using parent IDs to connect items, the order of child nodes will match the order in which the items appeared in the original input array.
>
> When using child IDs to connect items, the order of child nodes will match the order of the child IDs defined in the input item.


> **'validateReferences' option**
>
> Validation operates differently when in `parentId` mode and in `childIds` mode!
> * in `parentId` mode: validates that the parent IDs of root nodes was `null` or `undefined` and nothing else. If you expect these parent IDs to be other than `null` or `undefined`, you can safely turn off this validation and loop trough on the roots manually to check the original parentId values are the ones you expect.
> * in `childIds` mode: validates that every referenced child is resolved. Even if the child list contains `undefined`, a node with an `undefined` as ID must exist in the input.


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
  valueKey: 'value',
  parentKey: 'parent',
  childrenKey: 'children',
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
  valueResolver: item => ({ title: item.name }),
  valueKey: false, // merge item data into node
  parentKey: 'up',
  childrenKey: 'down',
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
  parentId: item => item.substring(0, 2),
  valueResolver: item => ({ name: item.substring(4) }),
  valueKey: false, // merge item data into node
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

    If the above doesn't work for your case, define your tree node type from scratch.

    We intentionally don’t expose a generic `TreeNode` type in the package, as maintaining a complex set of generic parameters is often more cumbersome than writing a custom recursive type yourself.

2. How can I present the `children` list in a specific order?

    Pre-sort your input items:

    ```typescript
    const items = [
      { id: 0, name: 'X', order: 0 },
      { id: 1, name: 'A', order: 3, parent: 0 },
      { id: 2, name: 'B', order: 2, parent: 0 },
      { id: 3, name: 'C', order: 1, parent: 0 },
    ];

    // sort input by your `order` value
    items.sort((a, b) => a.order - b.order);

    const { roots } = buildTree(items, {
      id: 'id',
      parentId: 'parent',
    });

    roots[0].children
    // this will be sorted as 'C', 'B', 'A'
    // according to their order values.
    ```

## Comparison with other tree building libraries

The package is designed to be feature-complete and highly customizable, which often comes at the cost of performance. Some libraries may be more *performant*, but they lack features I regularly need. In typical use cases, this package performs well, and others are usually only faster when offering much less customization.

For scenarios where performance is critical and you start benchmarking libraries, consider implementing your custom algorithm instead. It could be as simple as:
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
