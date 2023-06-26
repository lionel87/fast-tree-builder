import { expect } from 'chai';
import buildTree from '../esm/index.js';

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

		expect(roots).to.have.lengthOf(2);
		expect(nodes).to.have.keys([1, 2, 3, 4, 5]);

		expect(roots[0].data.name).to.equal('Root 1');
		expect(roots[0].children[0].data.name).to.equal('Child 1.1');
		expect(roots[0].children[0].parent.data.name).to.equal('Root 1');
		expect(roots[0].children[1].data.name).to.equal('Child 1.2');
		expect(roots[0].children[1].parent.data.name).to.equal('Root 1');
		expect(roots[1].data.name).to.equal('Root 2');
		expect(roots[1].children[0].data.name).to.equal('Child 2.1');
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

		expect(roots).to.have.lengthOf(2);
		expect(nodes).to.have.keys([1, 2, 3, 4, 5]);

		expect(roots[0].DATA.name).to.equal('Root 1');
		expect(roots[0].CHILDREN[0].DATA.name).to.equal('Child 1.1');
		expect(roots[0].CHILDREN[0].PARENT.DATA.name).to.equal('Root 1');
		expect(roots[0].CHILDREN[1].DATA.name).to.equal('Child 1.2');
		expect(roots[0].CHILDREN[1].PARENT.DATA.name).to.equal('Root 1');
		expect(roots[1].DATA.name).to.equal('Root 2');
		expect(roots[1].CHILDREN[0].DATA.name).to.equal('Child 2.1');
	});

	it('should build a tree with parent keys disabled', () => {
		const items = [
			{ id: 1, parent: null, name: 'Root 1' },
			{ id: 2, parent: null, name: 'Root 2' },
			{ id: 3, parent: 1, name: 'Child 1.1' },
			{ id: 4, parent: 1, name: 'Child 1.2' },
			{ id: 5, parent: 2, name: 'Child 2.1' },
		];

		const { roots, nodes } = buildTree(items, {
			nodeParentKey: false,
		});

		expect(roots[0].children[0].parent).to.be.undefined;
		expect(roots[0].children[1].parent).to.be.undefined;
	});

	it('should map node data when mapper fn configured', () => {
		const items = [
			{ id: 1, parent: null, name: 'Root 1' },
			{ id: 2, parent: null, name: 'Root 2' },
			{ id: 3, parent: 1, name: 'Child 1.1' },
			{ id: 4, parent: 1, name: 'Child 1.2' },
			{ id: 5, parent: 2, name: 'Child 2.1' },
		];

		const { roots, nodes } = buildTree(items, {
			mapNodeData(item) {
				return { title: item.name };
			}
		});

		expect(roots[0].children[0].data).to.deep.equal({ title: 'Child 1.1' });
		expect(roots[0].children[1].data).to.deep.equal({ title: 'Child 1.2' });
	});

	it('should handle circular references and throw an error #1', () => {
		const items = [
			{ id: 1, parent: 2, name: 'Item 1' },
			{ id: 2, parent: 1, name: 'Item 2' },
		];

		expect(() => buildTree(items, { validateTree: true }))
			.to.throw(Error, 'Tree validation error: Stucture is a cyclic graph.');
	});

	it('should handle circular references and throw an error #2', () => {
		const items = [
			{ id: 1, parent: 2, name: 'Item 1' },
			{ id: 2, parent: 1, name: 'Item 2' },
			{ id: 3, parent: null, name: 'Root' },
		];

		expect(() => buildTree(items, { validateTree: true }))
			.to.throw(Error, 'Tree validation error: Stucture is a cyclic graph.');
	});

	it('should handle duplicate identifiers and throw an error', () => {
		const items = [
			{ id: 1, parent: null, name: 'Item 1' },
			{ id: 1, parent: null, name: 'Item 2' },
		];

		expect(() => buildTree(items))
			.to.throw(Error, 'Duplicate identifier detected for "1"');
	});

	it('should handle invalid parent keys and throw an error', () => {
		const items = [
			{ id: 1, parent: null, name: 'Item 1' },
			{ id: 2, parent: 3, name: 'Item 2' },
		];

		expect(() => buildTree(items, { validateParentKeys: [null] }))
			.to.throw(Error, 'Invalid parent key "3"');
	});

});
