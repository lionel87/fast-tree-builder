type TreeNode<
	TValue,
	TValueKey extends PropertyKey | false,
	TParentKey extends PropertyKey | false,
	TChildrenKey extends PropertyKey,
	TDepthKey extends PropertyKey | false
> =
	& (TValueKey extends false
		? Omit<TValue, Exclude<TParentKey, false> | TChildrenKey | Exclude<TDepthKey, false>>
		: { [k in Exclude<TValueKey, false>]: TValue; }
	)
	& (TParentKey extends false
		? { [k in Exclude<TParentKey, false>]: TreeNode<TValue, TValueKey, TParentKey, TChildrenKey, TDepthKey>; }
		: {}
	)
	& { [k in TChildrenKey]?: TreeNode<TValue, TValueKey, TParentKey, TChildrenKey, TDepthKey>[]; }
	& (TDepthKey extends false
		? { [k in Exclude<TDepthKey, false>]: number; }
		: {}
	)
	;

type AccessorReturnType<O, P extends (keyof O) | ((item: O) => any)> =
	P extends ((item: O) => infer R) ? R :
	P extends (keyof O) ? O[P] :
	never;

type ObjectKeysOfIterableProperties<T> = {
	[K in keyof T]: T[K] extends (Iterable<unknown> & object) | null | undefined ? K : never;
}[keyof T];

export default function buildTree<
	TIdAccessor extends (keyof NoInfer<TInputValue>) | ((item: NoInfer<TInputValue>) => unknown),
	TNodeValueKey extends PropertyKey | false = 'value',
	TNodeParentKey extends PropertyKey | false = 'parent',
	TNodeChildrenKey extends PropertyKey = 'children',
	TNodeDepthKey extends PropertyKey | false = false,
	TInputValue extends (
		TNodeValueKey extends false ? object :
		TIdAccessor extends PropertyKey ? object :
		unknown
	) = any,
	TMappedValue extends (TNodeValueKey extends false ? object : unknown) = TInputValue,
