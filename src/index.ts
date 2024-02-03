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

type KeyReturnType<T, P extends keyof T | ((item: T) => any)> =
	P extends ((item: T) => infer R) ? R :
	P extends keyof T ? T[P] :
	never;

function buildTree<
	T extends (D extends false ? object : unknown),
	K extends keyof T | ((item: T) => any),
	M extends (D extends false ? object : unknown) = T,
	D extends string | number | symbol | false = 'data',
	P extends string | number | symbol | false = 'parent',
	C extends string | number | symbol = 'children'
>(items: Iterable<T>, options: {
	key?: K;
	parentKey?: keyof T | ((item: T) => KeyReturnType<T, K>);
	nodeDataKey?: D;
	nodeParentKey?: P;
	nodeChildrenKey?: C;
	mapNodeData?: { (item: T): M; };
	validateParentKeys?: Iterable<unknown>;
	validateTree?: boolean;
} = {}): {
	roots: TreeNode<M extends undefined ? T : M, D, P, C>[];
	nodes: Map<KeyReturnType<T, K>, TreeNode<M extends undefined ? T : M, D, P, C>>;
} {
	const {
		key = 'id',
		parentKey = 'parent',
		nodeDataKey = 'data',
		nodeParentKey = 'parent',
		nodeChildrenKey = 'children',
		mapNodeData,
		validateParentKeys,
		validateTree = false,
	} = options;

	const nodes = new Map<KeyReturnType<T, K>, any>();
	const danglingNodes = new Map<KeyReturnType<T, K>, any>();

	for (const item of items as any) {
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

	// Children of dangling nodes will become the root nodes
	const roots: TreeNode<M extends undefined ? T : M, D, P, C>[] = [];
	if (validateParentKeys) {
		const validParentKeys = new Set(validateParentKeys);
		for (const [key, node] of danglingNodes.entries()) {
			if (!validParentKeys.has(key)) {
				throw new Error(`Invalid parent key "${key}"`);
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

	if (validateTree) {
		if (nodes.size > 0 && danglingNodes.size === 0) {
			throw new Error('Tree validation error: Stucture is a cyclic graph.');
		}

		// Count nodes, if count === nodes.size then no cycles.
		const gray = [...roots];
		let count = 0;

		let node: any;
		while (node = gray.pop()) {
			++count;
			if (node[nodeChildrenKey]) {
				for (const child of node[nodeChildrenKey]) {
					gray.push(child);
				}
			}
		}

		if (count !== nodes.size) {
			throw new Error('Tree validation error: Stucture is a cyclic graph.');
		}
	}

	return { roots, nodes };
}

export default buildTree;
