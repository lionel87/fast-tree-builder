import assert from 'assert';
import buildTree from '../index.js';

describe('buildTree', () => {
	it('should build a tree with root and child nodes', () => {
		const items = [
			{ id: 1, parent: null, name: 'Root 1' },
			{ id: 2, parent: null, name: 'Root 2' },
			{ id: 3, parent: 1, name: 'Child 1.1' },
			{ id: 4, parent: 1, name: 'Child 1.2' },
			{ id: 5, parent: 2, name: 'Child 2.1' },
		];

		const { roots, nodes } = buildTree(items);

		assert.strictEqual(roots.length, 2);
		assert.deepStrictEqual([...nodes.keys()], [1, 2, 3, 4, 5]);

		assert.strictEqual(roots[0].data.name, 'Root 1');
		assert.strictEqual(roots[0].children[0].data.name, 'Child 1.1');
		assert.strictEqual(roots[0].children[0].parent.data.name, 'Root 1');
		assert.strictEqual(roots[0].children[1].data.name, 'Child 1.2');
		assert.strictEqual(roots[0].children[1].parent.data.name, 'Root 1');
		assert.strictEqual(roots[1].data.name, 'Root 2');
		assert.strictEqual(roots[1].children[0].data.name, 'Child 2.1');
	});

	it('should build a tree in "children" mode', () => {
		const items = [
			{ id: 1, children: [3, 4], name: 'Root 1' },
			{ id: 2, children: [5], name: 'Root 2' },
			{ id: 3, name: 'Child 1.1' },
			{ id: 4, name: 'Child 1.2' },
			{ id: 5, name: 'Child 2.1' },
		];

		const { roots, nodes } = buildTree(items, { mode: 'children' });

		assert.strictEqual(roots.length, 2);
		assert.deepStrictEqual([...nodes.keys()], [3, 4, 5, 1, 2]);

		assert.strictEqual(roots[0].data.name, 'Root 1');
		assert.strictEqual(roots[0].children[0].data.name, 'Child 1.1');
		assert.strictEqual(roots[0].children[0].parent.data.name, 'Root 1');
		assert.strictEqual(roots[0].children[1].data.name, 'Child 1.2');
		assert.strictEqual(roots[0].children[1].parent.data.name, 'Root 1');
		assert.strictEqual(roots[1].data.name, 'Root 2');
		assert.strictEqual(roots[1].children[0].data.name, 'Child 2.1');
	});

	it('should build a tree with customized nodes keys', () => {
		const items = [
			{ id: 1, parent: null, name: 'Root 1' },
			{ id: 2, parent: null, name: 'Root 2' },
			{ id: 3, parent: 1, name: 'Child 1.1' },
			{ id: 4, parent: 1, name: 'Child 1.2' },
			{ id: 5, parent: 2, name: 'Child 2.1' },
		];

		const { roots, nodes } = buildTree(items, {
			nodeDataKey: 'DATA',
			nodeParentKey: 'PARENT',
			nodeChildrenKey: 'CHILDREN',
		});

		assert.strictEqual(roots.length, 2);
		assert.deepStrictEqual([...nodes.keys()], [1, 2, 3, 4, 5]);

		assert.strictEqual(roots[0].DATA.name, 'Root 1');
		assert.strictEqual(roots[0].CHILDREN[0].DATA.name, 'Child 1.1');
		assert.strictEqual(roots[0].CHILDREN[0].PARENT.DATA.name, 'Root 1');
		assert.strictEqual(roots[0].CHILDREN[1].DATA.name, 'Child 1.2');
		assert.strictEqual(roots[0].CHILDREN[1].PARENT.DATA.name, 'Root 1');
		assert.strictEqual(roots[1].DATA.name, 'Root 2');
		assert.strictEqual(roots[1].CHILDREN[0].DATA.name, 'Child 2.1');
	});

	it('should build a tree with parent keys disabled', () => {
		const items = [
			{ id: 1, parent: null, name: 'Root 1' },
			{ id: 2, parent: null, name: 'Root 2' },
			{ id: 3, parent: 1, name: 'Child 1.1' },
			{ id: 4, parent: 1, name: 'Child 1.2' },
			{ id: 5, parent: 2, name: 'Child 2.1' },
		];

		const { roots } = buildTree(items, {
			nodeParentKey: false,
		});

		assert.strictEqual(roots[0].children[0].parent, undefined);
		assert.strictEqual(roots[0].children[1].parent, undefined);
	});

	it('should merge the node data into the nodes (parent mode)', () => {
		const items = [
			{ id: 1, parent: null, name: 'Root 1' },
			{ id: 2, parent: null, name: 'Root 2' },
			{ id: 3, parent: 1, name: 'Child 1.1' },
			{ id: 4, parent: 1, name: 'Child 1.2' },
			{ id: 5, parent: 2, name: 'Child 2.1' },
		];

		const { roots } = buildTree(items, {
			nodeDataKey: false,
		});

		assert.strictEqual(roots[0].children[0].name, 'Child 1.1');
		assert.strictEqual(roots[0].children[1].name, 'Child 1.2');
	});

	it('should merge the node data into the nodes (children mode)', () => {
		const items = [
			{ id: 1, children: [3, 4], name: 'Root 1' },
			{ id: 2, children: [5], name: 'Root 2' },
			{ id: 3, name: 'Child 1.1' },
			{ id: 4, name: 'Child 1.2' },
			{ id: 5, name: 'Child 2.1' },
		];

		const { roots } = buildTree(items, {
			mode: 'children',
			nodeDataKey: false,
		});

		assert.strictEqual(roots[0].children[0].name, 'Child 1.1');
		assert.strictEqual(roots[0].children[1].name, 'Child 1.2');
	});

	it('should map node data when mapper fn configured', () => {
		const items = [
			{ id: 1, parent: null, name: 'Root 1' },
			{ id: 2, parent: null, name: 'Root 2' },
			{ id: 3, parent: 1, name: 'Child 1.1' },
			{ id: 4, parent: 1, name: 'Child 1.2' },
			{ id: 5, parent: 2, name: 'Child 2.1' },
		];

		const { roots } = buildTree(items, {
			mapNodeData(item) {
				return { title: item.name };
			}
		});

		assert.deepStrictEqual(roots[0].children[0].data, { title: 'Child 1.1' });
		assert.deepStrictEqual(roots[0].children[1].data, { title: 'Child 1.2' });
	});

	it('should handle circular references and throw an error #1', () => {
		const items = [
			{ id: 1, parent: 2, name: 'Item 1' },
			{ id: 2, parent: 1, name: 'Item 2' },
			{ id: 3, name: 'Item 3' }, // a distinct tree root to be sure we handle forests.
		];

		assert.throws(
			() => buildTree(items, { validateTree: true }),
			Error,
			'Tree validation error: Stucture is a cyclic graph.'
		);
	});

	it('should handle circular references and throw an error #2', () => {
		const items = [
			{ id: 1, parent: 2, name: 'Item 1' },
			{ id: 2, parent: 1, name: 'Item 2' },
			{ id: 3, parent: null, name: 'Root' },
		];

		assert.throws(
			() => buildTree(items, { validateTree: true }),
			Error,
			'Tree validation error: Stucture is a cyclic graph.'
		);
	});

	it('should handle duplicate identifiers and throw an error', () => {
		const items = [
			{ id: 1, parent: null, name: 'Item 1' },
			{ id: 1, parent: null, name: 'Item 2' },
		];

		assert.throws(
			() => buildTree(items),
			Error,
			'Duplicate identifier detected for "1"'
		);
	});

	it('should validate root keys without thrown error when no error', () => {
		const items = [
			{ id: 1, parent: null, name: 'Item 1' },
			{ id: 2, parent: 1, name: 'Item 2' },
		];

		const { roots } = buildTree(items, { validRootKeys: [1] });

		assert.deepStrictEqual(roots[0].children[0].data.name, 'Item 2');
	});

	it('should validate root parent keys without thrown error when no error', () => {
		const items = [
			{ id: 1, parent: null, name: 'Item 1' },
			{ id: 2, parent: 1, name: 'Item 2' },
		];

		const { roots } = buildTree(items, { validRootParentKeys: [null] });

		assert.deepStrictEqual(roots[0].children[0].data.name, 'Item 2');
	});

	it('should handle invalid parent keys and throw an error', () => {
		const items = [
			{ id: 1, parent: null, name: 'Item 1' },
			{ id: 2, parent: 3, name: 'Item 2' },
		];

		assert.throws(
			() => buildTree(items, { validRootParentKeys: [null] }),
			Error,
			'Invalid parent key "3"'
		);
	});

	it('should handle invalid keys and throw an error', () => {
		const items = [
			{ id: 'a', children: ['b'], name: 'Item 1' },
			{ id: 'b', name: 'Item 2' },
		];

		assert.throws(
			() => buildTree(items, { validRootKeys: ['c'] }),
			Error,
			'A root node has an invalid key "a"'
		);
	});

	it('should throw when validate root parent keys set with mode: children', () => {
		const items = [
			{ id: 1, parent: null, name: 'Item 1' },
			{ id: 2, parent: 1, name: 'Item 2' },
		];

		assert.throws(
			() => buildTree(items, { validRootParentKeys: [null], mode: 'children' }),
			Error,
			'Option "validRootParentKeys" cannot be used when mode is set to "children".'
		);
	});

	it('should throw when duplicate ids found', () => {
		const items = [
			{ id: 1, parent: null, name: 'Item 1' },
			{ id: 1, parent: null, name: 'Item 2' },
		];

		assert.throws(
			() => buildTree(items, { mode: 'children' }),
			Error,
			'Duplicate identifier detected for "1"'
		);
	});
});
