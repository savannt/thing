import "animate.css"
import styles from "@/app/Chat/ChatGraph/ChatGraph.module.css"
import chatStyles from "@/app/Chat/Chat.module.css"

import { useEffect, useState, useCallback } from "react"

import ReactFlow, { MiniMap, Controls, Background, useEdgesState, useNodesState, addEdge } from 'reactflow';
import 'reactflow/dist/style.css';

import nodeTypes from "@/app/Chat/ChatGraph/Flow/NodeTypes/NodeTypes";
import edgeTypes from "@/app/Chat/ChatGraph/Flow/EdgeTypes/EdgeTypes";
import Button from "@/components/Button/Button";
import SearchMenu, { SearchMenuRow } from "@/components/SearchMenu/SearchMenu";
import ContextMenu from "@/app/Chat/ChatGraph/ContextMenu/ContextMenu";

import SaveIcon from "@/app/Chat/ChatGraph/SaveIcon/SaveIcon";

import { groupUpdate } from "@/client/group";

import error from "@/client/error";
import notification from "@/client/notification";



import NODE_DICTIONARY from "@/services/flow/NodeDictionary";

import MenuContainer from "@/components/Menu/MenuContainer";
import Menu from "@/components/Menu/Menu";
import ChatInput from "@/app/Chat/ChatInput/ChatInput";
import { chatMessage } from "@/client/chat";
import { useChannel } from "ably/react";



export const SAVE_TIMEOUT = 1000;
export const ERROR_TIMEOUT = 5000;

/*

StringConstant
NumberConstant



OnUserMessage


SaveMessage
* do push

array/combine
* arrayA<Array<>>
* arrayB<Array<>>

array/splice
* array<Array<>>
* start<number>
* deleteCount<number>

array/length
* array<Array<>>
* length<number>

openai/Tools
* array of tool

openai/Tool/createFromJsFn
* jsFunction
* properties
* required

openai/Tool/createFromJsFunction
* name
* description
* jsFunction
* properties
* required

openai/ChatCompletions/createTools
* messages
* tools
* toolChoice

openai/ChatCompletions/createJsomFromSchema
* schema
* input
* examples

openai/ChatCompletions/createJson
* messages

openai/ChatCompletions/create
* messages

*/

