type TreeNode<
	T,
	D extends string | number | symbol | false,
	P extends string | number | symbol | false,
	C extends string | number | symbol
	> = (
		D extends false
		? (
			P extends false
			? T & {
				[k in C]?: TreeNode<T,D,P,C>[];
			}
			: T & {
				[k in Exclude<P, false>]?: TreeNode<T,D,P,C>;
			} & {
				[k in C]?: TreeNode<T,D,P,C>[];
			}
		)
		: (
			P extends false
			? {
				[k in Exclude<D, false>]: T;
			} & {
				[k in C]?: TreeNode<T,D,P,C>[];
			}
			: {
				[k in Exclude<D, false>]: T;
			} & {
				[k in Exclude<P, false>]?: TreeNode<T,D,P,C>;
			} & {
				[k in C]?: TreeNode<T,D,P,C>[];
			}
		)
	);

function buildTree<
	T extends (D extends false ? object : unknown),
	M extends (D extends false ? object : unknown) = T,
	K extends unknown = unknown,
	D extends string | number | symbol | false = 'data',
	P extends string | number | symbol | false = 'parent',
	C extends string | number | symbol = 'children'
>(items: Iterable<T>, options: {
	key?: string | number | symbol | { (item: T): K; };
	parentKey?: string | number | symbol | { (item: T): K; };
	nodeDataKey?: D;
	nodeParentKey?: P;
	nodeChildrenKey?: C;
	mapNodeData?: { (item: T): M; };
	validateParentKeys?: Iterable<unknown>;
}): {
	roots: TreeNode<M extends undefined ? T : M, D, P, C>[];
	nodes: Map<K, TreeNode<M extends undefined ? T : M, D, P, C>>;
} {
	const {
		key = 'id',
		parentKey = 'parent',
		nodeDataKey = 'data',
		nodeParentKey = 'parent',
		nodeChildrenKey = 'children',
		mapNodeData,
		validateParentKeys,
	} = options;

	const nodes = new Map<K, any>();
	const danglingNodes = new Map<K, any>();

	for (const item of items) {
		// @ts-ignore
		const keyOfNode = typeof key === 'function' ? key(item) : item[key];
		if (nodes.has(keyOfNode)) {
			throw new Error(`Duplicate identifier detected for "${keyOfNode}"`);
		}

		// Current node can be new or already created by a child item as its parent
		let node = danglingNodes.get(keyOfNode);
		if (node) {
			danglingNodes.delete(keyOfNode);
		} else {
			node = {};
		}
		nodes.set(keyOfNode, node);

		// Set the data of the node
		const nodeData = typeof mapNodeData === 'function' ? mapNodeData(item) : item;
		if (nodeDataKey !== false) {
			node[nodeDataKey] = nodeData;
		} else {
			Object.assign(node, nodeData);
		}

		// Link this node to its parent
		// @ts-ignore
		const keyOfParentNode = typeof parentKey === 'function' ? parentKey(item) : item[parentKey];
		let parent = nodes.get(keyOfParentNode) ?? danglingNodes.get(keyOfParentNode);
		if (!parent) {
			// No parent node exists yet, create as dangling node
			parent = {};
			// Track as dangling node, we dont know yet if it really exists
			danglingNodes.set(keyOfParentNode, parent);
		}
		// When no children added yet
		if (!parent[nodeChildrenKey]) {
			parent[nodeChildrenKey] = [];
		}
		// Add as child
		parent[nodeChildrenKey].push(node);

		// Set the parent on this node
		if (nodeParentKey !== false) {
			node[nodeParentKey] = parent;
		}
	}

	if (danglingNodes.size === 0) {
		throw new Error(`Could not find root nodes, circular references found.`);
	}

	// Children of dangling nodes will become the root nodes
	const roots: TreeNode<M extends undefined ? T : M, D, P, C>[] = [];
	if (validateParentKeys) {
		const validParentKeys = new Set(validateParentKeys);
		for (const [key, node] of danglingNodes.entries()) {
			if (!validParentKeys.has(key)) {
				throw new Error(`Invalid parent key "${key}" from items "${node[nodeChildrenKey].join('", "')}".`);
			}
			for (const root of node[nodeChildrenKey]) {
				// Root nodes does not have a parent, unlink the dangling node
				if (nodeParentKey !== false) {
					delete root[nodeParentKey];
				}
				roots.push(root);
			}
		}
	} else {
		for (const node of danglingNodes.values()) {
			for (const root of node[nodeChildrenKey]) {
				// Root nodes does not have a parent, unlink the dangling node
				if (nodeParentKey !== false) {
					delete root[nodeParentKey];
				}
				roots.push(root);
			}
		}
	}
	return { roots, nodes };
}

export default buildTree;
