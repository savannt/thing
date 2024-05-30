import Flow from '../Flow.js';

(async () => {
    
    const flow = new Flow({
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
                "type": "string",
                "description": "Chat ID",
                "required": false
              }
            },
            "name": "OnUserMessage"
          },
          "draggable": true,
          "position": {
            "x": -31.69678817175867,
            "y": -8.845615303746627
          },
          "name": "OnUserMessage",
          "id": "OnUserMessagew1joni",
          "width": 154,
          "height": 119,
          "selected": false,
          "positionAbsolute": {
            "x": -31.69678817175867,
            "y": -8.845615303746627
          },
          "dragging": false
        },
        {
          "type": "FunctionNode",
          "data": {
            "displayName": "Play Notification",
            "category": "Utility",
            "label": "Play Notification",
            "details": "utility/playNotification",
            "in": {
              "title": {
                "type": "string",
                "description": "Notification title"
              },
              "content": {
                "type": "string",
                "description": "Notification message"
              }
            },
            "name": "Utility/PlayNotification"
          },
          "draggable": true,
          "position": {
            "x": 462.92053422940586,
            "y": 25.0625766939487
          },
          "name": "Utility/PlayNotification",
          "id": "Utility/PlayNotification70g51dq",
          "width": 180,
          "height": 119,
          "selected": false,
          "positionAbsolute": {
            "x": 462.92053422940586,
            "y": 25.0625766939487
          },
          "dragging": false
        },
        {
          "type": "LogicNode",
          "data": {
            "displayName": "Get Message Text",
            "in": {
              "message": {
                "type": "message",
                "description": "Message"
              }
            },
            "out": {
              "text": {
                "type": "string",
                "description": "Message text"
              }
            },
            "name": "Message/GetText"
          },
          "draggable": true,
          "position": {
            "x": 223.67477429854597,
            "y": 105.48127026858523
          },
          "name": "Message/GetText",
          "id": "Message/GetTextad7q3i",
          "width": 154,
          "height": 87,
          "selected": false,
          "positionAbsolute": {
            "x": 223.67477429854597,
            "y": 105.48127026858523
          },
          "dragging": false
        },
        {
          "type": "EndNode",
          "data": {
            "displayName": "End",
            "final": true,
            "name": "Utility/End"
          },
          "draggable": true,
          "position": {
            "x": 723.5926379377435,
            "y": 32.99032835849772
          },
          "name": "Utility/End",
          "id": "Utility/Endgfgg4e",
          "width": 125,
          "height": 41,
          "selected": true,
          "positionAbsolute": {
            "x": 723.5926379377435,
            "y": 32.99032835849772
          },
          "dragging": false
        }
      ],
      "edges": [
        {
          "source": "OnUserMessagew1joni",
          "sourceHandle": "message:message",
          "target": "Message/GetTextad7q3i",
          "targetHandle": "message:message",
          "type": "DataEdge",
          "data": {
            "type": "message:message"
          },
          "id": "reactflow__edge-OnUserMessagew1jonimessage:message-Message/GetTextad7q3imessage:message",
          "selected": false
        },
        {
          "source": "Message/GetTextad7q3i",
          "sourceHandle": "string:text",
          "target": "Utility/PlayNotification70g51dq",
          "targetHandle": "string:content",
          "type": "DataEdge",
          "data": {
            "type": "string:text"
          },
          "id": "reactflow__edge-Message/GetTextad7q3istring:text-Utility/PlayNotification70g51dqstring:content",
          "selected": false
        },
        {
          "source": "OnUserMessagew1joni",
          "sourceHandle": "string:chatId",
          "target": "Utility/PlayNotification70g51dq",
          "targetHandle": "string:title",
          "type": "DataEdge",
          "data": {
            "type": "string:chatId"
          },
          "id": "reactflow__edge-OnUserMessagew1jonistring:chatId-Utility/PlayNotification70g51dqstring:title",
          "selected": false
        },
        {
          "source": "OnUserMessagew1joni",
          "sourceHandle": "execution",
          "target": "Utility/PlayNotification70g51dq",
          "targetHandle": "execution",
          "type": "ExecutionEdge",
          "data": {
            "type": "execution"
          },
          "id": "reactflow__edge-OnUserMessagew1joniexecution-Utility/PlayNotification70g51dqexecution",
          "selected": false
        },
        {
          "source": "Utility/PlayNotification70g51dq",
          "sourceHandle": "execution",
          "target": "Utility/Endgfgg4e",
          "targetHandle": "execution",
          "type": "ExecutionEdge",
          "data": {
            "type": "execution"
          },
          "id": "reactflow__edge-Utility/PlayNotification70g51dqexecution-Utility/Endgfgg4eexecution"
        }
      ]
    });
    flow.updateNodesData();

    flow.executeFlowEvent("OnUserMessage", {
        message: {
            userId: "you",
            message: "Hello, world!",
            timestamp: new Date()
        },
        chatId: "1234"
    });

})();