export default function ChatGraph ({ chat, group, enterpriseId, className, onAnimationEnd, children }) {
    let initialNodes = group.nodes || [];
    let initialEdges = group.edges || [];

    // update nodes data with data from NODE_DICTIONARY
    initialNodes = initialNodes.map(node => {
        if(NODE_DICTIONARY[node.name]) {
            return {
                ...node,
                data: {
                    ...node.data,
                    ...NODE_DICTIONARY[node.name].data,

                    name: node.name,
                }
            }
        } else {
            notification("Node not found in dictionary", node.name, "red");
        }
    });
    
    
    useEffect(() => {
        if(document.getElementById("header-title")) {
            document.getElementById("header-title").innerText = "Flow Graph";
        }
        if(document.getElementById("sidebar-header-title")) {
            document.getElementById("sidebar-header-title").style.visibility = "hidden";
        }
    }, []);
    
    const [nodeMenuText, setNodeMenuText] = useState("");
    const [showNodeMenu, setShowNodeMenu] = useState(false);
    const enableNodeMenu = () => {
        setShowNodeMenu(true);
        setNodeMenuText("");
        // unselect any selected nodes or edges
        setNodes((nodes) => {
            return nodes.map(node => {
                node.selected = false;
                return node;
            });
        });
        setEdges((edges) => {
            return edges.map(edge => {
                edge.selected = false;
                return edge;
            });
        });
    }

    const [showChatMenu, setShowChatMenu] = useState(false);
    const [chatText, setChatText] = useState("");
    const [chatRows, setChatRows] = useState(1);
    const [chatFiles, setChatFiles] = useState([]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
    const onNewNode = (e, name) => {
        if(!NODE_DICTIONARY[name]) {
            console.error("Node not found:", name);
            error("Node not found:", name);
            return;
        }

        const newNode = JSON.parse(JSON.stringify(NODE_DICTIONARY[name]));
        newNode.draggable = true;

        newNode.position = {}
        newNode.position.x = e.clientX;
        newNode.position.y = e.clientY;
        newNode.name = name;
        newNode.data.name = name;
        newNode.id = name + Math.random().toString(36).substring(7);

        notification("Node spawned", name, "var(--action-color)");
        console.log("Spawned new node", newNode, "at", e.clientX, e.clientY, "with name", name, "and id", newNode.id, "and data", newNode.data);

        setNodes((nodes) => [...nodes, newNode]);
        setSaveIteration((prev) => prev + 1);
        closeContextMenu();
    }

    const isValidConnection = (connection) => {
        const sourceNodeId = connection.source;
        const targetNodeId = connection.target;
        if(sourceNodeId === targetNodeId) return false;

        let sourceHandleType = connection.sourceHandle;
        let targetHandleType = connection.targetHandle;

        let sourceHandleName = sourceHandleType.includes(":") ? sourceHandleType.split(":")[1] : false;
        let targetHandleName = targetHandleType.includes(":") ? targetHandleType.split(":")[1] : false;

        if(sourceHandleName) sourceHandleType = sourceHandleType.split(":")[0];
        if(targetHandleName) targetHandleType = targetHandleType.split(":")[0];

        // if sourceHandleStart && targetHandleType both start with "execution"
        if(sourceHandleType.startsWith("execution") && targetHandleType.startsWith("execution")) return true;

        
        return sourceHandleType === targetHandleType;
    }

    const onNodeContextMenu = useCallback((event, node) => {
        event.preventDefault();
        setContextMenuPosition({ x: event.clientX, y: event.clientY });
        setContextMenuOptions([{
            title: "Delete",
            onClick: () => {
                setNodes((nodes) => {
                    return nodes.filter(n => n.id !== node.id);
                });
            }
        }, {
            title: "Duplicate",
            onClick: () => {
                const newNode = JSON.parse(JSON.stringify(node));
                newNode.id = node.id + Math.random().toString(36).substring(7);
                newNode.position.x += 50;
                newNode.position.y += 50;
                setNodes((nodes) => [...nodes, newNode]);
            }
        }, {
            title: "Copy",
            onClick: () => {
                // this node and any selected nodes
                setClonedScene({
                    nodes: [node, ...nodes.filter(n => n.selected)],
                    edges: edges.filter(e => e.selected)
                });
            }
        }])

        // set node to have "copying" boolean
        setNodes((nodes) => {
            return nodes.map(n => {
                if(n.id === node.id) {
                    n.data = {
                        ...n.data,
                        copying: true
                    }
                }
                return n;
            });
        });
    });

    const [render, setRender] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState(null);
    const [contextMenuOptions, setContextMenuOptions] = useState([]);

    const [clonedScene, setClonedScene] = useState({ nodes: [], edges: []});

    const [_saveIteration, setSaveIteration] = useState(0);
    const [saveTimeout, setSaveTimeout] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(true);

    const save = () => {
        groupUpdate(group.groupId, nodes, edges).then((data) => {
            if(!data || data.message !== "OK") {
                notification("Error", "Failed to save graph", "red");
            } else {
                // notification("Saved", "Graph saved successfully", "var(--action-color)");
            }
            setSaved(true);
        });
    }

    useEffect(() => {
        if(_saveIteration === 0) return;
        setSaved(false);
        setSaving(false);
        if(saveTimeout) clearTimeout(saveTimeout);

        setSaveTimeout(setTimeout(() => {
            setSaving(true);
            save();
        }, SAVE_TIMEOUT));

    }, [_saveIteration]);

    const closeContextMenu = () => {
        setContextMenuPosition(null);
        clearCopyOutlines();
    }

    const nodeMenu = [];
    for(const key in NODE_DICTIONARY) {
        const name = key;
        const value = NODE_DICTIONARY[key];
        const displayName = value.data.displayName || name;

        
        const categoryName = value.data.category || key.includes("/") ? key.split("/")[0] : "Uncategorized";

        // if there is no object in nodeMenu with title key === name, create one
        if(!nodeMenu.find(obj => obj.title === categoryName)) {
            nodeMenu.push({
                title: categoryName,
                options: []
            });
        }

        // find the object in nodeMenu with title key === name
        const category = nodeMenu.find(obj => obj.title === categoryName);
        
        // add the new node to the category
        category.options.push({
            title: displayName,
            onClick: (e) => {
                onNewNode(e, name);
            }
        });
    }

    const [contextMenuDefaultOptions, setContextMenuDefaultOptions] = useState([{
        title: "Add Node",
        onClick: () => {
            enableNodeMenu();
        },
        options: nodeMenu
    }, {
        title: "Simulate",
        onClick: () => {
            setShowChatMenu(true);
        }
    }, {
        title: "Copy All",
        onClick: () => {
            const newClonedScene = {
                nodes: nodes,
                edges: edges
            };

            setClonedScene(newClonedScene);

            // copy JSON stringified clonedScene to clipboard
            navigator.clipboard.writeText(JSON.stringify(newClonedScene, null, 2));
            notification("Copied", "Graph copied to clipboard", "var(--active-color)");
        }
    }]);


    const paste = (x = false, y = false) => {
        const POSITION_OFFSET = 50;

        const clonedNodes = clonedScene.nodes;
        const clonedEdges = clonedScene.edges;

        setNodes((nodes) => {
            return [...nodes, ...clonedNodes.map(node => {
                const newNode = JSON.parse(JSON.stringify(node));
                newNode.id = node.id + "_" + Math.random().toString(36).substring(7);
                if(!x && !y) {
                    // update position of cloned nodes by this offset as well
                    newNode.position.x += POSITION_OFFSET;
                    newNode.position.y += POSITION_OFFSET;
                } else {
                    newNode.position.x = x;
                    newNode.position.y = y;
                }
                newNode.selected = false;
                if(newNode.data) {
                    newNode.copying = false;
                    newNode.deleting = false;
                }
                return newNode;
            })];
        });

        if(!x && !y) {
            setClonedScene({
                nodes: clonedNodes.map(node => {
                    node.position.x += POSITION_OFFSET;
                    node.position.y += POSITION_OFFSET;
                    return node;
                })
            });
        }
    }

    const onPaneContextMenu = (event) => {
        clearCopyOutlines();
        event.preventDefault();
        console.log("pane context menu", event.clientX, event.clientY);
        setContextMenuPosition({ x: event.clientX, y: event.clientY });

        setContextMenuDefaultOptions([{
            title: "Add Node",
            onClick: () => {
                enableNodeMenu();
            },
            options: nodeMenu
        }, {
            title: "Simulate",
            onClick: () => {
                setShowChatMenu(true);
            }
        }, {
            title: "Copy All",
            onClick: () => {
                const newClonedScene = {
                    nodes: nodes,
                    edges: edges
                };
    
                setClonedScene(newClonedScene);
    
                // copy JSON stringified clonedScene to clipboard
                navigator.clipboard.writeText(JSON.stringify(newClonedScene, null, 2));
                notification("Copied", "Graph copied to clipboard", "var(--active-color)");
            }
        }]);

        let menuOptions = [];
        // if any selected allow Copy and Delete
        if(nodes.filter(node => node.selected).length > 0) {
            menuOptions.push({
                title: "Copy",
                onClick: () => {
                    setClonedScene({
                        nodes: nodes.filter(n => n.selected),
                        edges: edges.filter(e => e.selected)
                    });
                }
            });
            menuOptions.push({
                title: "Delete",
                onClick: () => {
                    setNodes((nodes) => {
                        return nodes.filter(n => !n.selected);
                    });
                }
            });
        }
        // if we have anything in the clipboard allow Paste
        if(clonedScene.nodes.length > 0) {
            menuOptions.push({
                title: "Clear",
                onClick: () => {
                    setClonedScene({ nodes: [], edges: [] });
                }
            });
            menuOptions.push({
                title: "Paste",
                onClick: () => {
                    paste(event.clientX, event.clientY);
                }
            });
        }
        setContextMenuOptions(menuOptions);
      };

    const onConnect = useCallback((params) => {
        const sourceNodeId = params.source;
        const targetNodeId = params.target;

        const sourceType = params.sourceHandle;
        const targetType = params.targetHandle;

        console.log("onConnect", params);


        const edgeType = sourceType === "execution" ? "ExecutionEdge" : "DataEdge";

        const newEdge = {
            ...params,

            type: edgeType,
            data: {
                type: sourceType
            }
        }
        setEdges((eds) => addEdge(newEdge, eds)), []
    }, [setEdges]);
  
    const handleNodesChange = (changes) => {
        const filteredChanges = changes.filter(change => {
            if (change.type === "remove") {
                return change.id !== "onUserMessage"; // Prevent removal of onUserMessage node
            }
            return true;
        });
        onNodesChange(filteredChanges);
        setSaveIteration((prev) => prev + 1);
    };

    const handleEdgesChange = (changes) => {
        onEdgesChange(changes);
        setSaveIteration((prev) => prev + 1);
    }

    const onPaneClick = (...e) => {
        console.log("pane click", e);
        closeContextMenu();
        if(e) setShowNodeMenu(false);
    }

    const onMove = () => {
        closeContextMenu();
        // setShowNodeMenu(false);
    }


    const clearCopyOutlines = () => {
        // remove any copying true from nodes
        setNodes((nodes) => {
            return nodes.map(node => {
                if(node.data.copying) {
                    node.data = {
                        ...node.data,
                        copying: false
                    }
                }
                return node;
            });
        });
    }

    // search dictionary for any key that includes nodeMenuText
    const results = nodeMenuText && nodeMenuText.length > 0 ? Object.keys(NODE_DICTIONARY).filter(key => key.toLowerCase().includes(nodeMenuText.toLowerCase())) : [];
    const hasResults = results.length > 0;

    // listen for ctrl + c and ctrl + v
    useEffect(() => {
        const handleKeyDown = (e) => {
            // if ctrl c
            if(e.ctrlKey && e.key === "c") {
                const toCopyNodes = nodes.filter(n => n.selected);
                if(toCopyNodes.length === 0) {
                    if(clonedScene.nodes.length > 0) {
                        setClonedScene({ nodes: [], edges: [] });
                    } else {
                        notification("", "Nothing selected to copy", "red");
                    }
                    return;
                }

                console.log("Saving", nodes.filter(n => n.selected));
                // this node and any selected nodes
                setClonedScene({
                    nodes: nodes.filter(n => n.selected),
                    edges: edges.filter(e => e.selected)
                });

                // set selected nodes data.copying true
                setNodes((nodes) => {
                    return nodes.map(node => {
                        if(node.selected) {
                            node.data = {
                                ...node.data,
                                copying: true
                            }
                        }
                        return node;
                    });
                });
                notification("", `Copied ${nodes.filter(n => n.selected).length} nodes`, "var(--action-color)");
            }

            // if ctrl v
            if(e.ctrlKey && e.key === "v") {
                if(clonedScene.nodes.length === 0) {
                    notification("", "Nothing to paste", "red");
                } else {
                    notification(`Pasted ${clonedScene.nodes.length} nodes`);
                    paste();
                }
            }
        }
        const handleKeyUp = (e) => {
            if(e.key === "c" || e.key === "v") {
                clearCopyOutlines();
            }
        }
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("keyup", handleKeyUp);
        }
    }, [nodes]);

    const animateError = (nodeOrEdgeId, valueName) => {
        // set "error" boolean to true on data
        setNodes((nodes) => {
            return nodes.map(node => {
                if(node.id === nodeOrEdgeId) {
                    node.data = {
                        ...node.data,
                        error: true,
                    }
                    if(valueName) node.data.errorValue = valueName;
                }
                return node;
            });
        });
        setEdges((edges) => {
            return edges.map(edge => {
                if(edge.id === nodeOrEdgeId) {
                    edge.data = {
                        ...edge.data,
                        error: true
                    }
                }
                return edge;
            });
        });
        
        setTimeout(() => {
            // set "error" boolean to false on data
            setNodes((nodes) => {
                return nodes.map(node => {
                    if(node.id === nodeOrEdgeId) {
                        node.data = {
                            ...node.data,
                            error: false,
                            errorValue: null
                        }
                    }
                    return node;
                });
            });
            setEdges((edges) => {
                return edges.map(edge => {
                    if(edge.id === nodeOrEdgeId) {
                        edge.data = {
                            ...edge.data,
                            error: false
                        }
                    }
                    return edge;
                });
            });
        }, ERROR_TIMEOUT);
    }

    const setAnimateEdge = (edgeId, doAnimate) => {
        if(!edgeId) {
            // unanimate all edges
            setEdges((edges) => {
                return edges.map(edge => {
                    edge.data = {
                        ...edge.data,
                        animate: false
                    }
                    return edge;
                });
            });
        } else {
            setEdges((edges) => {
                return edges.map(edge => {
                    if(edge.id === edgeId) {
                        edge.data = {
                            ...edge.data,
                            animate: doAnimate
                        }
                    }
                    return edge;
                });
            });
        }
    }

    const animateExecution = (nodeId) => {
        const TIMEOUT = 1000;

        // add data.animate = true
        setNodes((nodes) => {
            return nodes.map(node => {
                if(node.id === nodeId) {
                    node.data = {
                        ...node.data,
                        animate: true
                    }
                }
                return node;
            });
        });

        setTimeout(() => {
            // remove data.animate = true
            setNodes((nodes) => {
                return nodes.map(node => {
                    if(node.id === nodeId) {
                        node.data = {
                            ...node.data,
                            animate: false
                        }
                    }
                    return node;
                });
            });
        }, TIMEOUT);
    }

    const animateExecutionEdge = (edgeId) => {
        const TIMEOUT = 1000;

        // add data.animate = true
        setEdges((edges) => {
            return edges.map(edge => {
                if(edge.id === edgeId) {
                    edge.data = {
                        ...edge.data,
                        animate: true
                    }
                }
                return edge;
            });
        });

        setTimeout(() => {
            // remove data.animate = true
            setEdges((edges) => {
                return edges.map(edge => {
                    if(edge.id === edgeId) {
                        edge.data = {
                            ...edge.data,
                            animate: false
                        }
                    }
                    return edge;
                });
            });
        }, TIMEOUT);
    }

    const animateExecutionResponse = (nodeId, values) => {
        // TODO: Here
    }

    useChannel(`flow-${chat.chatId}`, "error", (msg) => {
        const data = msg.data;
        notification(data.title, data.message, "red");

        if(data.options) {
            if(data.options.nodeId) animateError(data.options.nodeId, data.options.valueName);
            if(data.options.edgeId) animateError(data.options.edgeId, data.options.valueName);
        }
    });

    useChannel("notifications", "notification", (msg) => {
        const { title, content } = msg.data;

        notification(title, content, "purple");
    });

    useChannel(`flow-${chat.chatId}`, "log", (msg) => {
        const { messages } = msg.data;
        
        // remove any objects from messages


        const foramttedMessages = messages.map(message => {
            // TODO: Enforce only strings
            if(typeof message !== "string") return;

            return typeof message !== "string" ? JSON.stringify(message) : message;
        });

        notification("Log", foramttedMessages.join("\n"), "yellow");
    });

    useChannel(`flow-${chat.chatId}`, "execute", (msg) => {
        const { nodeId } = msg.data;

        animateExecution(nodeId);
    });

    useChannel(`flow-${chat.chatId}`, "edge_on", (msg) => {
        const { edgeId } = msg.data;

        setAnimateEdge(edgeId, true);
    })

    useChannel(`flow-${chat.chatId}`, "edge_off", (msg) => {
        const { edgeId } = msg.data;
        
        setAnimateEdge(edgeId, false);
    });

    useChannel(`flow-${chat.chatId}`, "execute_edge", (msg) => {
        const { edgeId } = msg.data;

        animateExecutionEdge(edgeId);
    });

    useChannel(`flow-${chat.chatId}`, "finish", (msg) => {
        setAnimateEdge(false, false);
        notification("", "Flow execution finished", "var(--active-color)");
    });

    useChannel(`flow-${chat.chatId}`, "execute_response", (msg) => {
        const { nodeId, values } = msg.data;

        animateExecutionResponse(nodeId, values);
    });


    return (
        <div id="chat-graph" className={`${styles.ChatGraph} ${className}`} onAnimationEnd={onAnimationEnd} onKeyDown={(e) => {
            // if key is backspace or delete
            if(e.key === "Backspace" || e.key === "Delete") {
                const selectedNodes = nodes.filter(node => node.selected);
                if(selectedNodes.length > 0) {
                    // make selected nodes have "deleting" boolean
                    setNodes((nodes) => {
                        return nodes.map(node => {
                            if(node.selected) {
                                node.data = {
                                    ...node.data,
                                    deleting: true
                                }
                            }
                            return node;
                        });
                        // do the above, but also add a single junk object
                    });
                }

                // get selected edges
                const selectedEdges = edges.filter(edge => edge.selected);
                if(selectedEdges.length > 0) {
                    // remove selected edges
                    setEdges((edges) => {
                        return edges.filter(edge => !edge.selected);
                    });
                }
            }
        }} onKeyUp={(e) => {
            // if key is backspace or delete
            if(e.key === "Backspace" || e.key === "Delete") {
                const selectedNodes = nodes.filter(node => node.selected || node.data.deleting);
                if(selectedNodes.length > 0) {
                    // remove selected nodes
                    setNodes((nodes) => {
                        return nodes.filter(node => !node.selected);
                    });
                }
                setSaveIteration((prev) => prev + 1);
            }
        }} >
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
                onEdgeUpdate={(oldEdge, newConnection) => {
                    setSaveIteration((prev) => prev + 1);
                }}
                fitView
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                selectionMode={true}
                // selectionOnDrag={true}
                // selectionKeyCode={null}
                panOnDrag={[0, 1]}

                // catch when we drag a handle but dont make a connection
                onConnectEnd={(...e) => {
                    console.log("connect end", e);
                    // setShowNodeMenu(true);
                }}
            >
                {/* <MiniMap /> */}
                <Controls />
                <Background />
                {
                    showNodeMenu && <MenuContainer onClick={() => {
                        setShowNodeMenu(false);
                    }}>
                        <SearchMenu placeholder={`Search for nodes`} hasResults={hasResults} inputText={nodeMenuText} setInputText={setNodeMenuText} >
                            {
                                hasResults && results.map((key, index) => {
                                    return <SearchMenuRow key={index} id={key} text={key} onClick={(e) => {
                                        onNewNode(e, key);
                                        setShowNodeMenu(false);
                                    }} />
                                })
                            }
                        </SearchMenu>
                    </MenuContainer>
                }
                {
                    showChatMenu && <MenuContainer onClick={() => {
                        setShowChatMenu(false);
                    }}>
                        <Menu className={`${styles.ChatMenu} animate__animated animate__fadeInDown`}>
                            <ChatInput allowSend={(chatText && chatText.length > 0) || chatFiles && chatFiles.length > 0} inputText={chatText} inputRows={chatRows} onChange={(e) => {
                                setChatText(e.target.value);
                                setChatRows(e.target.value.split("\n").length);
                            }} onKeyUp={(e) => {
                                // if key is escpae, close
                                if(e.key === "Escape") {
                                    setShowChatMenu(false);
                                }
                            }} onKeyDown={(e) => {
                                // if key is enter without holding shift, send
                                if(e.key === "Enter" && !e.shiftKey) {
                                    // send
                                    setShowChatMenu(false);
                                    e.preventDefault();
                                    return;
                                } else if(e.key === "Enter") {
                                    // press send
                                    e.preventDefault();
                                    document.getElementById("send").click();
                                }
                            }} onSend={() => {
                                if(!chat || !chat.chatId) {
                                    notification("Error", "Chat not found", "red");
                                }
                                chatMessage(chat.chatId, enterpriseId, chatText, chatFiles).then((data) => {
                                    if(!data) {
                                        notification("Error", "Failed to send message", "red");
                                    } else {
                                        notification("", "Message Sent", "var(--action-color)");
                                    }
                                });

                                setChatText("");
                                setChatRows(1);
                                setChatFiles([]);
                                setShowChatMenu(false);
                            }} onFileChange={(e) => {
                                if (e.target.files.length > 0) {
                                    setChatFiles(e.target.files);
                                }
                            }} />
                        </Menu>
                    </MenuContainer>
                }
                <SaveIcon saving={saving} saved={saved} />
            </ReactFlow>

            
            <div className={styles.ChatGraph__Header}>
                <Button text="Node" image={"/images/icons/plus.svg"} className={styles.NewNode} onClick={() => {
                    enableNodeMenu();

                    setShowChatMenu(false);
                    setChatText("");
                    setChatRows(1);
                    setChatFiles([]);
                }} />
                <Button text="Simulate" image={"/images/icons/chat.png"} className={styles.SimulateChat} onClick={() => {
                    setShowNodeMenu(false);
                    setShowChatMenu(true);
                    setChatText("");
                    setChatRows(1);
                    setChatFiles([]);
                }} />
            </div>

            <p>{JSON.stringify(contextMenuPosition || "none") || "none"}</p>
            <ContextMenu id="context-menu" options={contextMenuOptions} defaultOptions={contextMenuDefaultOptions} position={contextMenuPosition} onClose={() => {
                closeContextMenu();
            }} />

            { children }
        </div>
    )
}