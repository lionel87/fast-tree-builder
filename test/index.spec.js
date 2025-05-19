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

		const { roots, nodes } = buildTree(items, {
			id: 'id',
			parentId: 'parent',
		});

		assert.strictEqual(roots.length, 2);
		assert.deepStrictEqual([...nodes.keys()], [1, 2, 3, 4, 5]);

		assert.strictEqual(roots[0].value.name, 'Root 1');
		assert.strictEqual(roots[0].children[0].value.name, 'Child 1.1');
		assert.strictEqual(roots[0].children[0].parent.value.name, 'Root 1');
		assert.strictEqual(roots[0].children[1].value.name, 'Child 1.2');
		assert.strictEqual(roots[0].children[1].parent.value.name, 'Root 1');
		assert.strictEqual(roots[1].value.name, 'Root 2');
		assert.strictEqual(roots[1].children[0].value.name, 'Child 2.1');
	});

	it('should build a tree in "children" mode', () => {
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

		assert.strictEqual(roots.length, 2);
		assert.deepStrictEqual([...nodes.keys()], [1, 2, 3, 4, 5]);

		assert.strictEqual(roots[0].value.name, 'Root 1');
		assert.strictEqual(roots[0].children[0].value.name, 'Child 1.1');
		assert.strictEqual(roots[0].children[0].parent.value.name, 'Root 1');
		assert.strictEqual(roots[0].children[1].value.name, 'Child 1.2');
		assert.strictEqual(roots[0].children[1].parent.value.name, 'Root 1');
		assert.strictEqual(roots[1].value.name, 'Root 2');
		assert.strictEqual(roots[1].children[0].value.name, 'Child 2.1');
	});

	it('should build a tree with customized node keys', () => {
		const items = [
			{ id: 1, parent: null, name: 'Root 1' },
			{ id: 2, parent: null, name: 'Root 2' },
			{ id: 3, parent: 1, name: 'Child 1.1' },
			{ id: 4, parent: 1, name: 'Child 1.2' },
			{ id: 5, parent: 2, name: 'Child 2.1' },
		];

		const { roots, nodes } = buildTree(items, {
			id: 'id',
			parentId: 'parent',
			nodeValueKey: 'VALUE',
			nodeParentKey: 'PARENT',
			nodeChildrenKey: 'CHILDREN',
		});

		assert.strictEqual(roots.length, 2);
		assert.deepStrictEqual([...nodes.keys()], [1, 2, 3, 4, 5]);

		assert.strictEqual(roots[0].VALUE.name, 'Root 1');
		assert.strictEqual(roots[0].CHILDREN[0].VALUE.name, 'Child 1.1');
		assert.strictEqual(roots[0].CHILDREN[0].PARENT.VALUE.name, 'Root 1');
		assert.strictEqual(roots[0].CHILDREN[1].VALUE.name, 'Child 1.2');
		assert.strictEqual(roots[0].CHILDREN[1].PARENT.VALUE.name, 'Root 1');
		assert.strictEqual(roots[1].VALUE.name, 'Root 2');
		assert.strictEqual(roots[1].CHILDREN[0].VALUE.name, 'Child 2.1');
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
			id: 'id',
			parentId: 'parent',
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
			id: 'id',
			parentId: 'parent',
			nodeValueKey: false,
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
			id: 'id',
			childIds: 'children',
			nodeValueKey: false,
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
			id: 'id',
			parentId: 'parent',
			nodeValueMapper(item) {
				return { title: item.name };
			}
		});

		assert.deepStrictEqual(roots[0].children[0].value, { title: 'Child 1.1' });
		assert.deepStrictEqual(roots[0].children[1].value, { title: 'Child 1.2' });
	});

	it('should throw when duplicate ids found', () => {
		const items = [
			{ id: 1, parent: null, name: 'Item 1' },
			{ id: 1, parent: null, name: 'Item 2' },
		];

		assert.throws(
			() => buildTree(items, {
				id: 'id',
				parentId: 'parent',
			}),
			Error,
			'Duplicate identifier "1".'
		);
	});

	it('should handle circular references and throw an error #1', () => {
		const items = [
			{ id: 1, parent: 2, name: 'Item 1' },
			{ id: 2, parent: 1, name: 'Item 2' },
			{ id: 3, name: 'Item 3' }, // a distinct tree root to be sure we handle forests.
		];

		assert.throws(
			() => buildTree(items, {
				id: 'id',
				parentId: 'parent',
				validateTree: true,
			}),
			Error,
			'Tree validation failed: detected a cycle or a node reachable via multiple paths.'
		);
	});

	it('should handle circular references and throw an error #2', () => {
		const items = [
			{ id: 1, parent: 2, name: 'Item 1' },
			{ id: 2, parent: 1, name: 'Item 2' },
			{ id: 3, parent: null, name: 'Root' },
		];

		assert.throws(
			() => buildTree(items, {
				id: 'id',
				parentId: 'parent',
				validateTree: true,
			}),
			Error,
			'Tree validation failed: detected a cycle or a node reachable via multiple paths.'
		);
	});
});
