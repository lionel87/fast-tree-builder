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
		? {}
		: { [k in Exclude<TParentKey, false>]?: TreeNode<TValue, TValueKey, TParentKey, TChildrenKey, TDepthKey>; }
	)
	& { [k in TChildrenKey]?: TreeNode<TValue, TValueKey, TParentKey, TChildrenKey, TDepthKey>[]; }
	& (TDepthKey extends false
		? {}
		: { [k in Exclude<TDepthKey, false>]: number; }
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
	TValueKey extends PropertyKey | false = 'value',
	TParentKey extends PropertyKey | false = 'parent',
	TChildrenKey extends PropertyKey = 'children',
	TDepthKey extends PropertyKey | false = false,
	TInputValue extends (
		TValueKey extends false ? object :
		TIdAccessor extends PropertyKey ? object :
		unknown
	) = any,
	TResolvedValue extends (TValueKey extends false ? object : unknown) = TInputValue,
>(items: Iterable<TInputValue>, options: {
	/**
	 * A string key or function used to get the item's unique identifier.
	 */
	id: TIdAccessor;

	/**
	 * Function to transform an item to a custom value stored in the node.
	 */
	valueResolver?: { (item: NoInfer<TInputValue>): TResolvedValue; };

	/**
	 * Key where the item is stored in the output node.
	 *
	 * Set to `false` to merge the item's properties directly into the node (shallow copy).
	 *
	 * Defaults to `'value'`.
	 */
	valueKey?: TValueKey;

	/**
	 * Key where the node's parent reference is stored in the output node.
	 *
	 * Set to `false` to omit parent links.
	 *
	 * Defaults to `'parent'`.
	 */
	parentKey?: TParentKey;

	/**
	 * Key where the node's children are stored in the output node.
	 *
	 * Defaults to `'children'`.
	 */
	childrenKey?: TChildrenKey;

	/**
	 * Key where the node's depth is stored in the output node.
	 * Root nodes have a depth of 0.
	 *
	 * Set to `false` to omit depth values.
	 *
	 * Setting this enables validateTree implicitly, as depth calculation requires full tree validation.
	 * Both operations share the same traversal logic so the additional tree validation is not an overhead.
	 *
	 * Defaults to `false`.
	 */
	depthKey?: TDepthKey;

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
	 * When true, verifies all parentId or childIds resolve to real items.
	 * Only `null` and `undefined` are acceptable as parent id for root nodes in parentId mode.
	 * Every item in the children list must resolve to a real item in childIds mode.
	 *
	 * Errors are thrown on invalid references.
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
		TResolvedValue extends undefined ? TInputValue : TResolvedValue,
		TValueKey,
		TParentKey,
		TChildrenKey,
		TDepthKey
	>[];
	nodes: Map<
		AccessorReturnType<TInputValue, TIdAccessor>,
		TreeNode<
			TResolvedValue extends undefined ? TInputValue : TResolvedValue,
			TValueKey,
			TParentKey,
			TChildrenKey,
			TDepthKey
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
		valueResolver,
		valueKey = 'value',
		parentKey = 'parent',
		childrenKey = 'children',
		depthKey = false,
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

			const node = valueKey !== false
				? { [valueKey as any]: valueResolver ? valueResolver(item) : item }
				: { ...(valueResolver ? valueResolver(item) : item) };

			if (valueKey === false) {
				if (parentKey !== false) {
					delete node[parentKey];
				}
				delete node[childrenKey];
				// no need to delete 'depthKey' here
			}

			nodes.set(id, node);

			// Link this node with its parent
			const parentId = typeof parentIdAccessor === 'function' ? parentIdAccessor(item) : item[parentIdAccessor];
			const parentNode = nodes.get(parentId);
			if (parentNode) {
				parentNode[childrenKey] ||= [];
				parentNode[childrenKey].push(node);
				if (parentKey !== false) {
					node[parentKey] = parentNode;
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
				node[childrenKey] = children;

				if (parentKey !== false) {
					for (const child of children) {
						child[parentKey] = node;
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

			const node = valueKey !== false
				? { [valueKey as PropertyKey]: valueResolver ? valueResolver(item) : item }
				: { ...(valueResolver ? valueResolver(item) : item) };

			if (valueKey === false) {
				if (parentKey !== false) {
					delete node[parentKey];
				}
				delete node[childrenKey];
				// no need to delete 'depthKey' here
			}

			nodes.set(id, node);

			// Link this node with its children
			const childIds = typeof childIdsAccessor === 'function' ? childIdsAccessor(item) : item[childIdsAccessor];
			if (childIds != null) {
				if (typeof childIds[Symbol.iterator] !== 'function') {
					// TS types prevents this but its better to check
					throw new Error(`Item '${id}' has invalid children: expected an iterable value.`);
				}

				node[childrenKey] = [];

				for (const childId of childIds) {
					const childNode = nodes.get(childId);
					if (childNode) {
						node[childrenKey].push(childNode);

						if (parentKey !== false) {
							if (childNode[parentKey] && childNode[parentKey] !== node) {
								throw new Error(`Node '${childId}' already has a different parent, refusing to overwrite.`);
							}
							childNode[parentKey] = node;
						}

						rootCandidates.delete(childId);
					} else {
						if (waitingChildren.has(childId)) {
							throw new Error(`Multiple parents reference the same unresolved child '${childId}'.`);
						}

						waitingChildren.set(childId, {
							parentNode: node,
							childIndex: node[childrenKey].length,
						});

						node[childrenKey].push(null); // placeholder until the item arrives
					}
				}

				if (node[childrenKey].length === 0) {
					delete node[childrenKey];
				}
			}

			// Link this node with its parent
			const parentDescriptor = waitingChildren.get(id);
			if (parentDescriptor) {
				const { parentNode, childIndex } = parentDescriptor;

				parentNode[childrenKey][childIndex] = node;

				if (parentKey !== false) {
					if (node[parentKey] && node[parentKey] !== parentNode) {
						throw new Error(`Node '${id}' already has a different parent, refusing to overwrite.`);
					}
					node[parentKey] = parentNode;
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

				parentNode[childrenKey].splice(childIndex, 1);

				if (parentNode[childrenKey].length === 0) {
					delete parentNode[childrenKey];
				}
			}
		}

		// Finalize roots
		for (const node of rootCandidates.values()) {
			roots.push(node);
		}
	}

	const withDepth = typeof depthKey === 'string'
		|| typeof depthKey === 'symbol'
		|| typeof depthKey === 'number';

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
				node[depthKey] = depth;
			}

			if (node[childrenKey]) {
				for (const child of node[childrenKey]) {
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
