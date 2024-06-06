export default {
  "nodes": [
    {
      "type": "EventNode",
      "data": {
        "displayName": "On User Message",
        "out": {
          "message": {
            "type": "message",
            "description": "User message"
          },
          "chatId": {
            "type": "chatId",
            "description": "Chat ID",
            "required": false
          },
          "files": {
            "type": "files",
            "description": "Files",
            "required": false
          }
        },
        "name": "OnUserMessage",
        "animate": false,
        "animateBackwards": false,
        "error": false,
        "copying": false,
        "selected": false,
        "errorValue": null
      },
      "draggable": true,
      "position": {
        "x": -780,
        "y": -660
      },
      "name": "OnUserMessage",
      "id": "OnUserMessagevw22pf",
      "width": 154,
      "height": 150,
      "selected": false,
      "positionAbsolute": {
        "x": -780,
        "y": -660
      },
      "dragging": false
    },
    {
      "type": "FunctionNode",
      "data": {
        "displayName": "Create ChatCompletion",
        "in": {
          "messages": {
            "type": "messages",
            "description": "Messages"
          }
        },
        "out": {
          "run": {
            "type": "run",
            "description": "Chat completion"
          }
        },
        "name": "ChatCompletion/Create",
        "animate": false,
        "animateBackwards": false,
        "error": false,
        "copying": false,
        "selected": false,
        "errorValue": null
      },
      "draggable": true,
      "position": {
        "x": -210,
        "y": -585
      },
      "name": "ChatCompletion/Create",
      "id": "ChatCompletion/Createpar1q",
      "width": 196,
      "height": 87,
      "selected": false,
      "positionAbsolute": {
        "x": -210,
        "y": -585
      },
      "dragging": false
    },
    {
      "type": "LogicNode",
      "data": {
        "displayName": "Create Empty Messages",
        "out": {
          "messages": {
            "type": "messages",
            "description": "Empty messages array"
          }
        },
        "name": "Messages/CreateEmpty",
        "animate": false,
        "animateBackwards": false,
        "error": false,
        "copying": false,
        "selected": false
      },
      "draggable": true,
      "position": {
        "x": -765,
        "y": -825
      },
      "name": "Messages/CreateEmpty",
      "id": "Messages/CreateEmptygme5gf",
      "width": 184,
      "height": 87,
      "selected": false,
      "positionAbsolute": {
        "x": -765,
        "y": -825
      },
      "dragging": false
    },
    {
      "type": "LogicNode",
      "data": {
        "displayName": "Push Message",
        "in": {
          "messages": {
            "type": "messages",
            "description": "Messages array"
          },
          "message": {
            "type": "message",
            "description": "Message to push"
          }
        },
        "out": {
          "messages": {
            "type": "messages",
            "description": "Messages array after push"
          }
        },
        "name": "Messages/Push",
        "animate": false,
        "animateBackwards": false,
        "error": false,
        "copying": false,
        "selected": false,
        "errorValue": null
      },
      "draggable": true,
      "position": {
        "x": -510,
        "y": -720
      },
      "name": "Messages/Push",
      "id": "Messages/Push1sa3cq",
      "width": 228,
      "height": 119,
      "selected": false,
      "positionAbsolute": {
        "x": -510,
        "y": -720
      },
      "dragging": false
    },
    {
      "type": "EndNode",
      "data": {
        "displayName": "End",
        "final": true,
        "name": "Utility/End",
        "animate": false,
        "animateBackwards": false,
        "error": false,
        "copying": false,
        "selected": false
      },
      "draggable": true,
      "position": {
        "x": 435,
        "y": -540
      },
      "name": "Utility/End",
      "id": "Utility/End00z3co",
      "width": 125,
      "height": 41,
      "selected": false,
      "positionAbsolute": {
        "x": 435,
        "y": -540
      },
      "dragging": false
    },
    {
      "type": "EndNode",
      "data": {
        "displayName": "End",
        "final": true,
        "name": "Utility/End",
        "animate": false,
        "animateBackwards": false,
        "error": false,
        "copying": false,
        "selected": false
      },
      "draggable": true,
      "position": {
        "x": 630,
        "y": -435
      },
      "name": "Utility/End",
      "id": "Utility/Ende7duxp",
      "width": 125,
      "height": 41,
      "selected": false,
      "positionAbsolute": {
        "x": 630,
        "y": -435
      },
      "dragging": false
    },
    {
      "type": "FunctionNode",
      "data": {
        "displayName": "Save Message",
        "in": {
          "message": {
            "type": "message",
            "description": "Message to save"
          },
          "chatId": {
            "type": "chatId",
            "description": "Chat ID to Save Message To",
            "required": false
          }
        },
        "name": "SaveMessage",
        "animate": false,
        "animateBackwards": false,
        "error": false,
        "copying": false,
        "selected": false,
        "errorValue": null
      },
      "draggable": true,
      "position": {
        "x": -495,
        "y": -585
      },
      "name": "SaveMessage",
      "id": "SaveMessagemkfoc",
      "width": 154,
      "height": 119,
      "selected": false,
      "positionAbsolute": {
        "x": -495,
        "y": -585
      },
      "dragging": false
    },
    {
      "type": "FunctionNode",
      "data": {
        "displayName": "On Message Stream",
        "category": "Run",
        "label": "onMessageStream",
        "details": "run/onMessageStream",
        "in": {
          "run": {
            "type": "run",
            "description": "Chat completion"
          }
        },
        "out": {
          "onMessageStreamEvent": {
            "type": "group",
            "flow": true,
            "displayName": "On Message Stream Event",
            "description": "On message stream event",
            "out": {
              "message": {
                "type": "message",
                "description": "Message, content will be streamed"
              },
              "messageId": {
                "type": "number",
                "description": "Message ID",
                "required": false
              }
            }
          }
        },
        "name": "Run/OnMessageStream",
        "animate": false,
        "animateBackwards": false,
        "error": false,
        "copying": false,
        "selected": false,
        "errorValue": null
      },
      "draggable": true,
      "position": {
        "x": 60,
        "y": -555
      },
      "name": "Run/OnMessageStream",
      "id": "Run/OnMessageStream9h2ew",
      "width": 247,
      "height": 200,
      "selected": false,
      "positionAbsolute": {
        "x": 60,
        "y": -555
      },
      "dragging": false
    },
    {
      "type": "FunctionNode",
      "data": {
        "displayName": "Save Message Stream",
        "in": {
          "message": {
            "type": "message",
            "description": "Message to save"
          },
          "messageId": {
            "type": "number",
            "description": "Message ID"
          },
          "chatId": {
            "type": "chatId",
            "description": "Chat ID to Save Message To",
            "required": false
          }
        },
        "name": "SaveMessageStream",
        "animate": false,
        "animateBackwards": false,
        "error": false,
        "copying": false,
        "selected": false,
        "errorValue": null
      },
      "draggable": true,
      "position": {
        "x": 360,
        "y": -465
      },
      "name": "SaveMessageStream",
      "id": "SaveMessageStreamxph9o",
      "width": 185,
      "height": 150,
      "selected": false,
      "positionAbsolute": {
        "x": 360,
        "y": -465
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "Messages/CreateEmptygme5gf",
      "sourceHandle": "messages:messages",
      "target": "Messages/Push1sa3cq",
      "targetHandle": "messages:messages",
      "type": "DataEdge",
      "data": {
        "type": "messages:messages",
        "animate": false,
        "animateBackwards": false,
        "value": []
      },
      "id": "reactflow__edge-Messages/CreateEmptygme5gfmessages:messages-Messages/Push1sa3cqmessages:messages",
      "selected": false
    },
    {
      "source": "OnUserMessagevw22pf",
      "sourceHandle": "message:message",
      "target": "Messages/Push1sa3cq",
      "targetHandle": "message:message",
      "type": "DataEdge",
      "data": {
        "type": "message:message",
        "animate": false,
        "animateBackwards": false,
        "value": {
          "content": "cool story do it again-",
          "role": "user"
        },
        "error": false
      },
      "id": "reactflow__edge-OnUserMessagevw22pfmessage:message-Messages/Push1sa3cqmessage:message",
      "selected": false
    },
    {
      "source": "Messages/Push1sa3cq",
      "sourceHandle": "messages:messages",
      "target": "ChatCompletion/Createpar1q",
      "targetHandle": "messages:messages",
      "type": "DataEdge",
      "data": {
        "type": "messages:messages",
        "animate": false,
        "animateBackwards": false,
        "error": false,
        "value": {
          "messages": [
            {
              "content": "cool story do it again-",
              "role": "user"
            }
          ],
          "_class": "Messages"
        }
      },
      "id": "reactflow__edge-Messages/Push1sa3cqmessages:messages-ChatCompletion/Createpar1qmessages:messages",
      "selected": false
    },
    {
      "source": "OnUserMessagevw22pf",
      "sourceHandle": "execution",
      "target": "SaveMessagemkfoc",
      "targetHandle": "execution",
      "type": "ExecutionEdge",
      "data": {
        "type": "execution",
        "animate": false,
        "animateBackwards": false
      },
      "id": "reactflow__edge-OnUserMessagevw22pfexecution-SaveMessagemkfocexecution",
      "selected": false
    },
    {
      "source": "OnUserMessagevw22pf",
      "sourceHandle": "message:message",
      "target": "SaveMessagemkfoc",
      "targetHandle": "message:message",
      "type": "DataEdge",
      "data": {
        "type": "message:message",
        "animate": false,
        "animateBackwards": false,
        "value": {
          "content": "cool story do it again-",
          "role": "user"
        }
      },
      "id": "reactflow__edge-OnUserMessagevw22pfmessage:message-SaveMessagemkfocmessage:message",
      "selected": false
    },
    {
      "source": "ChatCompletion/Createpar1q",
      "sourceHandle": "execution",
      "target": "Run/OnMessageStream9h2ew",
      "targetHandle": "execution",
      "type": "ExecutionEdge",
      "data": {
        "type": "execution",
        "animate": false,
        "animateBackwards": false
      },
      "id": "reactflow__edge-ChatCompletion/Createpar1qexecution-Run/OnMessageStream9h2ewexecution",
      "selected": false
    },
    {
      "source": "ChatCompletion/Createpar1q",
      "sourceHandle": "run:run",
      "target": "Run/OnMessageStream9h2ew",
      "targetHandle": "run:run",
      "type": "DataEdge",
      "data": {
        "type": "run:run",
        "animate": false,
        "animateBackwards": false,
        "value": {
          "_events": {},
          "_eventsCount": 0,
          "json": false,
          "choices": []
        }
      },
      "id": "reactflow__edge-ChatCompletion/Createpar1qrun:run-Run/OnMessageStream9h2ewrun:run",
      "selected": false
    },
    {
      "source": "Run/OnMessageStream9h2ew",
      "sourceHandle": "execution",
      "target": "Utility/End00z3co",
      "targetHandle": "execution",
      "type": "ExecutionEdge",
      "data": {
        "type": "execution",
      },
      "id": "reactflow__edge-Run/OnMessageStream9h2ewexecution-Utility/End00z3coexecution",
      "selected": false
    },
    {
      "source": "SaveMessagemkfoc",
      "sourceHandle": "execution",
      "target": "ChatCompletion/Createpar1q",
      "targetHandle": "execution",
      "type": "ExecutionEdge",
      "data": {
        "type": "execution",
      },
      "id": "reactflow__edge-SaveMessagemkfocexecution-ChatCompletion/Createpar1qexecution",
    },
    {
      "source": "Run/OnMessageStream9h2ew",
      "sourceHandle": "execution-onMessageStreamEvent",
      "target": "SaveMessageStreamxph9o",
      "targetHandle": "execution",
      "type": "DataEdge",
      "data": {
        "type": "execution-onMessageStreamEvent",
      },
      "id": "reactflow__edge-Run/OnMessageStream9h2ewexecution-onMessageStreamEvent-SaveMessageStreamxph9oexecution"
    },
    {
      "source": "SaveMessageStreamxph9o",
      "sourceHandle": "execution",
      "target": "Utility/Ende7duxp",
      "targetHandle": "execution",
      "type": "ExecutionEdge",
      "data": {
        "type": "execution",
      },
      "id": "reactflow__edge-SaveMessageStreamxph9oexecution-Utility/Ende7duxpexecution"
    },
    {
      "source": "Run/OnMessageStream9h2ew",
      "sourceHandle": "message:message",
      "target": "SaveMessageStreamxph9o",
      "targetHandle": "message:message",
      "type": "DataEdge",
      "data": {
        "type": "message:message",
      },
      "id": "reactflow__edge-Run/OnMessageStream9h2ewmessage:message-SaveMessageStreamxph9omessage:message"
    },
    {
      "source": "Run/OnMessageStream9h2ew",
      "sourceHandle": "number:messageId",
      "target": "SaveMessageStreamxph9o",
      "targetHandle": "number:messageId",
      "type": "DataEdge",
      "data": {
        "type": "number:messageId",
      },
      "id": "reactflow__edge-Run/OnMessageStream9h2ewnumber:messageId-SaveMessageStreamxph9onumber:messageId"
    }
  ]
}