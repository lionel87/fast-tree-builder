type TreeNode<
	TInputData,
	TDataKey extends string | number | symbol | false,
	TParentKey extends string | number | symbol | false,
	TChildrenKey extends string | number | symbol
> = (
		TDataKey extends false
		? (
			TParentKey extends false
			? Omit<TInputData, TChildrenKey> & {
				[k in TChildrenKey]?: TreeNode<TInputData, TDataKey, TParentKey, TChildrenKey>[];
			}
			: Omit<TInputData, Exclude<TParentKey, false> | TChildrenKey> & {
				[k in Exclude<TParentKey, false>]?: TreeNode<TInputData, TDataKey, TParentKey, TChildrenKey>;
			} & {
				[k in TChildrenKey]?: TreeNode<TInputData, TDataKey, TParentKey, TChildrenKey>[];
			}
		)
		: (
			TParentKey extends false
			? {
				[k in Exclude<TDataKey, false>]: TInputData;
			} & {
				[k in TChildrenKey]?: TreeNode<TInputData, TDataKey, TParentKey, TChildrenKey>[];
			}
			: {
				[k in Exclude<TDataKey, false>]: TInputData;
			} & {
				[k in Exclude<TParentKey, false>]?: TreeNode<TInputData, TDataKey, TParentKey, TChildrenKey>;
			} & {
				[k in TChildrenKey]?: TreeNode<TInputData, TDataKey, TParentKey, TChildrenKey>[];
			}
		)
	);

type KeyReturnType<T, P extends keyof T | ((item: T) => any)> =
	P extends ((item: T) => infer R) ? R :
	P extends keyof T ? T[P] :
	never;

function buildTree<
	TInputData extends (TNodeDataKey extends false ? object : unknown),
	TKey extends keyof TInputData | ((item: TInputData) => any),
	TMappedData extends (TNodeDataKey extends false ? object : unknown) = TInputData,
	TNodeDataKey extends string | number | symbol | false = 'data',
	TNodeParentKey extends string | number | symbol | false = 'parent',
	TNodeChildrenKey extends string | number | symbol = 'children'
>(items: Iterable<TInputData>, options: {
	mode?: 'parent' | 'children';
	key?: TKey;
	parentKey?: keyof TInputData | ((item: TInputData) => any);
	childrenKey?: keyof TInputData | ((item: TInputData) => any);
	nodeDataKey?: TNodeDataKey;
	nodeParentKey?: TNodeParentKey;
	nodeChildrenKey?: TNodeChildrenKey;
	mapNodeData?: { (item: TInputData): TMappedData; };
	validRootKeys?: Iterable<unknown>;
	validRootParentKeys?: Iterable<unknown>;
	validateTree?: boolean;
} = {}): {
	roots: TreeNode<TMappedData extends undefined ? TInputData : TMappedData, TNodeDataKey, TNodeParentKey, TNodeChildrenKey>[];
	nodes: Map<KeyReturnType<TInputData, TKey>, TreeNode<TMappedData extends undefined ? TInputData : TMappedData, TNodeDataKey, TNodeParentKey, TNodeChildrenKey>>;
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

	const roots: TreeNode<TMappedData extends undefined ? TInputData : TMappedData, TNodeDataKey, TNodeParentKey, TNodeChildrenKey>[] = [];
	const nodes = new Map<KeyReturnType<TInputData, TKey>, any>();
	const danglingNodes = new Map<KeyReturnType<TInputData, TKey>, any>();

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

		// TODO: this could be optimized
		if (validRootKeys) {
			const rootsSet = new Set(roots);
			const validKeys = new Set(validRootKeys);
			for (const [key, node] of nodes) {
				if (rootsSet.has(node) && !validKeys.has(key)) {
					throw new Error(`A root node has an invalid key "${key}"`);
				}
			}
		}

	} else {
		if (validRootParentKeys) {
			throw new Error(`Option "validRootParentKeys" cannot be used when mode is set to "children".`);
		}

		const knownNodes = new Set<KeyReturnType<TInputData, TKey>>();
		const incompleteNodes = new Set<KeyReturnType<TInputData, TKey>>();

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

		if (validRootKeys) {
			const validKeys = new Set(validRootKeys);
			for (const [key, node] of danglingNodes.entries()) {
				if (!validKeys.has(key)) {
					throw new Error(`A root node has an invalid key "${key}"`);
				}
				roots.push(node);
				nodes.set(key, node);
			}
		} else {
			for (const [key, node] of danglingNodes.entries()) {
				roots.push(node);
				nodes.set(key, node);
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
		while ((node = gray.pop()) && count <= nodes.size) {
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
