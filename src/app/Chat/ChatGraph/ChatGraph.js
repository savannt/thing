import "animate.css";
import styles from "@/app/Chat/ChatGraph/ChatGraph.module.css";
import chatStyles from "@/app/Chat/Chat.module.css";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import ReactFlow, {
	MiniMap,
	Controls,
	Background,
	useEdgesState,
	useNodesState,
	addEdge,
	useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";


import NodeTypes, { RawNodeTypes, getRawNodeType, parseSecondaryType } from "@/services/flow/node/NodeTypes";
import edgeTypes from "@/app/Chat/ChatGraph/Flow/EdgeTypes/EdgeTypes";
import Button from "@/components/Button/Button";
import SearchMenu, { SearchMenuRow } from "@/components/SearchMenu/SearchMenu";
import ContextMenu from "@/app/Chat/ChatGraph/ContextMenu/ContextMenu";

import SliderButton from "@/components/Button/SliderButton";
import { groupUpdate } from "@/client/group";

import error from "@/client/error";
import notification from "@/client/notification";

import NODE_DICTIONARY from "@/services/flow/node/_modules";
import TEMPLATE_DICTIONARY from "@/services/flow/TemplateDictionary";

import MenuContainer from "@/components/Menu/MenuContainer";
import Menu from "@/components/Menu/Menu";
import ChatInput from "@/app/Chat/ChatInput/ChatInput";
import { chatMessage } from "@/client/chat";
import { useChannel } from "ably/react";
import useMobile from "@/providers/Mobile/useMobile";
import { onUserMessage } from "@/client/event";
import tryRefresh from "@/client/tryRefresh";

export const SAVE_TIMEOUT = 500;
export const ERROR_TIMEOUT = 15000;

import {
	setSaved,
	setSaving
} from "@/client/saving";
import nodeInputValue from "@/client/nodeInputValue";

export default function ChatGraph({
	showHeader = true,
	type = "chat-graph",
	chat,
	group,
	setGroup,
	enterpriseId,
	className,
	onAnimationEnd,
	onEscape,
	children,
}) {
	let initialNodes = group.nodes || [];
	let initialEdges = group.edges || [];
	let didChangeInitial = false;

	// Remove invalid nodes and associated edges
	const invalidNodes = initialNodes.filter((node) => !NODE_DICTIONARY[node.name]);
	if (invalidNodes.length > 0) {
		didChangeInitial = true;
		notification("Invalid nodes removed", "Some nodes have been removed due to invalid data.", "red");
		invalidNodes.forEach((node) => {
			initialNodes.splice(initialNodes.indexOf(node), 1);
			initialEdges = initialEdges.filter((edge) => edge.source !== node.id && edge.target !== node.id);
		});
	}

	// Remove invalid edges
	const invalidEdges = initialEdges.filter((edge) => !edge.source || !edge.target);
	if (invalidEdges.length > 0) {
		didChangeInitial = true;
		notification("Invalid edges removed", "Some edges have been removed due to invalid connections.", "red");
		invalidEdges.forEach((edge) => {
			initialEdges.splice(initialEdges.indexOf(edge), 1);
		});
	}

	if (didChangeInitial) {
		setGroup((group) => ({
			...group,
			nodes: initialNodes,
			edges: initialEdges,
		}));
	}

	useEffect(() => {
		const headerTitle = document.getElementById("header-title");
		const sidebarHeaderTitle = document.getElementById("sidebar-header-title");

		if (headerTitle) headerTitle.innerText = "Flow Graph";
		if (sidebarHeaderTitle) sidebarHeaderTitle.style.visibility = "hidden";
	}, []);

	const reactFlow = useReactFlow();
	const router = useRouter();
	const isMobile = useMobile();

	const [nodeMenuText, setNodeMenuText] = useState("");
	const [showNodeMenu, setShowNodeMenu] = useState(false);
	const [showPasteMenu, setShowPasteMenu] = useState(false);
	const [showChatMenu, setShowChatMenu] = useState(false);
	const [chatText, setChatText] = useState("");
	const [chatRows, setChatRows] = useState(1);
	const [chatFiles, setChatFiles] = useState([]);

	const [undoStack, setUndoStack] = useState([]);
	const [redoStack, setRedoStack] = useState([]);

	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	const [contextMenuPosition, setContextMenuPosition] = useState(null);
	const [lastContextMenuPosition, setLastContextMenuPosition] = useState(null);
	const [contextMenuOptions, setContextMenuOptions] = useState([]);
	const [clonedScene, setClonedScene] = useState({ nodes: [], edges: [] });
	const [_updateIteration, setUpdateIteration] = useState(0);
	const [_updateTimeout, setUpdateTimeout] = useState(null);

	const [speed, setSpeed] = useState(5);

	const getHistoryContextMenuOptions = () => {
		const menuOptions = [];
		if (undoStack.length > 0) {
			menuOptions.push({
				icon: "/images/icons/undo.svg",
				title: "Undo",
				onClick: undo,
			});
		}
	
		if (redoStack.length > 0) {
			menuOptions.push({
				icon: "/images/icons/redo.svg",
				title: "Redo",
				onClick: redo,
			});
		}
	
		return [menuOptions];
	};

	const cleanAllNodes = () => {
		setNodes((nodes) =>
			nodes.map((node) => {
				if (node.data && node.data.in) {
					Object.keys(node.data.in).forEach((inName) => {
						node.data.in[inName]._onChange = (newValue) => {
							node.data.in[inName].value = newValue;
							console.log("NEW VALUE", newValue);
							callUpdate();
						};
					});
				}

				if (node.data && node.data.out) {
					Object.keys(node.data.out).forEach((outName) => {
						node.data.out[outName]._onChange = (newValue) => {
							node.data.out[outName].value = newValue;
							callUpdate();
						};
					});
				}

				return node;
			})
		);
	};

	const enableNodeMenu = () => {
		setShowNodeMenu(true);
		setNodeMenuText("");
		setNodes((nodes) => nodes.map((node) => ({ ...node, selected: false })));
		setEdges((edges) => edges.map((edge) => ({ ...edge, selected: false })));
	};

	const enablePasteMenu = () => {
		setShowPasteMenu(true);
	};

	const closeNodeMenu = () => {
		setShowNodeMenu(false);
		setNodeMenuText("");
		setLastContextMenuPosition(null);
	};

	const saveHistorySnapshot = () => {
		setUndoStack((stack) => [...stack, { nodes, edges }]);
		setRedoStack([]);
	};

	const getNodeInputValue = async (nodeId, inputName) => {
		if (!nodeId) {
			return error("Node ID is required to fetch a node's input value");
		}
		if (!inputName) {
			return error("Input Name is required to fetch a node's input value");
		}

		return await nodeInputValue(chat.chatId, nodeId, inputName);
	};

	const _onUpdate = async () => {
		cleanAllNodes();

		const getStartNode = (nodeId) => {
			const edge = edges.find((edge) => edge.target === nodeId && edge.type === "ExecutionEdge");
			if (!edge) return null;

			const sourceNodes = nodes.filter((node) => node.id === edge.source);
			if (sourceNodes.length === 0) return null;

			for (let i = 0; i < sourceNodes.length; i++) {
				const sourceNode = sourceNodes[i];
				if (sourceNode.type === "EventNode") return sourceNode;
				const startNode = getStartNode(sourceNode.id);
				if (startNode) return startNode;
			}

			return null;
		};

		const endNodes = nodes.filter((node) => node.type === "EndNode");
		const processEndNodes = async () => {
			for (const endNode of endNodes) {
				const hasExecutionEdgeInput = edges.some((edge) => edge.target === endNode.id && edge.type === "ExecutionEdge");
				if (!hasExecutionEdgeInput) {
					endNode.data.island = true;
					endNode.data.in = {};
					continue;
				} else {
					endNode.data.island = false;
				}

				const startNode = await getStartNode(endNode.id);
				if (!startNode) {
					error("Failed to find start node for end node", endNode.id);
					continue;
				}

				console.log("START NODE", startNode);

				if (startNode.data.resolve) {
					const resolve = startNode.data.resolve;

					for (const resolveArgName of Object.keys(resolve)) {
						const resolveArg = resolve[resolveArgName];
						const type = resolveArg.type;

						if (type === "in") {
							if (!startNode.data.in || !startNode.data.in[resolveArgName]) {
								error("Start node does not have required input", startNode.id, resolveArgName);
								continue;
							}

							try {
								const addArguments = await getNodeInputValue(startNode.id, resolveArgName);
								if (addArguments) {
									if (!endNode.data.in) endNode.data.in = {};
									Object.keys(addArguments).forEach((key) => {
										endNode.data.in[key] = addArguments[key];
									});
								} else {
									error("Failed to get node input value", startNode.id, resolveArgName);
								}
							} catch (err) {
								error("Error fetching node input value", startNode.id, resolveArgName, err);
							}
						} else {
							if (!endNode.data.in) endNode.data.in = {};
							endNode.data.in[resolveArgName] = resolveArg.value;
						}
					}
				}
			}
		};

		await processEndNodes();

		setNodes((nodes) => {
			const newNodes = nodes.map((node) =>
				node.type === "EndNode" ? endNodes.find((n) => n.id === node.id) || node : node
			);

			groupUpdate(group.groupId, newNodes, edges).then((data) => {
				if (!data || data.message !== "OK") {
					notification("Error", "Failed to save graph", "red");
				} else {
					setGroup((group) => ({
						...group,
						nodes,
						edges,
					}));
				}
				setSaved(true);
			});
			return newNodes;
		});
	};

	useEffect(() => {
		if (_updateIteration === 0) return;
		setSaved(false);
		setSaving(false);
		if (_updateTimeout) clearTimeout(_updateTimeout);

		setTimeout(() => {
			saveHistorySnapshot();
		}, 0);

		setUpdateTimeout(
			setTimeout(() => {
				setSaving(true);
				_onUpdate();
			}, SAVE_TIMEOUT)
		);
	}, [_updateIteration]);

	const closeContextMenu = () => {
		setContextMenuPosition(null);
		clearCopyOutlines();
	};

	const onNewNode = (e, name) => {
		if (!NODE_DICTIONARY[name]) {
			error("Node not found", name);
			return;
		}

		const newNodeTemplate = JSON.parse(JSON.stringify(NODE_DICTIONARY[name]));
		if (!newNodeTemplate) return error("Failed to find node template", name);
		if (!newNodeTemplate.name) return error("Failed to find node template name", name);

		const type = getRawNodeType(newNodeTemplate.type);
		if (!type) return error("Failed to find node template type", name);

		const newNode = {
			name: newNodeTemplate.name,
			type,
			data: newNodeTemplate,
			draggable: true,
			position: reactFlow.project({
				x: lastContextMenuPosition ? lastContextMenuPosition.x : e.clientX,
				y: lastContextMenuPosition ? lastContextMenuPosition.y : e.clientY,
			}),
			id: name + Math.random().toString(36).substring(7),
		};

		// Initialize _connected for all inputs and outputs
		Object.keys(newNode.data.in || {}).forEach((key) => {
			newNode.data.in[key]._connected = false;
		});
		Object.keys(newNode.data.out || {}).forEach((key) => {
			newNode.data.out[key]._connected = false;
		});

		notification("Node spawned", name, "var(--action-color)");
		setNodes((nodes) => [...nodes, newNode]);
		closeContextMenu();
		callUpdate();
	};

	const isValidConnection = (connection) => {
		const sourceNodeId = connection.source;
		const targetNodeId = connection.target;
		if (sourceNodeId === targetNodeId) return false;

		let sourceHandleType = connection.sourceHandle;
		let targetHandleType = connection.targetHandle;

		let sourceHandleName = sourceHandleType.includes(":")
			? sourceHandleType.split(":")[1]
			: false;
		let targetHandleName = targetHandleType.includes(":")
			? targetHandleType.split(":")[1]
			: false;

		if (sourceHandleName) sourceHandleType = sourceHandleType.split(":")[0];
		if (targetHandleName) targetHandleType = targetHandleType.split(":")[0];

		const targetNode = nodes.find((node) => node.id === targetNodeId);
		if (targetNode.data && targetNode.data.in && targetNode.data.in[targetHandleName] && targetNode.data.in[targetHandleName].expandable) {
			const targetHandleSecondaryType = parseSecondaryType(targetHandleType);
			if (!targetHandleSecondaryType) {
				error(`Expandable not allowed with this node type`, `${targetNode.data.name} ${targetHandleType}`);
				return false;
			}

			if (sourceHandleType === targetHandleSecondaryType) {
				return true;
			}
		}

		if (sourceHandleType.startsWith("execution") && targetHandleType.startsWith("execution"))
			return true;

		return sourceHandleType === targetHandleType;
	};

	const onNodeContextMenu = useCallback((event, node) => {
		event.preventDefault();
		setContextMenuPosition({ x: event.clientX, y: event.clientY });
		setLastContextMenuPosition({ x: event.clientX, y: event.clientY });
		setContextMenuOptions(getNodeContextMenuOptions(node));
		setNodes((nodes) =>
			nodes.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, copying: true } } : n))
		);
	}, [nodes, edges]);

	const deleteEdge = (edge) => {
		setEdges((edges) => {
			const newEdges = edges.filter((e) => e.id !== edge.id);
			reactFlow.setEdges(newEdges);
			return newEdges;
		});

		setNodes((nodes) => {
			const sourceNode = nodes.find((node) => node.id === edge.source);
			const targetNode = nodes.find((node) => node.id === edge.target);

			if (sourceNode && targetNode) {
				const sourceHandleName = edge.sourceHandle.split(":")[1];
				const targetHandleName = edge.targetHandle.split(":")[1];

				if (sourceNode.data.out[sourceHandleName]) {
					sourceNode.data.out[sourceHandleName]._connected = false;
				}
				if (targetNode.data.in[targetHandleName]) {
					targetNode.data.in[targetHandleName]._connected = false;
				}
			}

			// replace sourceNode in nodes and targetNode in nodes


			return nodes.map((node) => {
				if(node.id === sourceNode.id) {
					return sourceNode;
				}
				if(node.id === targetNode.id) {
					return targetNode;
				}
				return node;
			});
		});

		callUpdate();
	};

	const deleteNode = (node) => {
		setNodes((nodes) => {
			// Find all edges connected to the node being deleted
			const edgesToDelete = edges.filter((e) => e.source === node.id || e.target === node.id);
	
			// Update the _connected property for each edge
			edgesToDelete.forEach((edge) => {
				const sourceNode = nodes.find((n) => n.id === edge.source);
				const targetNode = nodes.find((n) => n.id === edge.target);
	
				if (sourceNode && targetNode) {
					const sourceHandleName = edge.sourceHandle.split(":")[1];
					const targetHandleName = edge.targetHandle.split(":")[1];
	
					if (sourceNode.data.out[sourceHandleName]) {
						sourceNode.data.out[sourceHandleName]._connected = false;
					}
					if (targetNode.data.in[targetHandleName]) {
						targetNode.data.in[targetHandleName]._connected = false;
					}
				}
			});
	
			// Filter out the node being deleted
			const newNodes = nodes.filter((n) => n.id !== node.id);
	
			// Replace updated source and target nodes in newNodes
			edgesToDelete.forEach((edge) => {
				const sourceNode = nodes.find((n) => n.id === edge.source);
				const targetNode = nodes.find((n) => n.id === edge.target);
	
				if (sourceNode) {
					const index = newNodes.findIndex((n) => n.id === sourceNode.id);
					if (index !== -1) {
						newNodes[index] = sourceNode;
					}
				}
	
				if (targetNode) {
					const index = newNodes.findIndex((n) => n.id === targetNode.id);
					if (index !== -1) {
						newNodes[index] = targetNode;
					}
				}
			});
	
			return newNodes;
		});
	
		setEdges((edges) => edges.filter((e) => e.source !== node.id && e.target !== node.id));
		callUpdate();
	};
	

	const paste = (x = false, y = false) => {
		const POSITION_OFFSET = 50;
		const clonedNodes = clonedScene.nodes;
		const clonedEdges = clonedScene.edges;

		setNodes((nodes) => [
			...nodes,
			...clonedNodes.map((node) => {
				const newNode = JSON.parse(JSON.stringify(node));
				newNode.id = node.id + "_" + Math.random().toString(36).substring(7);
				if (!x && !y) {
					newNode.position.x += POSITION_OFFSET;
					newNode.position.y += POSITION_OFFSET;
				} else {
					newNode.position.x = x;
					newNode.position.y = y;
				}
				newNode.selected = false;
				if (newNode.data) {
					newNode.copying = false;
					newNode.deleting = false;
					newNode.island = false;
				}
				// Initialize _connected for all inputs and outputs
				Object.keys(newNode.data.in || {}).forEach((key) => {
					newNode.data.in[key]._connected = false;
				});
				Object.keys(newNode.data.out || {}).forEach((key) => {
					newNode.data.out[key]._connected = false;
				});
				return newNode;
			}),
		]);

		if (!x && !y) {
			setClonedScene({
				nodes: clonedNodes.map((node) => ({
					...node,
					position: {
						x: node.position.x + POSITION_OFFSET,
						y: node.position.y + POSITION_OFFSET,
					},
				})),
				edges: clonedEdges,
			});
		}
	};

	const handleNodesChange = (changes) => {
		const filteredChanges = changes.filter((change) => {
			if (change.type === "remove") {
				return change.id !== "onUserMessage";
			}
			return true;
		});
		onNodesChange(filteredChanges);
		closeContextMenu();
		callUpdate();
	};

	const handleEdgesChange = (changes) => {
		onEdgesChange(changes);
		callUpdate();
	};

	const callUpdate = async () => {
		setUpdateIteration((prev) => prev + 1);
	};

	const onPaneContextMenu = (event) => {
		clearCopyOutlines();
		event.preventDefault();
		setContextMenuPosition({ x: event.clientX, y: event.clientY });
		setContextMenuOptions(getDefaultContextMenuOptions());
	};

	const getDefaultContextMenuOptions = () => {
		const menuOptions = [
			[
				{
					icon: "/images/icons/magic.svg",
					title: "𝑡ℎ𝑖𝑛𝑔𝑠",
					onClick: enableNodeMenu,
				},
				{
					icon: "/images/icons/nodes.svg",
					title: "Prefabs",
					onClick: enablePasteMenu,
				},
			],
			[
				{
					icon: "/images/icons/simulate.svg",
					title: "Simulate",
					onClick: () => setShowChatMenu(true),
				},
			],
			[
				{
					icon: "/images/icons/copyAll.svg",
					title: "Copy All",
					onClick: () => {
						clearAllEffects();
						const newClonedScene = { nodes, edges };
						setClonedScene(newClonedScene);
						navigator.clipboard.writeText(JSON.stringify(newClonedScene, null, 2));
						notification("Copied", "Graph copied to clipboard", "var(--active-color)");
					},
				}
			]
		];
	
		if (nodes.some((node) => node.selected)) {
			menuOptions.push([
				{
					icon: "/images/icons/copy.svg",
					title: "Copy",
					onClick: () => {
						setClonedScene({
							nodes: nodes.filter((n) => n.selected),
							edges: edges.filter((e) => e.selected),
						});
					},
				},
				{
					icon: "/images/icons/trash.svg",
					title: "Delete",
					onClick: () => {
						nodes.filter((n) => n.selected).forEach((n) => deleteNode(n));
					},
				},
			]);
		}
	
		if (clonedScene.nodes.length > 0) {
			menuOptions.push([
				{
					icon: "/images/icons/clear.svg",
					title: "Clear",
					onClick: () => setClonedScene({ nodes: [], edges: [] }),
				},
				{
					icon: "/images/icons/paste.svg",
					title: "Paste",
					onClick: () => paste(contextMenuPosition.x, contextMenuPosition.y),
				},
			]);
		}
	
		return menuOptions;
	};
	
	

	const getNodeContextMenuOptions = (node) => [
		{
			title: "Delete",
			onClick: () => {
				deleteNode(node);
			},
		},
		{
			title: "Duplicate",
			onClick: () => {
				const newNode = JSON.parse(JSON.stringify(node));
				newNode.id = node.id + Math.random().toString(36).substring(7);
				newNode.position.x += 50;
				newNode.position.y += 50;
				setNodes((nodes) => [...nodes, newNode]);
				closeContextMenu();
			},
		},
		{
			title: "Copy",
			onClick: () => {
				setClonedScene({
					nodes: [node, ...nodes.filter((n) => n.selected)],
					edges: edges.filter((e) => e.selected),
				});
				closeContextMenu();
			},
		},
	];

	const onConnect = useCallback(
		(params) => {
			const sourceType = params.sourceHandle;
			const edgeType = sourceType === "execution" ? "ExecutionEdge" : "DataEdge";

			const newEdge = {
				...params,
				type: edgeType,
				data: { type: sourceType },
			};

			setNodes((nodes) => {
				const sourceNode = nodes.find((node) => node.id === params.source);
				const targetNode = nodes.find((node) => node.id === params.target);

				if (sourceNode && targetNode) {
					const sourceHandleName = params.sourceHandle.split(":")[1];
					const targetHandleName = params.targetHandle.split(":")[1];

					if (sourceNode.data.out[sourceHandleName]) {
						sourceNode.data.out[sourceHandleName]._connected = true;
					}
					if (targetNode.data.in[targetHandleName]) {
						targetNode.data.in[targetHandleName]._connected = true;
					}
				}

				return nodes;
			});

			setEdges((eds) => addEdge(newEdge, eds));
			callUpdate();
		},
		[setEdges]
	);

	const onPaneClick = (e) => {
		closeContextMenu();
		closeNodeMenu();
	};

	const onMove = () => closeContextMenu();

	const clearCopyOutlines = () => {
		setNodes((nodes) =>
			nodes.map((node) => (node.data.copying ? { ...node, data: { ...node.data, copying: false } } : node))
		);
	};

	const clearAllEffects = () => {
		setNodes((nodes) =>
			nodes.map((node) => ({
				...node,
				data: {
					...node.data,
					animate: false,
					animateBackwards: false,
					error: false,
					copying: false,
					selected: false,
				},
			}))
		);
	};

	const redo = () => {
		if (redoStack.length > 0) {
			setRedoStack((prevRedoStack) => {
				const nextSnapshot = prevRedoStack.pop();
				if (!nextSnapshot) {
					notification("No history", "No history to redo", "red");
					return prevRedoStack;
				}
				setUndoStack((prevUndoStack) => [...prevUndoStack, { nodes, edges }]);
				setNodes(nextSnapshot.nodes);
				setEdges(nextSnapshot.edges);
				return prevRedoStack;
			});
		} else {
			notification("No history", "No history to redo", "red");
		}
	};

	const undo = () => {
		if (undoStack.length > 0) {
			setUndoStack((prevUndoStack) => {
				const lastSnapshot = prevUndoStack.pop();
				setRedoStack((prevRedoStack) => [...prevRedoStack, { nodes, edges }]);
				setNodes(lastSnapshot.nodes);
				setEdges(lastSnapshot.edges);
				return prevUndoStack;
			});
		} else {
			notification("No history", "No history to undo", "red");
		}
	};

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.ctrlKey && e.key === "c") {
				const toCopyNodes = nodes.filter((n) => n.selected);
				if (toCopyNodes.length === 0) {
					if (clonedScene.nodes.length > 0) {
						setClonedScene({ nodes: [], edges: [] });
					} else {
						notification("", "Nothing selected to copy", "red");
					}
					return;
				}

				setClonedScene({
					nodes: nodes.filter((n) => n.selected),
					edges: edges.filter((e) => e.selected),
				});

				setNodes((nodes) =>
					nodes.map((node) =>
						node.selected ? { ...node, data: { ...node.data, copying: true } } : node
					)
				);
				notification("", `Copied ${nodes.filter((n) => n.selected).length} nodes`, "var(--action-color)");
			}

			if (e.ctrlKey && e.key === "v") {
				if (clonedScene.nodes.length === 0) {
					notification("", "Nothing to paste", "red");
				} else {
					notification(`Pasted ${clonedScene.nodes.length} nodes`);
					paste();
				}
			}

			if (e.ctrlKey && e.key === "z") {
				undo();
			}

			if (e.ctrlKey && e.key === "y") {
				redo();
			}

			if (e.ctrlKey && e.key === ".") {
				enableNodeMenu();
			}
			if (e.ctrlKey && e.key === ",") {
				closeNodeMenu();
			}

			if (e.key === "Escape") {
				if (showNodeMenu) {
					closeNodeMenu();
				}
				if (showPasteMenu) {
					setShowPasteMenu(false);
				}
				if (showChatMenu) {
					setShowChatMenu(false);
				}
			}
		};

		const handleKeyUp = (e) => {
			if (e.key === "c" || e.key === "v") {
				clearCopyOutlines();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		document.addEventListener("keyup", handleKeyUp);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("keyup", handleKeyUp);
		};
	}, [nodes]);

	const animateError = (nodeOrEdgeId, valueName) => {
		setNodes((nodes) =>
			nodes.map((node) =>
				node.id === nodeOrEdgeId
					? { ...node, data: { ...node.data, error: true, animate: false, animateBackwards: false, errorValue: valueName } }
					: node
			)
		);
		setEdges((edges) =>
			edges.map((edge) =>
				edge.id === nodeOrEdgeId ? { ...edge, data: { ...edge.data, error: true, animate: false, animateBackwards: false } } : edge
			)
		);

		setTimeout(() => {
			setNodes((nodes) =>
				nodes.map((node) =>
					node.id === nodeOrEdgeId ? { ...node, data: { ...node.data, error: false, errorValue: null } } : node
				)
			);
			setEdges((edges) =>
				edges.map((edge) =>
					edge.id === nodeOrEdgeId ? { ...edge, data: { ...edge.data, error: false } } : edge
				)
			);
		}, ERROR_TIMEOUT);
	};

	const setAnimateEdge = (edgeId, doAnimate) => {
		if (!edgeId) {
			setEdges((edges) =>
				edges.map((edge) => ({ ...edge, data: { ...edge.data, animate: false, animateBackwards: false } }))
			);
		} else {
			setEdges((edges) =>
				edges.map((edge) =>
					edge.id === edgeId ? { ...edge, data: { ...edge.data, animate: doAnimate, animateBackwards: false } } : edge
				)
			);
		}
	};

	const animateExecutionBackwards = (nodeId) => {
		setNodes((nodes) =>
			nodes.map((node) =>
				node.id === nodeId ? { ...node, data: { ...node.data, animate: false, animateBackwards: true } } : node
			)
		);
	};

	const animateExecution = (nodeId) => {
		setNodes((nodes) =>
			nodes.map((node) =>
				node.id === nodeId ? { ...node, data: { ...node.data, animate: true, animateBackwards: false } } : node
			)
		);
	};

	const animateEdgeExecutionBackwards = (edgeId) => {
		setEdges((edges) =>
			edges.map((edge) =>
				edge.id === edgeId ? { ...edge, data: { ...edge.data, animateBackwards: true } } : edge
			)
		);
	};

	const animateExecutionEdgeResponse = (edgeId, value) => {
		setEdges((edges) =>
			edges.map((edge) =>
				edge.id === edgeId ? { ...edge, data: { ...edge.data, animate: false, animateBackwards: false, value } } : edge
			)
		);
	};

	const animateExecutionEdge = (edgeId) => {
		setEdges((edges) =>
			edges.map((edge) =>
				edge.id === edgeId ? { ...edge, data: { ...edge.data, animate: true, animateBackwards: false } } : edge
			)
		);
	};

	const animateExecutionResponse = (nodeId, values) => {
		setNodes((nodes) =>
			nodes.map((node) =>
				node.id === nodeId ? { ...node, data: { ...node.data, animate: false, animateBackwards: false, values } } : node
			)
		);
	};

	const resetAllNodeStyles = () => {
		setNodes((nodes) =>
			nodes.map((node) => ({ ...node, data: { ...node.data, animate: false, animateBackwards: false } }))
		);
		setEdges((edges) =>
			edges.map((edge) => ({ ...edge, data: { ...edge.data, animate: false, animateBackwards: false } }))
		);
	};

	useChannel("notifications", "notification", (msg) => {
		const { title, content } = msg.data;
		notification(title, content, "purple");
	});

	useChannel(`flow-${chat.chatId}`, "error", (msg) => {
		const data = msg.data;

		if (data.options) {
			if (data.options.nodeId) animateError(data.options.nodeId, data.options.valueName);
			if (data.options.edgeId) animateError(data.options.edgeId, data.options.valueName);
		}
	});

	useChannel(`flow-${chat.chatId}`, "log", (msg) => {
		const { messages } = msg.data;
		const formattedMessages = messages.map((message) => (typeof message !== "string" ? JSON.stringify(message) : message));
		console.log("[ChatGraph] [Flow Log]", formattedMessages.join("\n"));
	});

	useChannel(`flow-${chat.chatId}`, "start", () => {
		clearAllEffects();
	});

	useChannel(`flow-${chat.chatId}`, "execute", (msg) => {
		const { nodeId } = msg.data;
		animateExecution(nodeId);
	});

	useChannel(`flow-${chat.chatId}`, "execute_backwards", (msg) => {
		const { nodeId } = msg.data;
		animateExecutionBackwards(nodeId);
	});

	useChannel(`flow-${chat.chatId}`, "edge_on", (msg) => {
		const { edgeId } = msg.data;
		setAnimateEdge(edgeId, true);
	});

	useChannel(`flow-${chat.chatId}`, "edge_off", (msg) => {
		const { edgeId } = msg.data;
		setAnimateEdge(edgeId, false);
	});

	useChannel(`flow-${chat.chatId}`, "execute_edge", (msg) => {
		const { edgeId } = msg.data;
		animateExecutionEdge(edgeId);
	});

	useChannel(`flow-${chat.chatId}`, "execute_edge_response", (msg) => {
		const { edgeId, value } = msg.data;
		animateExecutionEdgeResponse(edgeId, value);
	});

	useChannel(`flow-${chat.chatId}`, "execute_edge_backwards", (msg) => {
		const { edgeId } = msg.data;
		animateEdgeExecutionBackwards(edgeId);
	});

	useChannel(`flow-${chat.chatId}`, "finish", (msg) => {
		const { success } = msg.data;

		if (success) {
			notification("", "Flow execution ended successfully", "var(--active-color)");
		} else {
			notification("Flow execution failed", "Flow contained errors", "red");
		}
		resetAllNodeStyles();
	});

	useChannel(`flow-${chat.chatId}`, "execute_response", (msg) => {
		const { nodeId, values } = msg.data;
		animateExecutionResponse(nodeId, values);
	});


	const refresh = async () => {
		await tryRefresh();
		setNodes((prevNodes) => {
			return prevNodes.map((node) => {
				const nodeData = NODE_DICTIONARY[node.name];
				if (!nodeData) {
					error("Node not found", `Node ${node.name} not found after refresh`);
					return node;
				}

				if (nodeData.type) node.type = getRawNodeType(nodeData.type);
				if (!node.data) node.data = {};
				const newData = {
					type: node.type,
					name: node.name,
					...node.data,
				};

				for (const key in nodeData) {
					if (key === "type") continue;
					if (!newData[key]) {
						newData[key] = nodeData[key];
					} else if (typeof newData[key] === "object") {
						newData[key] = {
							...newData[key],
							...nodeData[key],
						};
					} else {
						newData[key] = nodeData[key];
					}
				}

				// Preserve existing _connected and value properties
				const preserveProperties = (source, target) => {
					Object.keys(source).forEach((key) => {
						if (target[key]) {
							if (target[key]._connected !== undefined) {
								source[key]._connected = target[key]._connected;
							}
							if (target[key].value !== undefined) {
								source[key].value = target[key].value;
							}
						}
					});
				};

				// Initialize or preserve properties for inputs
				newData.in = newData.in || {};
				node.data.in = node.data.in || {};
				preserveProperties(newData.in, node.data.in);

				// Initialize or preserve properties for outputs
				newData.out = newData.out || {};
				node.data.out = node.data.out || {};
				preserveProperties(newData.out, node.data.out);

				return {
					...node,
					data: newData,
				};
			});
		});
	}

	const searchCommands = [
		{
			title: "Refresh",
			onClick: async () => {
				await refresh();
			},
		},
	];
	
	

	const nodeSearchResults = nodeMenuText
		? Object.keys(NODE_DICTIONARY).filter((key) => key.toLowerCase().includes(nodeMenuText.toLowerCase()))
		: [];
	const searchCommandResults = nodeMenuText
		? searchCommands.filter((command) => command.title.toLowerCase().includes(nodeMenuText.toLowerCase()))
		: [];
	const searchResults = [...nodeSearchResults, ...searchCommandResults];

	const hasResults = searchResults.length > 0;

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (document.activeElement.tagName === "BODY") {
				if (onEscape) onEscape();
			}
		};

		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	const inputHasFocus = () => {
		return document.activeElement.tagName === "INPUT";
	};

	return (
		<div
			type={type}
			id="chat-graph"
			className={`${styles.ChatGraph} ${className}`}
			onAnimationEnd={onAnimationEnd}
			onKeyDown={(e) => {
				if (inputHasFocus()) return;
				if (e.key === "Backspace" || e.key === "Delete") {
					const selectedNodes = nodes.filter((node) => node.selected);
					if (selectedNodes.length > 0) {
						setNodes((nodes) =>
							nodes.map((node) =>
								node.selected ? { ...node, data: { ...node.data, deleting: true } } : node
							)
						);
					}
				}
			}}
			onKeyUp={(e) => {
				if (inputHasFocus()) return;
				if (e.key === "Backspace" || e.key === "Delete") {
					nodes.filter((n) => n.selected).forEach((n) => deleteNode(n));
					edges.filter((e) => e.selected).forEach((e) => deleteEdge(e));
				}
			}}
		>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={handleNodesChange}
				onEdgesChange={handleEdgesChange}
				onConnect={onConnect}
				onPaneClick={onPaneClick}
				onMove={onMove}
				onPaneContextMenu={onPaneContextMenu}
				onNodeContextMenu={onNodeContextMenu}
				isValidConnection={isValidConnection}
				fitView
				nodeTypes={RawNodeTypes}
				edgeTypes={edgeTypes}
				selectionMode={true}
				panOnDrag={[0, 1]}
				onConnectEnd={(...e) => {}}
				snapToGrid={true}
				zoomOnDoubleClick={false}
				onDoubleClick={(e) => {
					if (isMobile) {
						setContextMenuPosition({ x: e.clientX, y: e.clientY });
						setContextMenuOptions(getDefaultContextMenuOptions());
					}
				}}
				onNodeDoubleClick={(e, node) => {
					if (isMobile) {
						setContextMenuPosition({ x: e.clientX, y: e.clientY });
						setContextMenuOptions(getNodeContextMenuOptions(node));
					}
				}}
			>
				<Controls />
				<Background />
				{showNodeMenu && (
					<MenuContainer onClick={() => closeNodeMenu()}>
						<SearchMenu
							placeholder={`Search for stuff`}
							hasResults={hasResults}
							inputText={nodeMenuText}
							setInputText={setNodeMenuText}
						>
							{hasResults &&
								searchResults.map((result, index) => {
									if (result.title) {
										return (
											<SearchMenuRow
												key={index}
												id={result.title}
												text={`> ${result.title}`}
												subtext={`Command`}
												onClick={(e) => {
													result.onClick(e);
													closeNodeMenu();
												}}
											/>
										);
									}
									return (
										<SearchMenuRow
											key={index}
											id={result}
											text={result}
											subtext={`Node`}
											onClick={(e) => {
												onNewNode(e, result);
												closeNodeMenu();
											}}
										/>
									);
								})}
						</SearchMenu>
					</MenuContainer>
				)}
				{showChatMenu && (
					<MenuContainer onClick={() => setShowChatMenu(false)}>
						<Menu className={`${styles.ChatMenu} animate__animated animate__fadeInDown`}>
							<ChatInput
								allowSend={chatText.length > 0 || chatFiles.length > 0}
								inputText={chatText}
								inputRows={chatRows}
								onChange={(e) => {
									setChatText(e.target.value);
									setChatRows(e.target.value.split("\n").length);
								}}
								onKeyUp={(e) => {
									if (e.key === "Escape") {
										setShowChatMenu(false);
									}
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										if (document.getElementById("send")) {
											document.getElementById("send").click();
										} else {
											notification("Failed to send", "Send button not found", "red");
										}
										e.preventDefault();
									} else if (e.key === "Enter") {
										e.preventDefault();
										document.getElementById("send").click();
									}
								}}
								onSend={() => {
									if (!chat || !chat.chatId) {
										notification("Error", "Chat not found", "red");
									}
									onUserMessage(chat.chatId, {
										role: "user",
										content: chatText,
									}, chatFiles).then((data) => {
										if (!data) {
											notification("Error", "Failed to send message", "red");
										}
									});

									setChatText("");
									setChatRows(1);
									setChatFiles([]);
									setShowChatMenu(false);
								}}
								onFileChange={(e) => {
									if (e.target.files.length > 0) {
										setChatFiles(e.target.files);
									}
								}}
							/>
						</Menu>
					</MenuContainer>
				)}
			</ReactFlow>

			<div
				className={styles.ChatGraph__Header}
				style={{ display: showHeader ? "flex" : "none" }}
			>
				<Button
					text="𝑡ℎ𝑖𝑛𝑔𝑠"
					image={"/images/icons/magic.svg"}
					className={styles.NewNode}
					onClick={() => {
						enableNodeMenu();
						setShowChatMenu(false);
						setChatText("");
						setChatRows(1);
						setChatFiles([]);
					}}
				/>
			</div>

			<div className={styles.ChatGraph__Footer}>
				<SliderButton
					text="Speed"
					minText="Slow"
					maxText="Realtime"
					min={1}
					max={5}
					value={speed}
					onChange={(e) => {
						document.cookie = `THING_KING_PLAYBACK_SPEED=${e.target.value}; path=/; max-age=31536000`;
						setSpeed(e.target.value);
					}}
				/>
				<Button
					text="Simulate"
					image={"/images/icons/chat.png"}
					className={styles.SimulateChat}
					onClick={() => {
						closeNodeMenu();
						setShowChatMenu(true);
						setChatText("");
						setChatRows(1);
						setChatFiles([]);
					}}
				/>
			</div>

			<ContextMenu
				id="context-menu"
				options={[...getDefaultContextMenuOptions(), ...getHistoryContextMenuOptions()]}
				position={contextMenuPosition}
				onClose={closeContextMenu}
				style={{ position: "fixed" }}
			/>

			{children}
		</div>
	);
}
