import assert from 'assert';
import buildTree from '../index.mjs';

describe('buildTree general', () => {
	it('throws if options parameter is missing', () => {
		assert.throws(
			// @ts-expect-error intentional misuse
			() => buildTree([{ id: 1 }], undefined),
			/Missing required 'options' parameter/
		);
	});

	it('throws if id option is missing', () => {
		assert.throws(
			// @ts-expect-error intentional misuse
			() => buildTree([{ id: 1 }], { parentId: 'parent' }),
			/Option 'id' is required/
		);
	});

	it('throws if both parentId and childIds are provided', () => {
		assert.throws(
			() => buildTree([{ id: 1 }], { id: 'id', parentId: 'parent', childIds: 'children' }),
			/'parentId' and 'childIds' cannot be used together/
		);
	});

	it('throws if neither parentId nor childIds are provided', () => {
		assert.throws(
			// @ts-expect-error intentional misuse
			() => buildTree([{ id: 1 }], { id: 'id' }),
			/Either 'parentId' or 'childIds' must be provided/
		);
	});
});

describe('buildTree in parentId mode', () => {
	it('builds a basic tree', () => {
		const items = [
			{ id: 1, parent: null },
			{ id: 2, parent: 1 },
			{ id: 3, parent: 1 },
		];

		const { roots, nodes } = buildTree(items, { id: 'id', parentId: 'parent' });

		assert.strictEqual(roots.length, 1);
		assert.strictEqual(nodes.size, 3);
		assert.strictEqual(roots[0].children.length, 2);
	});

	it('throws on duplicate identifiers', () => {
		const items = [
			{ id: 1 },
			{ id: 1 },
		];

		assert.throws(
			() => buildTree(items, { id: 'id', parentId: 'parent' }),
			/duplicate identifier/i
		);
	});

	it('validates referential integrity', () => {
		const items = [{ id: 1, parent: 99 }];

		assert.throws(
			() => buildTree(items, { id: 'id', parentId: 'parent', validateReferences: true }),
			/referential integrity violation/i
		);
	});

	it('detects cycle in tree structure', () => {
		const items = [
			{ id: 1, parent: 2 },
			{ id: 2, parent: 1 },
		];

		assert.throws(
			() => buildTree(items, { id: 'id', parentId: 'parent', validateTree: true }),
			/detected a cycle/i
		);
	});

	it('detects cycle in tree structure at late check', () => {
		const items = [
			{ id: 0 },
			{ id: 1, parent: 2 },
			{ id: 2, parent: 1 }
		];

		assert.throws(
			() => buildTree(items, {
				id: 'id',
				parentId: 'parent',
				validateTree: true
			}),
			/detected a cycle/i
		);
	});

	it('assigns depth correctly using depthKey', () => {
		const items = [
			{ id: 1 },
			{ id: 2, parent: 1 },
			{ id: 3, parent: 2 },
		];

		const { roots } = buildTree(items, { id: 'id', parentId: 'parent', depthKey: 'depth' });

		assert.strictEqual(roots[0].depth, 0);
		assert.strictEqual(roots[0].children[0].depth, 1);
		assert.strictEqual(roots[0].children[0].children[0].depth, 2);
	});

	it('omits parent reference when parentKey is false', () => {
		const items = [{ id: 1 }, { id: 2, parent: 1 }];

		const { roots } = buildTree(items, { id: 'id', parentId: 'parent', parentKey: false });

		assert.strictEqual(roots[0].children[0].parent, undefined);
	});

	it('correctly merges values into node when valueKey is false', () => {
		const items = [{ id: 1, name: 'Node' }];

		const { roots } = buildTree(items, { id: 'id', parentId: 'parent', valueKey: false });

		assert.strictEqual(roots[0].name, 'Node');
	});

	it('uses custom mapper for node values', () => {
		const items = [{ id: 1, name: 'Node' }];

		const { roots } = buildTree(items, {
			id: 'id',
			parentId: 'parent',
			valueResolver: item => ({ label: item.name }),
		});

		assert.strictEqual(roots[0].value.label, 'Node');
	});

	it('handles empty input gracefully', () => {
		const items = [];

		const { roots, nodes } = buildTree(items, { id: 'id', parentId: 'parent' });

		assert.strictEqual(roots.length, 0);
		assert.strictEqual(nodes.size, 0);
	});

	it('cleans up node when valueKey === false and parentKey is set', () => {
		const items = [{ id: 1, parent: null, children: [], parentRef: 'x' }];
		const { nodes } = buildTree(items, {
			id: 'id',
			parentId: 'parent',
			nodeValueKey: false,
			nodeParentKey: 'parentRef',
			nodeChildrenKey: 'children'
		});

		const node = nodes.get(1);
		assert.strictEqual(node.children, undefined); // cleanup
		assert.strictEqual(node.parentRef, undefined); // cleanup
	});

	it('assigns depth even if node has no children', () => {
		const items = [
			{ id: 1, parent: null },
			{ id: 2, parent: 1 },
			{ id: 3, parent: 2 },
		];

		const { nodes } = buildTree(items, {
			id: 'id',
			parentId: 'parent',
			depthKey: 'depth',
		});

		assert.strictEqual(nodes.get(3).depth, 2); // leaf node
	});

	it('collects multiple siblings under missing parent before it appears', () => {
		const items = [
			{ id: 2, parent: 99, name: 'child1' },
			{ id: 3, parent: 99, name: 'child2' },
			{ id: 99, parent: null, name: 'parent' }
		];

		const { roots, nodes } = buildTree(items, {
			id: 'id',
			parentId: 'parent',
		});

		const parent = nodes.get(99);
		assert.strictEqual(parent.children.length, 2);
		assert.strictEqual(parent.children[0].value.name, 'child1');
		assert.strictEqual(parent.children[1].value.name, 'child2');
	});

});

