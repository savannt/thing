import "animate.css"
import styles from "@/app/Chat/ChatGraph/ChatGraph.module.css"
import chatStyles from "@/app/Chat/Chat.module.css"

import { useEffect, useState, useCallback } from "react"

import ReactFlow, { MiniMap, Controls, Background, useEdgesState, useNodesState, addEdge } from 'reactflow';
import 'reactflow/dist/style.css';

import nodeTypes from "@/app/Chat/ChatGraph/NodeTypes/NodeTypes";
import Button from "@/components/Button/Button";
import SearchMenu, { SearchMenuRow } from "@/components/SearchMenu/SearchMenu";
import ContextMenu from "./ContextMenu/ContextMenu";

import error from "@/client/error";

const NODE_DICTIONARY = {
    "StringConstant": {
        type: "ConstantNode",
        data: {
            displayName: "String Constant",
            category: "Constant",

            value: "Hello, world!",
            valueType: "string"
        },
    },
    "NumberConstant": {
        type: "ConstantNode",
        data: {
            displayName: "Number Constant",
            category: "Constant",

            value: "1",
            valueType: "number"
        },
    },
    "TextareaStringConstant": {
        type: "ConstantNode",
        data: {
            displayName: "Textarea String Constant",
            category: "Constant",

            value: "This is a long string constant. It is used to store long strings.",
            valueType: "textarea"
        },
    },
    "SaveMessage": {
        type: "FunctionNode",
        data: {
            displayName: "Save Message",
            category: "Function",

            label: "Save Message",
            details: "function",
        },
    },
    "OnUserMessage": {
        type: "EventNode",
        data: {
            displayName: "On User Message",
            category: "Event",

            label: "onUserMessage",
            details: "event",

            message: "",
            attachments: []
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

export default function ChatGraph ({ className, children }) {
    useEffect(() => {
        if(document.getElementById("header-title")) {
            document.getElementById("header-title").innerText = "Flow Graph";
        }
        if(document.getElementById("sidebar-header-title")) {
            document.getElementById("sidebar-header-title").innerText = "";
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
        setContextMenuPosition(null);
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
    });

    const [render, setRender] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState(null);
    const [contextMenuOptions, setContextMenuOptions] = useState([]);

    const [clonedNodes, setClonedNodes] = useState([]);

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


    const onPaneContextMenu = (event) => {
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
                title: "Paste",
                onClick: () => {
                    setNodes((nodes) => {
                        return [...nodes, ...clonedNodes.map(node => {
                            const newNode = JSON.parse(JSON.stringify(node));
                            newNode.id = node.id + Math.random().toString(36).substring(7);
                            newNode.position.x += 50;
                            newNode.position.y += 50;
                            return newNode;
                        })];
                    });
                }
            });
        }
        setContextMenuOptions(menuOptions);
      };

    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);
  
    const handleNodesChange = (changes) => {
        const filteredChanges = changes.filter(change => {
            if (change.type === "remove") {
                return change.id !== "onUserMessage"; // Prevent removal of onUserMessage node
            }
            return true;
        });
        onNodesChange(filteredChanges);
    };

    const onPaneClick = (...e) => {
        console.log("pane click", e);
        setContextMenuPosition(null);
        if(e) setShowNodeMenu(false);
    }

    const onMove = () => {
        setContextMenuPosition(null);
        // setShowNodeMenu(false);
    }


    // search dictionary for any key that includes nodeMenuText
    const results = nodeMenuText && nodeMenuText.length > 0 ? Object.keys(NODE_DICTIONARY).filter(key => key.toLowerCase().includes(nodeMenuText.toLowerCase())) : [];
    const hasResults = results.length > 0;

    return (
        <div className={`${styles.ChatGraph} ${className}`} onKeyDown={(e) => {
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
                    // force re-render
                    // setRender((prev) => !prev);
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
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onPaneClick={onPaneClick}
                onMove={onMove}
                onPaneContextMenu={onPaneContextMenu}
                onNodeContextMenu={onNodeContextMenu}
                fitView
                nodeTypes={nodeTypes}
                selectionMode={true}
                // selectionOnDrag={true}
                // selectionKeyCode={null}
                panOnDrag={[0, 1]}

                // catch when we drag a handle but dont make a connection
                onConnectEnd={(...e) => {
                    console.log("connect end", e);
                    setShowNodeMenu(true);
                }}
            >
                <MiniMap />
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
            </ReactFlow>

            
            

            <Button text="Node" image={"/images/icons/plus.svg"} className={styles.NewNode} onClick={() => {
                setShowNodeMenu(true);
            }} />
            <p>{JSON.stringify(contextMenuPosition || "none") || "none"}</p>
            <ContextMenu id="context-menu" options={contextMenuOptions} defaultOptions={contextMenuDefaultOptions} position={contextMenuPosition} onClose={() => {
                setContextMenuPosition(null);
            }} />

            { children }
        </div>
    )
}