>(items: Iterable<TInputValue>, options: {
	/**
	 * A string key or function used to get the item's unique identifier.
	 */
	id: TIdAccessor;

	/**
	 * Maps the input item to a different value stored in the resulting tree node.
	 */
	nodeValueMapper?: { (item: NoInfer<TInputValue>): TMappedValue; };

	/**
	 * Object key used to store the input item in the output tree node.
	 *
	 * Set to `false` to merge the item into the node itself.
	 *
	 * Defaults to `'value'`.
	 */
	nodeValueKey?: TNodeValueKey;

	/**
	 * Object key used to store the reference to the parent node in the output tree node.
	 *
	 * Set to `false` to omit parent links.
	 *
	 * Defaults to `'parent'`.
	 */
	nodeParentKey?: TNodeParentKey;

	/**
	 * Object key used to store the list of child nodes in the output tree node.
	 *
	 * Defaults to `'children'`.
	 */
	nodeChildrenKey?: TNodeChildrenKey;

	/**
	 * Object key used to store a value indicating the node depth in the tree on each output node.
	 * Root nodes have a depth of 0.
	 *
	 * Set to `false` to omit depth values.
	 *
	 * Enables `validateTree`, as depth assignment requires a valid tree structure,
	 * and both operations also share the same traversal logic.
	 *
	 * Defaults to `false`.
	 */
	nodeDepthKey?: TNodeDepthKey;

	/**
	 * Validates that the final structure forms a tree.
	 *
	 * Ensures:
	 * - No cycles
	 * - No node reachable through multiple paths
	 *
	 * Throws if the structure is not a proper tree.
	 *
	 * Defaults to `false`.
	 */
	validateTree?: boolean;

	/**
	 * Validates referential integrity of the input.
	 *
	 * In strict mode:
	 * - All parent and child references must point to existing items in the input.
	 * - Root items must have their `parentId` unset, `null`, or `undefined`.
	 *
	 * Any invalid or missing references will result in an error during tree construction.
	 *
	 * Defaults to `false`.
	 */
	validateReferences?: boolean;
} & ({
	/**
	 * A string key or function used to get the item's parent identifier.
	 *
	 * Either `parentId` or `childIds` must be provided.
	 */
	parentId?: never;

	/**
	 * A string key or function to retrieve a list of child identifiers from an item.
	 *
	 * Either `parentId` or `childIds` must be provided.
	 */
	childIds: ObjectKeysOfIterableProperties<NoInfer<TInputValue>> | ((item: NoInfer<TInputValue>) => (Iterable<unknown> & object) | null | undefined);
} | {
	/**
	 * A string key or function used to get the item's parent identifier.
	 *
	 * Either `parentId` or `childIds` must be provided.
	 */
	parentId: (keyof NoInfer<TInputValue>) | ((item: NoInfer<TInputValue>) => unknown);

	/**
	 * A string key or function to retrieve a list of child identifiers from an item.
	 *
	 * Either `parentId` or `childIds` must be provided.
	 */
	childIds?: never;
})): {
	roots: TreeNode<
		TMappedValue extends undefined ? TInputValue : TMappedValue,
		TNodeValueKey,
		TNodeParentKey,
		TNodeChildrenKey,
		TNodeDepthKey
	>[];
	nodes: Map<
		AccessorReturnType<TInputValue, TIdAccessor>,
		TreeNode<
			TMappedValue extends undefined ? TInputValue : TMappedValue,
			TNodeValueKey,
			TNodeParentKey,
			TNodeChildrenKey,
			TNodeDepthKey
		>
	>;
} {
	if (!options) {
		// TS types prevents this but its better to check
		throw new Error(`Missing required 'options' parameter.`);
	}
	const {
		id: idAccessor,
		parentId: parentIdAccessor,
		childIds: childIdsAccessor,
		nodeValueMapper,
		nodeValueKey = 'value',
		nodeParentKey = 'parent',
		nodeChildrenKey = 'children',
		nodeDepthKey = false,
		validateTree = false,
		validateReferences = false,
	} = options;

	if (!idAccessor) {
		throw new Error(`Option 'id' is required.`);
	}
	if (!parentIdAccessor && !childIdsAccessor) {
		throw new Error(`Either 'parentId' or 'childIds' must be provided.`);
	}
	if (parentIdAccessor && childIdsAccessor) {
		throw new Error(`'parentId' and 'childIds' cannot be used together.`);
	}

	const roots = [];
	const nodes = new Map();

	if (parentIdAccessor) {
		// CONNECT BY PARENT ID

		/** `parentId => [childNode, ...]` */
		const waitingForParent = new Map();

		for (const item of items as any) {
			const id = typeof idAccessor === 'function' ? idAccessor(item) : item[idAccessor];

			if (nodes.has(id)) {
				throw new Error(`Duplicate identifier '${id}'.`);
			}

			const node = nodeValueKey !== false
				? { [nodeValueKey as any]: nodeValueMapper ? nodeValueMapper(item) : item }
				: { ...(nodeValueMapper ? nodeValueMapper(item) : item) };

			if (nodeValueKey === false) {
				if (nodeParentKey !== false) {
					delete node[nodeParentKey];
				}
				delete node[nodeChildrenKey];
				// no need to delete 'nodeDepthKey' here
			}

			nodes.set(id, node);

			// Link this node with its parent
			const parentId = typeof parentIdAccessor === 'function' ? parentIdAccessor(item) : item[parentIdAccessor];
			const parentNode = nodes.get(parentId);
			if (parentNode) {
				parentNode[nodeChildrenKey] ||= [];
				parentNode[nodeChildrenKey].push(node);
				if (nodeParentKey !== false) {
					node[nodeParentKey] = parentNode;
				}
			} else {
				const siblings = waitingForParent.get(parentId);
				if (siblings) {
					siblings.push(node);
				} else {
					waitingForParent.set(parentId, [node]);
				}
			}

			// Link this node with its children
			const children = waitingForParent.get(id);
			if (children) {
				node[nodeChildrenKey] = children;

				if (nodeParentKey !== false) {
					for (const child of children) {
						child[nodeParentKey] = node;
					}
				}

				waitingForParent.delete(id);
			}
		}

		// Finalize roots
		for (const [parentId, nodes] of waitingForParent.entries()) {
			if (validateReferences && parentId != null) {
				throw new Error(`Referential integrity violation: parentId '${parentId}' does not match any item in the input.`);
			}
			for (const node of nodes) {
				roots.push(node);
			}
		}

	} else if (childIdsAccessor) {
		// CONNECT BY CHILD IDS

		/** `childId => [{ parentNode, index }, ...]` */
		const waitingChildren = new Map();

		const rootCandidates = new Map();

		for (const item of items as any) {
			const id = typeof idAccessor === 'function' ? idAccessor(item) : item[idAccessor];

			if (nodes.has(id)) {
				throw new Error(`Duplicate identifier '${id}'.`);
			}

			const node = nodeValueKey !== false
				? { [nodeValueKey as PropertyKey]: nodeValueMapper ? nodeValueMapper(item) : item }
				: { ...(nodeValueMapper ? nodeValueMapper(item) : item) };

			if (nodeValueKey === false) {
				if (nodeParentKey !== false) {
					delete node[nodeParentKey];
				}
				delete node[nodeChildrenKey];
				// no need to delete 'nodeDepthKey' here
			}

			nodes.set(id, node);

			// Link this node with its children
			const childIds = typeof childIdsAccessor === 'function' ? childIdsAccessor(item) : item[childIdsAccessor];
			if (childIds != null) {
				if (typeof childIds[Symbol.iterator] !== 'function') {
					// TS types prevents this but its better to check
					throw new Error(`Item '${id}' has invalid children: expected an iterable value.`);
				}

				node[nodeChildrenKey] = [];

				for (const childId of childIds) {
					const childNode = nodes.get(childId);
					if (childNode) {
						node[nodeChildrenKey].push(childNode);

						if (nodeParentKey !== false) {
							if (childNode[nodeParentKey] && childNode[nodeParentKey] !== node) {
								throw new Error(`Node '${childId}' already has a different parent, refusing to overwrite.`);
							}
							childNode[nodeParentKey] = node;
						}

						rootCandidates.delete(childId);
					} else {
						if (waitingChildren.has(childId)) {
							throw new Error(`Multiple parents reference the same unresolved child '${childId}'.`);
						}

						waitingChildren.set(childId, {
							parentNode: node,
							childIndex: node[nodeChildrenKey].length,
						});

						node[nodeChildrenKey].push(null); // placeholder until the item arrives
					}
				}

				if (node[nodeChildrenKey].length === 0) {
					delete node[nodeChildrenKey];
				}
			}

			// Link this node with its parent
			const parentDescriptor = waitingChildren.get(id);
			if (parentDescriptor) {
				const { parentNode, childIndex } = parentDescriptor;

				parentNode[nodeChildrenKey][childIndex] = node;

				if (nodeParentKey !== false) {
					if (node[nodeParentKey] && node[nodeParentKey] !== parentNode) {
						throw new Error(`Node '${id}' already has a different parent, refusing to overwrite.`);
					}
					node[nodeParentKey] = parentNode;
				}

				waitingChildren.delete(id);
			} else {
				rootCandidates.set(id, node);
			}
		}

		if (waitingChildren.size > 0) {
			if (validateReferences) {
				const childId = waitingChildren.keys().next().value;
				throw new Error(`Referential integrity violation: child reference '${childId}' does not match any item in the input.`);
			}

			// Remove unresolved children
			const pending = Array.from(waitingChildren.values());
			for (let i = pending.length - 1; i >= 0; i--) {
				const { parentNode, childIndex } = pending[i];

				parentNode[nodeChildrenKey].splice(childIndex, 1);

				if (parentNode[nodeChildrenKey].length === 0) {
					delete parentNode[nodeChildrenKey];
				}
			}
		}

		// Finalize roots
		for (const node of rootCandidates.values()) {
			roots.push(node);
		}
	}

	const withDepth = typeof nodeDepthKey === 'string'
		|| typeof nodeDepthKey === 'symbol'
		|| typeof nodeDepthKey === 'number';

	if (validateTree || withDepth) {
		if (roots.length === 0 && nodes.size > 0) {
			throw new Error('Tree validation failed: detected a cycle.');
		}

		const stack = [...roots].map(node => ({ node, depth: 0 }));
		const visited = new Set();

		let processedCount = 0;
		const MAX_NODES = nodes.size;

		while (stack.length > 0 && processedCount++ <= MAX_NODES) {
			const { node, depth } = stack.pop()!;

			if (visited.has(node)) {
				throw new Error('Tree validation failed: a node reachable via multiple paths.');
			}
			visited.add(node);

			if (withDepth) {
				node[nodeDepthKey] = depth;
			}

			if (node[nodeChildrenKey]) {
				for (const child of node[nodeChildrenKey]) {
					stack.push({ node: child, depth: depth + 1 });
				}
			}
		}

		if (nodes.size !== visited.size) {
			throw new Error('Tree validation failed: detected a cycle.');
		}
	}
	return { roots, nodes };
}