describe('buildTree in childIds mode', () => {
	it('builds a basic tree', () => {
		const items = [
			{ id: 'a', children: ['b', 'c'] },
			{ id: 'b' },
			{ id: 'c' },
		];

		const { roots, nodes } = buildTree(items, { id: 'id', childIds: 'children' });

		assert.strictEqual(roots.length, 1);
		assert.strictEqual(nodes.size, 3);
		assert.strictEqual(roots[0].children.length, 2);
	});

	it('throws on duplicate identifiers', () => {
		const items = [
			{ id: 1, children: [2] },
			{ id: 1, children: [3] },
			{ id: 2 },
			{ id: 3 },
		];

		assert.throws(
			() => buildTree(items, {
				id: 'id',
				childIds: 'children',
			}),
			/duplicate identifier/i
		);
	});

	it('validates referential integrity', () => {
		const items = [{ id: 1, children: [99] }];

		assert.throws(
			() => buildTree(items, { id: 'id', childIds: 'children', validateReferences: true }),
			/referential integrity violation/i
		);
	});

	it('detects node reachable via multiple paths', () => {
		const items = [
			{ id: 3 },
			{ id: 1, children: [3] },
			{ id: 2, children: [3] },
		];

		assert.throws(
			() => buildTree(items, {
				id: 'id',
				childIds: 'children',
				parentKey: false,
				validateTree: true,
			}),
			/node reachable via multiple paths/i
		);
	});

	it('throws if childIds returns a non-iterable', () => {
		const items = [{ id: 1, children: 123 }];
		assert.throws(
			() => buildTree(items, { id: 'id', childIds: 'children' }),
			/invalid children: expected an iterable value/
		);
	});

	it('cleans up node when valueKey === false and parentKey is set', () => {
		const items = [{ id: 1, children: [], C: 123 }];
		const { nodes } = buildTree(items, {
			id: 'id',
			childIds: 'children',
			valueKey: false,
			parentKey: 'P',
			childrenKey: 'C'
		});

		const node = nodes.get(1);
		assert.strictEqual(node.P, undefined); // cleaned
		assert.strictEqual(node.C, undefined); // cleaned
	});

	it('removes empty children array from parent', () => {
		const items = [
			{ id: 1, children: [2] },
		];

		const { roots } = buildTree(items, {
			id: 'id',
			childIds: 'children'
		});

		// child id is unresolved, fallback to empty
		assert.strictEqual(roots[0].children, undefined);
	});

	it('removes childrenKey if remains empty after unresolved reference removal', () => {
		const items = [{ id: 1, children: [99] }];
		const { roots } = buildTree(items, {
			id: 'id',
			childIds: 'children',
			validateReferences: false,
		});

		assert.strictEqual(roots[0].children, undefined);
	});

	it('throws when trying to overwrite existing parent reference of a child', () => {
		const items = [
			{ id: 3 },
			{ id: 1, children: [3] },
			{ id: 2, children: [3] }
		];

		assert.throws(
			() => buildTree(items, {
				id: 'id',
				childIds: 'children',
			}),
			/already has a different parent/
		);
	});

	it('throws if a child is assigned to multiple parents (unresolved)', () => {
		const items = [
			{ id: 1, children: [3] },
			{ id: 2, children: [3] },
		];

		assert.throws(
			() => buildTree(items, { id: 'id', childIds: 'children' }),
			/multiple parents reference the same unresolved child/i
		);
	});

	it('throws when parent assignment conflicts in late resolution', () => {
		const items = [
			{ id: 3 },
			{ id: 1, children: [3] },
			{ id: 2, children: [3] },
		];

		assert.throws(
			() => buildTree(items, {
				id: 'id',
				childIds: 'children'
			}),
			/already has a different parent/i
		);
	});
});
