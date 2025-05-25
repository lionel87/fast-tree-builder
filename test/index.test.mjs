import assert from 'assert';
import buildTree from '../index.mjs';

describe('buildTree', () => {
	it('builds a basic tree using parent references', () => {
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

	it('builds a tree using child references', () => {
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
			{ id: 1 },
			{ id: 1 },
		];

		assert.throws(
			() => buildTree(items, { id: 'id', parentId: 'parent' }),
			/duplicate identifier/i
		);
	});

	it('validates referential integrity (parent mode)', () => {
		const items = [{ id: 1, parent: 99 }];

		assert.throws(
			() => buildTree(items, { id: 'id', parentId: 'parent', validateReferences: true }),
			/referential integrity violation/i
		);
	});

	it('validates referential integrity (children mode)', () => {
		const items = [{ id: 1, children: [99] }];

		assert.throws(
			() => buildTree(items, { id: 'id', childIds: 'children', validateReferences: true }),
			/referential integrity violation/i
		);
	});

	it('detects cycle in tree structure (parent mode)', () => {
		const items = [
			{ id: 1, parent: 2 },
			{ id: 2, parent: 1 },
		];

		assert.throws(
			() => buildTree(items, { id: 'id', parentId: 'parent', validateTree: true }),
			/detected a cycle/i
		);
	});

	it('detects node reachable via multiple paths (children mode)', () => {
		const items = [
			{ id: 3 },
			{ id: 1, children: [3] },
			{ id: 2, children: [3] },
		];

		assert.throws(
			() => buildTree(items, {
				id: 'id',
				childIds: 'children',
				nodeParentKey: false,
				validateTree: true,
			}),
			/node reachable via multiple paths/i
		);
	});

	it('assigns depth correctly using nodeDepthKey', () => {
		const items = [
			{ id: 1 },
			{ id: 2, parent: 1 },
			{ id: 3, parent: 2 },
		];

		const { roots } = buildTree(items, { id: 'id', parentId: 'parent', nodeDepthKey: 'depth' });

		assert.strictEqual(roots[0].depth, 0);
		assert.strictEqual(roots[0].children[0].depth, 1);
		assert.strictEqual(roots[0].children[0].children[0].depth, 2);
	});

	it('omits parent reference when nodeParentKey is false', () => {
		const items = [{ id: 1 }, { id: 2, parent: 1 }];

		const { roots } = buildTree(items, { id: 'id', parentId: 'parent', nodeParentKey: false });

		assert.strictEqual(roots[0].children[0].parent, undefined);
	});

	it('correctly merges values into node when nodeValueKey is false', () => {
		const items = [{ id: 1, name: 'Node' }];

		const { roots } = buildTree(items, { id: 'id', parentId: 'parent', nodeValueKey: false });

		assert.strictEqual(roots[0].name, 'Node');
	});

	it('uses custom mapper for node values', () => {
		const items = [{ id: 1, name: 'Node' }];

		const { roots } = buildTree(items, {
			id: 'id',
			parentId: 'parent',
			nodeValueMapper: item => ({ label: item.name }),
		});

		assert.strictEqual(roots[0].value.label, 'Node');
	});

	it('handles empty input gracefully', () => {
		const items = [];

		const { roots, nodes } = buildTree(items, { id: 'id', parentId: 'parent' });

		assert.strictEqual(roots.length, 0);
		assert.strictEqual(nodes.size, 0);
	});

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

	it('throws if childIds returns a non-iterable', () => {
		const items = [{ id: 1, children: 123 }];
		assert.throws(
			() => buildTree(items, { id: 'id', childIds: 'children' }),
			/invalid children: expected an iterable value/
		);
	});

});
