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


import error from "@/client/error";
import notification from "@/client/notification";

const SAVE_TIMEOUT = 1000;

const NODE_DICTIONARY = {
    "StringConstant": {
        type: "ConstantNode",
        data: {
            displayName: "String Constant",
            category: "Constant",

            out: {
                value: {
                    type: "string",
                    description: "String value",
                    constant: true
                }
            }
        },
    },
    "NumberConstant": {
        type: "ConstantNode",
        data: {
            displayName: "Number Constant",
            category: "Constant",

            out: {
                value: {
                    type: "number",
                    description: "Number value",
                    constant: true
                }
            }
        },
    },
    "TextareaStringConstant": {
        type: "ConstantNode",
        data: {
            displayName: "Textarea String Constant",
            category: "Constant",

            out: {
                value: {
                    type: "string",
                    description: "String value",
                    constant: true
                },
            }
        },
    },
    "SaveMessage": {
        type: "FunctionNode",
        data: {
            displayName: "Save Message",
            category: "Function",

            label: "Save Message",
            details: "function",

            in: {
                message: {
                    type: "message",
                    description: "Message to save"
                }
            }
        },
    },
    "OnUserMessage": {
        type: "EventNode",
        data: {
            displayName: "On User Message",
            category: "Event",

            label: "onUserMessage",
            details: "event",

            out: {
                message: {
                    type: "message",
                    description: "User message"
                },
                attachments: {
                    type: "array",
                    description: "Attachments"
                }
            }

        }
    },
    "Array/Combine": {
        type: "LogicNode",
        data: {
            displayName: "Combine",
            category: "Array",

            label: "Combine",
            details: "array/combine",

            in: {
                arrayA: {
                    type: "array",
                    description: "First array"
                },
                arrayB: {
                    type: "array",
                    description: "Second array"
                }
            },
            out: {
                combined: {
                    type: "array",
                    description: "Combined array"
                }
            }
        }
    },
    "Array/Push": {
        type: "FunctionNode",
        data: {
            displayName: "Push",
            category: "Array",

            label: "Push",
            details: "array/push",

            in: {
                array: {
                    type: "array",
                    description: "Array to push to"
                },
                value: {
                    type: "any",
                    description: "Value to push"
                }
            },
            out: {
                array: {
                    type: "array",
                    description: "Array after push"
                }
            },
        }
    },
    "Array/Splice": {
        type: "FunctionNode",
        data: {
            displayName: "Splice",
            category: "Array",

            label: "Splice",
            details: "array/splice",

            in: {
                array: {
                    type: "array",
                    description: "Array to splice"
                },
                start: {
                    type: "number",
                    description: "Index to start at"
                },
                deleteCount: {
                    type: "number",
                    description: "Number of items to delete"
                },
                items: {
                    type: "array",
                    description: "Items to insert",
                    required: false
                }
            },
            out: {
                array: {
                    type: "array",
                    description: "Array after splice"
                }
            }
        }
    },
    "Array/Length": {
        type: "LogicNode",
        data: {
            displayName: "Length",
            category: "Array",
            label: "Length",
            details: "array/length",
            in: {
                array: {
                    type: "array",
                    description: "Array to get length of"
                }
            },
            out: {
                length: {
                    type: "number",
                    description: "Length of array"
                }
            }
        }
    },
    "Array/Filter": {
        type: "FunctionNode",
        data: {
            displayName: "Filter",
            category: "Array",
            label: "Filter",
            details: "array/filter",
            in: {
                array: {
                    type: "array",
                    description: "Array to filter"
                },
                condition: {
                    type: "function",
                    description: "Condition to filter by"
                }
            },
            out: {
                array: {
                    type: "array",
                    description: "Filtered array"
                }
            }
        }
    },
    "Array/Map": {
        type: "FunctionNode",
        data: {
            displayName: "Map",
            category: "Array",
            label: "Map",
            details: "array/map",
            in: {
                array: {
                    type: "array",
                    description: "Array to map"
                },
                transformation: {
                    type: "function",
                    description: "Transformation function"
                }
            },
            out: {
                array: {
                    type: "array",
                    description: "Transformed array"
                }
            }
        }
    },
    "Math/Add": {
        type: "LogicNode",
        data: {
            displayName: "Add",
            category: "Math",
            label: "Add",
            details: "math/add",
            in: {
                a: {
                    type: "number",
                    description: "First number"
                },
                b: {
                    type: "number",
                    description: "Second number"
                }
            },
            out: {
                result: {
                    type: "number",
                    description: "Sum of numbers"
                }
            }
        }
    },
    "Math/Subtract": {
        type: "LogicNode",
        data: {
            displayName: "Subtract",
            category: "Math",
            label: "Subtract",
            details: "math/subtract",
            in: {
                a: {
                    type: "number",
                    description: "First number"
                },
                b: {
                    type: "number",
                    description: "Second number"
                }
            },
            out: {
                result: {
                    type: "number",
                    description: "Difference of numbers"
                }
            }
        }
    },
    "Math/Multiply": {
        type: "LogicNode",
        data: {
            displayName: "Multiply",
            category: "Math",
            label: "Multiply",
            details: "math/multiply",
            in: {
                a: {
                    type: "number",
                    description: "First number"
                },
                b: {
                    type: "number",
                    description: "Second number"
                }
            },
            out: {
                result: {
                    type: "number",
                    description: "Product of numbers"
                }
            }
        }
    },
    "Math/Divide": {
        type: "LogicNode",
        data: {
            displayName: "Divide",
            category: "Math",
            label: "Divide",
            details: "math/divide",
            in: {
                a: {
                    type: "number",
                    description: "Dividend"
                },
                b: {
                    type: "number",
                    description: "Divisor"
                }
            },
            out: {
                result: {
                    type: "number",
                    description: "Quotient of numbers"
                }
            }
        }
    },
    "JSON/Parse": {
        type: "FunctionNode",
        data: {
            displayName: "Parse",
            category: "JSON",
            label: "Parse",
            details: "json/parse",
            in: {
                jsonString: {
                    type: "string",
                    description: "JSON string to parse"
                }
            },
            out: {
                object: {
                    type: "object",
                    description: "Parsed JSON object"
                }
            }
        }
    },
    "JSON/Stringify": {
        type: "FunctionNode",
        data: {
            displayName: "Stringify",
            category: "JSON",
            label: "Stringify",
            details: "json/stringify",
            in: {
                object: {
                    type: "object",
                    description: "Object to stringify"
                }
            },
            out: {
                jsonString: {
                    type: "string",
                    description: "Stringified JSON"
                }
            }
        }
    },
}

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

