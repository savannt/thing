import "animate.css";
import styles from "@/app/Chat/ChatGraph/ChatGraph.module.css";
import chatStyles from "@/app/Chat/Chat.module.css";

import { useEffect, useState, useCallback } from "react";

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

import nodeTypes from "@/app/Chat/ChatGraph/Flow/NodeTypes/NodeTypes";
import edgeTypes from "@/app/Chat/ChatGraph/Flow/EdgeTypes/EdgeTypes";
import Button from "@/components/Button/Button";
import SearchMenu, { SearchMenuRow } from "@/components/SearchMenu/SearchMenu";
import ContextMenu from "@/app/Chat/ChatGraph/ContextMenu/ContextMenu";

import SaveIcon from "@/app/Chat/ChatGraph/SaveIcon/SaveIcon";
import SliderButton from "@/components/Button/SliderButton";
import { groupUpdate } from "@/client/group";

import error from "@/client/error";
import notification from "@/client/notification";

import NODE_DICTIONARY from "@/services/flow/NodeDictionary";

import MenuContainer from "@/components/Menu/MenuContainer";
import Menu from "@/components/Menu/Menu";
import ChatInput from "@/app/Chat/ChatInput/ChatInput";
import { chatMessage } from "@/client/chat";
import { useChannel } from "ably/react";
import useMobile from "@/providers/Mobile/useMobile";

export const SAVE_TIMEOUT = 1000;
export const ERROR_TIMEOUT = 15000;

