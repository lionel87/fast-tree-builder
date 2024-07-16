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
	mode?: 'parent' | 'children';
	key?: K;
	parentKey?: keyof T | ((item: T) => KeyReturnType<T, K>);
	childrenKey?: keyof T | ((item: T) => KeyReturnType<T, K>);
	nodeDataKey?: D;
	nodeParentKey?: P;
	nodeChildrenKey?: C;
	mapNodeData?: { (item: T): M; };
	validRootKeys?: Iterable<unknown>;
	validRootParentKeys?: Iterable<unknown>;
	validateTree?: boolean;
} = {}): {
	roots: TreeNode<M extends undefined ? T : M, D, P, C>[];
	nodes: Map<KeyReturnType<T, K>, TreeNode<M extends undefined ? T : M, D, P, C>>;
} {
	const {
		mode = 'parent',
		key = 'id',
		parentKey = 'parent',
		childrenKey = 'children',
		nodeDataKey = 'data',
		nodeParentKey = 'parent',
		nodeChildrenKey = 'children',
		mapNodeData,
		validRootKeys,
		validRootParentKeys,
		validateTree = false,
	} = options;

	const roots: TreeNode<M extends undefined ? T : M, D, P, C>[] = [];
	const nodes = new Map<KeyReturnType<T, K>, any>();
	const danglingNodes = new Map<KeyReturnType<T, K>, any>();

	if (mode === 'parent') {
		for (const item of items as any) {
			const keyOfNode = typeof key === 'function' ? key(item) : item[key];
			const keyOfParentNode = typeof parentKey === 'function' ? parentKey(item) : item[parentKey];

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
			let parentNode = nodes.get(keyOfParentNode) ?? danglingNodes.get(keyOfParentNode);
			if (!parentNode) {
				// No parent node exists yet, create as dangling node
				parentNode = {};
				// Track as dangling node, we dont know yet if it really exists
				danglingNodes.set(keyOfParentNode, parentNode);
			}
			// When no children added yet
			if (!parentNode[nodeChildrenKey]) {
				parentNode[nodeChildrenKey] = [];
			}
			// Add as child
			parentNode[nodeChildrenKey].push(node);

			// Set the parent on this node
			if (nodeParentKey !== false) {
				node[nodeParentKey] = parentNode;
			}
		}

		// Children of dangling nodes will become the root nodes
		if (validRootParentKeys) {
			const validParentKeys = new Set(validRootParentKeys);
			for (const [parentKey, node] of danglingNodes.entries()) {
				if (!validParentKeys.has(parentKey)) {
					throw new Error(`Invalid parent key "${parentKey}" found for a root node.`);
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

	} else {
		if (validRootParentKeys) {
			throw new Error(`Option "validRootParentKeys" cannot be used when mode is set to "children".`);
		}

		const knownNodes = new Set<KeyReturnType<T, K>>();
		const incompleteNodes = new Set<KeyReturnType<T, K>>();

		for (const item of items as any) {
			const keyOfNode = typeof key === 'function' ? key(item) : item[key];
			const keyOfChildNodes = typeof childrenKey === 'function' ? childrenKey(item) : item[childrenKey];

			if (knownNodes.has(keyOfNode)) {
				throw new Error(`Duplicate identifier detected for "${keyOfNode}"`);
			}
			knownNodes.add(keyOfNode);
			incompleteNodes.delete(keyOfNode);

			let node = nodes.get(keyOfNode);
			if (!node) {
				node = {};
				danglingNodes.set(keyOfNode, node);
			}

			// Set the data of the node
			const nodeData = typeof mapNodeData === 'function' ? mapNodeData(item) : item;
			if (nodeDataKey !== false) {
				node[nodeDataKey] = nodeData;
			} else {
				Object.assign(node, nodeData);
			}

			// Link children to this node
			if (keyOfChildNodes) {
				node[nodeChildrenKey] = [];
				for (const keyOfChildNode of keyOfChildNodes) {
					let childNode = danglingNodes.get(keyOfChildNode);
					if (childNode) {
						nodes.set(keyOfChildNode, childNode);
						danglingNodes.delete(keyOfChildNode);
						// Set the parent on child node
						if (nodeParentKey !== false) {
							childNode[nodeParentKey] = node;
						}
					} else if (nodes.has(keyOfChildNode)) {
						throw new Error(`Duplicate parent detected for "${keyOfChildNode}"`);
					} else {
						// We create a new temporary node
						childNode = {};
						// Set the parent on child node
						if (nodeParentKey !== false) {
							childNode[nodeParentKey] = node;
						}
						nodes.set(keyOfChildNode, childNode);
						incompleteNodes.add(keyOfChildNode);
					}
					node[nodeChildrenKey].push(childNode);
				}
			}
		}

		if (incompleteNodes.size > 0) {
			throw new Error(`Some nodes miss their referenced children (${incompleteNodes.size}).`);
		}

		for (const [key, node] of danglingNodes.entries()) {
			roots.push(node);
			nodes.set(key, node);
		}
	}

	if (validRootKeys) {
		const validKeys = new Set(validRootKeys);
		for (const key of roots.keys()) {
			if (!validKeys.has(key)) {
				throw new Error(`A root node has an unexpected key "${key}"`);
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