const initialNodes = [];
  
  const initialEdges = [
    // Define edges here if needed
  ];

export default function ChatGraph ({ className, onAnimationEnd, children }) {
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
        newNode.id = name + Math.random().toString(36).substring(7);

        setNodes((nodes) => [...nodes, newNode]);
        closeContextMenu();
    }

    const isValidConnection = (connection) => {
        const sourceNodeId = connection.source;
        const targetNodeId = connection.target;
        if(sourceNodeId === targetNodeId) return false;

        const sourceHandleType = connection.sourceHandle;
        const targetHandleType = connection.targetHandle;

        
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
                setClonedNodes([node, ...nodes.filter(n => n.selected)]);
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

    const [clonedNodes, setClonedNodes] = useState([]);

    const [_saveIteration, setSaveIteration] = useState(0);
    const [saveTimeout, setSaveTimeout] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(true);

    const save = () => {
        setTimeout(() => {
            setSaved(true);
        }, 750);
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

        const categoryName = value.data.category || "Uncategorized";

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
            setShowNodeMenu(true);
        },
        options: nodeMenu
    }]);


    const pasteNodes = (x = false, y = false) => {
        const POSITION_OFFSET = 50;
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
            // update all position offstes
            setClonedNodes(clonedNodes.map(node => {
                node.position.x += POSITION_OFFSET;
                node.position.y += POSITION_OFFSET;
                return node;
            }));
        }
    }

    const onPaneContextMenu = (event) => {
        clearCopyOutlines();
        event.preventDefault();
        console.log("pane context menu", event.clientX, event.clientY);
        setContextMenuPosition({ x: event.clientX, y: event.clientY });

        let menuOptions = [];
        // if any selected allow Copy and Delete
        if(nodes.filter(node => node.selected).length > 0) {
            menuOptions.push({
                title: "Copy",
                onClick: () => {
                    // this node and any selected nodes
                    setClonedNodes(nodes.filter(n => n.selected));
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
        if(clonedNodes.length > 0) {
            menuOptions.push({
                title: "Clear",
                onClick: () => {
                    setClonedNodes([]);
                }
            });
            menuOptions.push({
                title: "Paste",
                onClick: () => {
                    pasteNodes(event.clientX, event.clientY);
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


        const newEdge = {
            ...params,

            type: "CustomEdge",
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
                    if(clonedNodes.length > 0) {
                        setClonedNodes([]);
                    } else {
                        notification("", "Nothing selected to copy", "red");
                    }
                    return;
                }

                console.log("Saving", nodes.filter(n => n.selected));
                // this node and any selected nodes
                setClonedNodes(nodes.filter(n => n.selected));
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
                if(clonedNodes.length === 0) {
                    notification("", "Nothing to paste", "red");
                } else {
                    notification(`Pasted ${clonedNodes.length} nodes`);
                    pasteNodes();
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

    return (
        <div className={`${styles.ChatGraph} ${className}`} onAnimationEnd={onAnimationEnd} onKeyDown={(e) => {
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
                    showNodeMenu && <div className={`animate__animated animate__fadeIn ${styles.NodeMenuContainer}`} onClick={() => {
                        setShowNodeMenu(false);
                    }}>
                        <SearchMenu placeholder={`Search for nodes`} hasResults={hasResults} inputText={nodeMenuText} setInputText={setNodeMenuText} className={styles.NodeMenu}>
                            {
                                hasResults && results.map((key, index) => {
                                    return <SearchMenuRow key={index} id={key} text={key} onClick={(e) => {
                                        onNewNode(e, key);
                                        setShowNodeMenu(false);
                                    }} />
                                })
                            }
                        </SearchMenu>
                    </div>
                }
                <SaveIcon saving={saving} saved={saved} />
            </ReactFlow>

            
            

            <Button text="Node" image={"/images/icons/plus.svg"} className={styles.NewNode} onClick={() => {
                setShowNodeMenu(true);
            }} />
            <p>{JSON.stringify(contextMenuPosition || "none") || "none"}</p>
            <ContextMenu id="context-menu" options={contextMenuOptions} defaultOptions={contextMenuDefaultOptions} position={contextMenuPosition} onClose={() => {
                closeContextMenu();
            }} />

            { children }
        </div>
    )
}