export default function ChatGraph({
	showHeader = true,
	type = "chat-graph",
	chat,
	group,
	enterpriseId,
	className,
	onAnimationEnd,
	onEscape,
	children,
}) {
	const initialNodes = (group.nodes || []).map((node) => {
		if (NODE_DICTIONARY[node.name]) {
			return {
				...node,
				data: {
					...node.data,
					...NODE_DICTIONARY[node.name].data,
					name: node.name,
				},
			};
		} else {
			notification("Node not found in dictionary", node.name, "red");
			return node;
		}
	});

	const initialEdges = group.edges || [];

	useEffect(() => {
		const headerTitle = document.getElementById("header-title");
		const sidebarHeaderTitle = document.getElementById("sidebar-header-title");

		if (headerTitle) {
			headerTitle.innerText = "Flow Graph";
		}
		if (sidebarHeaderTitle) {
			sidebarHeaderTitle.style.visibility = "hidden";
		}
	}, []);

    const reactFlow = useReactFlow();
	const isMobile = useMobile();

	const [nodeMenuText, setNodeMenuText] = useState("");
	const [showNodeMenu, setShowNodeMenu] = useState(false);
	const [showChatMenu, setShowChatMenu] = useState(false);
	const [chatText, setChatText] = useState("");
	const [chatRows, setChatRows] = useState(1);
	const [chatFiles, setChatFiles] = useState([]);
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	const [render, setRender] = useState(false);
	const [contextMenuPosition, setContextMenuPosition] = useState(null);
    const [lastContextMenuPosition, setLastContextMenuPosition] = useState(null);
	const [contextMenuOptions, setContextMenuOptions] = useState([]);
	const [clonedScene, setClonedScene] = useState({ nodes: [], edges: [] });
	const [_saveIteration, setSaveIteration] = useState(0);
	const [saveTimeout, setSaveTimeout] = useState(null);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(true);

    const [speed, setSpeed] = useState(5);

	const enableNodeMenu = () => {
		setShowNodeMenu(true);
		setNodeMenuText("");
		setNodes((nodes) =>
			nodes.map((node) => ({ ...node, selected: false }))
		);
		setEdges((edges) =>
			edges.map((edge) => ({ ...edge, selected: false }))
		);
	};
    
    const closeNodeMenu = () => {
        setShowNodeMenu(false);
        setNodeMenuText("");

        setLastContextMenuPosition(null);
    }

	const save = () => {
		groupUpdate(group.groupId, nodes, edges).then((data) => {
			if (!data || data.message !== "OK") {
				notification("Error", "Failed to save graph", "red");
			}
			setSaved(true);
		});
	};

	useEffect(() => {
		if (_saveIteration === 0) return;
		setSaved(false);
		setSaving(false);
		if (saveTimeout) clearTimeout(saveTimeout);

		setSaveTimeout(
			setTimeout(() => {
				setSaving(true);
				save();
			}, SAVE_TIMEOUT)
		);
	}, [_saveIteration]);

	const closeContextMenu = () => {
		setContextMenuPosition(null);
		clearCopyOutlines();
	};

	const onNewNode = (e, name) => {
		if (!NODE_DICTIONARY[name]) {
			console.error("Node not found:", name);
			error("Node not found:", name);
			return;
		}

		const newNode = JSON.parse(JSON.stringify(NODE_DICTIONARY[name]));
		newNode.draggable = true;

        // get current position

		// newNode.position = {
        //     x: e.clientX,
        //     y: e.clientY
        // };
        // use reactFlow to get the position of the node- if lastContextMenuPosition, use that- otherwise use event
        newNode.position = {
            x: lastContextMenuPosition ? lastContextMenuPosition.x : e.clientX,
            y: lastContextMenuPosition ? lastContextMenuPosition.y : e.clientY
        };
        newNode.position = reactFlow.project({ x: newNode.position.x, y: newNode.position.y });


		newNode.name = name;
		newNode.data.name = name;
		newNode.id = name + Math.random().toString(36).substring(7);

		notification("Node spawned", name, "var(--action-color)");
		setNodes((nodes) => [...nodes, newNode]);
		setSaveIteration((prev) => prev + 1);
		closeContextMenu();
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

		if (
			sourceHandleType.startsWith("execution") &&
			targetHandleType.startsWith("execution")
		)
			return true;

		return sourceHandleType === targetHandleType;
	};

	const onNodeContextMenu = useCallback((event, node) => {
		event.preventDefault();
		setContextMenuPosition({ x: event.clientX, y: event.clientY });
        setLastContextMenuPosition({ x: event.clientX, y: event.clientY });
		setContextMenuOptions([
			{
				title: "Delete",
				onClick: () => {
					deleteNode();
                    deleteEdge();
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
				},
			},
			{
				title: "Copy",
				onClick: () => {
					setClonedScene({
						nodes: [node, ...nodes.filter((n) => n.selected)],
						edges: edges.filter((e) => e.selected),
					});
				},
			},
		]);

		setNodes((nodes) =>
			nodes.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, copying: true } } : n))
		);
	});

    const deleteNode = (node) => {
        if(!node) {
            // call deleteNode for one of each selected node
            nodes.filter((n) => n.selected).forEach((n) => deleteNode(n));
            return;
        }
        setNodes((nodes) => nodes.filter((n) => n.id !== node.id));
        setEdges((edges) => edges.filter((e) => e.source !== node.id && e.target !== node.id));
    }

    const deleteEdge = (edge) => {
        if(!edge) {
            // call deleteEdge for one of each selected edge
            edges.filter((e) => e.selected).forEach((e) => deleteEdge(e));
            return;
        }
        setEdges((edges) => edges.filter((e) => e.id !== edge.id));
    }

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
				}
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
		setSaveIteration((prev) => prev + 1);
	};

	const handleEdgesChange = (changes) => {
		onEdgesChange(changes);
		setSaveIteration((prev) => prev + 1);
	};

	useEffect(() => {
		// setSaveIteration((prev) => prev + 1);
	}, [nodes, edges]);

	const onPaneContextMenu = (event) => {
		clearCopyOutlines();
		event.preventDefault();
		setContextMenuPosition({ x: event.clientX, y: event.clientY });


		setContextMenuOptions(showHeader ? [
			{
				title: "Add Node",
				onClick: enableNodeMenu,
				options: nodeMenu,
			},
			{
				title: "Simulate",
				onClick: () => setShowChatMenu(true),
			},
			{
				title: "Copy All",
				onClick: () => {
					clearAllEffects();
					const newClonedScene = {
						nodes,
						edges,
					};

					setClonedScene(newClonedScene);
					navigator.clipboard.writeText(JSON.stringify(newClonedScene, null, 2));
					notification("Copied", "Graph copied to clipboard", "var(--active-color)");
				},
			},
		] : [
			{
				title: "Add Node",
				onClick: enableNodeMenu,
				options: nodeMenu,
			},
			{
				title: "Copy All",
				onClick: () => {
					clearAllEffects();
					const newClonedScene = {
						nodes,
						edges,
					};

					setClonedScene(newClonedScene);
					navigator.clipboard.writeText(JSON.stringify(newClonedScene, null, 2));
					notification("Copied", "Graph copied to clipboard", "var(--active-color)");
				},
			}
		]);

		let menuOptions = [];
		if (nodes.some((node) => node.selected)) {
			menuOptions.push(
				{
					title: "Copy",
					onClick: () => {
						setClonedScene({
							nodes: nodes.filter((n) => n.selected),
							edges: edges.filter((e) => e.selected),
						});
					},
				},
				{
					title: "Delete",
					onClick: () => {
						deleteNode();
                        deleteEdge();
					},
				}
			);
		}
		if (clonedScene.nodes.length > 0) {
			menuOptions.push(
				{
					title: "Clear",
					onClick: () => setClonedScene({ nodes: [], edges: [] }),
				},
				{
					title: "Paste",
					onClick: () => paste(event.clientX, event.clientY),
				}
			);
		}
		setContextMenuOptions(menuOptions);
	};

	const onConnect = useCallback(
		(params) => {
			const sourceType = params.sourceHandle;
			const edgeType = sourceType === "execution" ? "ExecutionEdge" : "DataEdge";

			const newEdge = {
				...params,
				type: edgeType,
				data: { type: sourceType },
			};
			setEdges((eds) => addEdge(newEdge, eds));
		},
		[setEdges]
	);

	const onPaneClick = (...e) => {
		closeContextMenu();
		if(e) closeNodeMenu();
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
				data: { ...node.data, animate: false, animateBackwards: false, error: false, copying: false, selected: false },
			}))
		);
	}

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

		// Handled in <Chat />
		// notification(data.title, data.message, "red");
	
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

	useChannel(`flow-${chat.chatId}`, "start", (msg) => {
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

		if(success) {
			notification("", "Flow execution ended", "var(--active-color)");
		} else {
			notification("Flow execution failed", "Flow contained errors", "red");
		}
		resetAllNodeStyles();
	});

	useChannel(`flow-${chat.chatId}`, "execute_response", (msg) => {
		const { nodeId, values } = msg.data;
		animateExecutionResponse(nodeId, values);
	});

	const nodeMenu = Object.keys(NODE_DICTIONARY).reduce((acc, key) => {
		const value = NODE_DICTIONARY[key];
		const displayName = value.data.displayName || key;
		const categoryName = value.data.category || key.includes("/") ? key.split("/")[0] : "Uncategorized";

		const category = acc.find((obj) => obj.title === categoryName);
		if (category) {
			category.options.push({
				title: displayName,
				onClick: (e) => onNewNode(e, key),
			});
		} else {
			acc.push({
				title: categoryName,
				options: [
					{
						title: displayName,
						onClick: (e) => onNewNode(e, key),
					},
				],
			});
		}
		return acc;
	}, []);

	const contextMenuDefaultOptions = showHeader ? [
		{
			title: "Add Node",
			onClick: enableNodeMenu,
			options: nodeMenu,
		},
		{
			title: "Simulate",
			onClick: () => setShowChatMenu(true),
		},
		{
			title: "Copy All",
			onClick: () => {
				clearAllEffects();
				const newClonedScene = { nodes, edges };
				setClonedScene(newClonedScene);
				navigator.clipboard.writeText(JSON.stringify(newClonedScene, null, 2));
				notification("Copied", "Graph copied to clipboard", "var(--active-color)");
			},
		},
	] : [
		{
			title: "Add Node",
			onClick: enableNodeMenu,
			options: nodeMenu,
		},
		{
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

	const searchResults = nodeMenuText
		? Object.keys(NODE_DICTIONARY).filter((key) => key.toLowerCase().includes(nodeMenuText.toLowerCase()))
		: [];
	const hasResults = searchResults.length > 0;

	useEffect(() => {
			// on key down if escape call onEscape
		const handleKeyDown = (e) => {
			if(document.activeElement.tagName === "BODY") {
				if (onEscape) onEscape();
			}
		}

		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		}
	}, []);

	return (
		<div
			type={type}
			id="chat-graph"
			className={`${styles.ChatGraph} ${className}`}
			onAnimationEnd={onAnimationEnd}
			onKeyDown={(e) => {
				if (e.key === "Backspace" || e.key === "Delete") {
					const selectedNodes = nodes.filter((node) => node.selected);
					if (selectedNodes.length > 0) {
						setNodes((nodes) =>
							nodes.map((node) =>
								node.selected ? { ...node, data: { ...node.data, deleting: true } } : node
							)
						);
					}
					const selectedEdges = edges.filter((edge) => edge.selected);
					if (selectedEdges.length > 0) {
						setEdges((edges) => edges.filter((edge) => !edge.selected));
					}
				}
			}}
			onKeyUp={(e) => {
				if (e.key === "Backspace" || e.key === "Delete") {
                    deleteNode();
                    deleteEdge();
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
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				selectionMode={true}
				panOnDrag={[0, 1]}
				onConnectEnd={(...e) => {
					console.log("connect end", e);
				}}
				snapToGrid={true}
				zoomOnDoubleClick={false}
				onDoubleClick={(e) => {
					if(isMobile) {
						setContextMenuPosition({ x: e.clientX, y: e.clientY });
						setContextMenuOptions(contextMenuDefaultOptions);
					}
				}}
				onNodeDoubleClick={(e, node) => {
					// open context menu at that position if on mobile
					if(isMobile) {
						setContextMenuPosition({ x: e.clientX, y: e.clientY });
						setContextMenuOptions([
							{
								title: "Delete",
								onClick: () => {
									deleteNode(node);
									deleteEdge();
								}
							},
							{
								title: "Duplicate",
								onClick: () => {
									const newNode = JSON.parse(JSON.stringify(node));
									newNode.id = node.id + Math.random().toString(36).substring(7);
									newNode.position.x += 50;
									newNode.position.y += 50;
									setNodes((nodes) => [...nodes, newNode]);
								}
							},
							{
								title: "Copy",
								onClick: () => {
									setClonedScene({
										nodes: [node, ...nodes.filter((n) => n.selected)],
										edges: edges.filter((e) => e.selected)
									});
								}
							}
						]);
					}
				}}
			>
				<Controls />
				<Background />
				{showNodeMenu && (
					<MenuContainer
						onClick={() => closeNodeMenu()}
					>
						<SearchMenu
							placeholder={`Search for nodes`}
							hasResults={hasResults}
							inputText={nodeMenuText}
							setInputText={setNodeMenuText}
						>
							{hasResults &&
								searchResults.map((key, index) => (
									<SearchMenuRow
										key={index}
										id={key}
										text={key}
										onClick={(e) => {
											onNewNode(e, key);
											closeNodeMenu();
										}}
									/>
								))}
						</SearchMenu>
					</MenuContainer>
				)}
				{showChatMenu && (
					<MenuContainer
						onClick={() => {
							setShowChatMenu(false);
						}}
					>
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
									chatMessage(chat.chatId, enterpriseId, chatText, chatFiles).then((data) => {
										if (!data) {
											notification("Error", "Failed to send message", "red");
										} else {
											notification("", "Message Sent", "var(--action-color)");
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
				<SaveIcon saving={saving} saved={saved} />
			</ReactFlow>

			<div className={styles.ChatGraph__Header} style={{
				display: showHeader ? "flex" : "none"
			}}>
				<Button
					text="Node"
					image={"/images/icons/plus.svg"}
					className={styles.NewNode}
					onClick={() => {
						enableNodeMenu();
						setShowChatMenu(false);
						setChatText("");
						setChatRows(1);
						setChatFiles([]);
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

			<div className={styles.ChatGraph__Footer}>
				<SliderButton
					text="Speed"
					minText="Slow"
					maxText="Realtime"
					min={1}
					max={5}
					value={speed}
					onChange={(e) => {
						// set cookie THING_KING_PLAYBACK_SPEED
						document.cookie = `THING_KING_PLAYBACK_SPEED=${e.target.value}; path=/; max-age=31536000`;
						setSpeed(e.target.value)
					}}
				/>
			</div>


			<ContextMenu
				id="context-menu"
				options={contextMenuOptions}
				defaultOptions={contextMenuDefaultOptions}
				position={contextMenuPosition}
				onClose={closeContextMenu}
				style={{
					position: "fixed"
				}}
			/>

			{children}
		</div>
	);
}
