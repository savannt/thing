import stringSimilarity from "string-similarity";

export const THING_MATCH_THRESHOLD = 0.2;


export const Commands = {
    "home": {
        description: "Go back to the home screen.",
        aliases: ["!stage", "!home"],
    },
    "edit": {
        description: "",
        aliases: ["!edit"],
    },
    "save": {
        description: "",
        aliases: ["!save", "!back"],
    },
    "exit": {
        description: "",
        aliases: ["!exit", "!back", "!leave", "!quit"],
    },
    "help": {
        description: "",
        aliases: ["!help"],
    },
    "new": {
        description: "",
        aliases: ["!new", "!clear", "!empty"],
    },
    "logout": {
        description: "",
        aliases: ["!logout"],
    }
};

export default class CommandLine {
    constructor (callbacks, renderCallbacks, renderer = false) {
        this.active = false;

        this.chat = false;
        this.group = false;
        this.chats = []
        this.groups = [];
        
        const REQUIRED_CALLBACKS = ["error", "newChat", "newGroup", "exit", "message", "refreshGroups", "refreshChats", "setThinking", "prompt", "clear", "print", "logout", "anyKey", "menu", "edit"];
        REQUIRED_CALLBACKS.forEach(callback => {
            if(!callbacks[callback]) throw new Error(`[ThingkingCLI] Missing required callback ${callback}`);
        });
        this.callbacks = callbacks;

        const REQUIRED_RENDER_CALLBACKS = ["header"];
        REQUIRED_RENDER_CALLBACKS.forEach(callback => {
            if(!renderCallbacks[callback]) throw new Error(`[ThingkingCLI] Missing required render callback ${callback}`);
        });
        this.renderCallbacks = renderCallbacks;

        this.renderer = renderer;

        this.commandHandlers = {
            "home": async () => {
                if(!this.group) return await this.handleCallback("error");
                else await this.setGroup(false);

                return await this._printStage();
            },
            "edit": async (name) => {
                if(!this.group) return await this.handleCallback("error", "No thing on stage");
                if(!this.chat) return await this.handleCallback("error", "No chat on stage");
                return await this.handleCallback("edit", this.group.groupId, this.chat.chatId);
            },
            "new": async (thing) => {
                if(!this.group) return await this.handleCallback("error", "no thing on stage");
                if (thing) await this.setGroup(thing);

                await this.setChatToNewChat();

                return await this._printChat();
            },
            "save": async () => {
                if(!group) {
                    return await this.handleCallback("error");
                } else {
                    await this.setGroup(false);
                    await this.setChat(false);
                }
            },
            "exit": async () => {
                return await this.handleCallback("exit");
            },
            "help": async () => {
                return await this.printHelp();
            },
            "logout": async () => {
                return await this.handleCallback("logout");
            }
        };

        this.onNoCommand = async (text, parsedThing) => {
            if(text.startsWith("!")) {
                if(parsedThing) {
                    this.setGroup(parsedThing);
                } else {
                    return await this.handleCallback("error");
                }
            } else {
                if(this.chat && this.group) {
                    return await this.handleCallback("message", this.group.groupId, this.chat.chatId, text)
                } else {
                    return await this.handleCallback("error", "No thing matched.");
                }
            }
        }

        this.onParse = async (partialThingName) => {
            // from partial thing name, find the best match in groups
            let bestMatch = false;
            let bestMatchValue = 0;
            for(let i = 0; i < this.groups.length; i++) {
                let group = this.groups[i];
                let match = stringSimilarity.compareTwoStrings(partialThingName, group.title);
                if(match > bestMatchValue) {
                    bestMatch = group;
                    bestMatchValue = match;
                }
            }
        
            if(bestMatchValue > THING_MATCH_THRESHOLD) {
                return bestMatch;
            } else {
                return false;
            }
        }



        Object.keys(Commands).forEach(command => {
            if(!this.commandHandlers[command]) throw new Error(`[ThingkingCLI] No command handler for command ${command}`);
        });
    }


    async print (content) {
        if(this.renderer) content = await this.renderer(content);
        return await this.handleCallback("print", content);
    }

    getChat () {
        return this.chat;
    }
    async setChat (chat) {
        this.chat = chat;
    }
    getGroup () {
        return this.group;
    }
    async setGroup (group) {
        this.group = group;
    }
    getGroups () {
        return this.groups;
    }
    async setGroups (groups) {
        this.groups = groups;
    }
    getChats () {
        return this.chats;
    }
    async setChats (chats) {
        this.chats = chats;
    }


    async handleCallback (callbackName, ...args) {
        if(!this.callbacks[callbackName]) throw new Error(`[ThingkingCLI] No callback for ${callbackName}`);
        return await this.callbacks[callbackName](...args);
    }

    async handleRenderCallback (callbackName, ...args) {
        if(!this.renderCallbacks[callbackName]) throw new Error(`[ThingkingCLI] No render callback for ${callbackName}`);
        return await this.renderCallbacks[callbackName](...args);
    }


    async _printHeader (page, pageDescription) {
        const header = await this.handleRenderCallback("header", page, pageDescription);
        return await this.handleCallback("print", header);
    }

    async newChat (groupId = false) {
        return await this.handleCallback("newChat", groupId ? groupId : this.group.groupId);
    }

    async newGroup (name) {
        return await this.handleCallback("newGroup", name);
    }

    async setGroupToNewGroup (name) {
        const group = await this.newGroup(name);
        await this.setGroup(group);
    }

    async setChatToNewChat () {
        const chat = await this.newChat();
        await this.setChat(chat);
    }

    
    async setGroupAndLastChat (newGroup) {
        await this.setGroup(newGroup);
        await this.refreshChats();

        if(this.chats.length > 0) await this.setChat(this.chats[this.chats.length - 1]);
        else await this.setChatToNewChat();
    }

    async _printStage () {
        this.clear();
        await this._printHeader();

        await this.refreshGroups();
        const selectedGroupTitle = await this.handleCallback("menu", "𝑙𝑜𝑎𝑑𝑒𝑟", "load an act", this.groups.map(group => group.title));
        const selectedGroup = this.groups.find(group => group.title === selectedGroupTitle);
        if(!selectedGroup) return await this.handleCallback("error", "No group selected.");
        
        await this.setGroupAndLastChat(selectedGroup);

        await this._printChat();
    }

    async _printChat () {
        this.clear();
        await this._printHeader(this.group.title, this.chat.title);

        const messages = this.chat.messages;
        for(let i = 0; i < messages.length; i++) {
            const message = messages[i];

            if(message.role !== "assistant") await await this.print(message.text);
            else await this.print("**>** " + message.text);
        }

        await this.handleInput();
    }


    async printHelp () {
        let helpString = "| aliases | description |\n";
        helpString += "| --- | --- |\n";
        for(let command in Commands) {
            const Command = Commands[command];
            const aliases = Command.aliases;
            let aliasesString = "";
            for(let i = 0; i < aliases.length; i++) {
                aliasesString += aliases[i];
                if(i < aliases.length - 1) aliasesString += ", ";
            }
            helpString += `| ${aliasesString} | ${Command.description || command} |\n`;
        }

        await this.print(helpString);
        await this.handleCallback("anyKey");
        


        return await this.printScreen();
    }
    
    async setThinking (thinking) {
        return await this.handleCallback("setThinking", thinking);
    }

    async clear () {
        return await this.handleCallback("clear");
    }

    async refreshChats () {
        await this.setThinking(true);
        await this.setChats(
            await this.handleCallback("refreshChats", this.group.groupId)
        );
        await this.setThinking(false);
    }

    async refreshGroups () {
        await this.setThinking(true);
        await this.setGroups(
            await this.handleCallback("refreshGroups")
        );
        await this.setThinking(false);
    }

    async printScreen () {
        await this.clear();
        if(this.group) {
            if(!this.chat) await this.setChatToNewChat();
            await this._printChat();
        }
        else await this._printStage();
    }

    async start () {
        this.active = true;

        return await this.printScreen();
    }

    async handleInput () {
        const textInput = await this.handleCallback("prompt");
        await this.handleSend(textInput);
        
        if(this.active) return await this.handleInput();
        return false;
    }


    async _onCommand (name) {
        return await this.commandHandlers[name]();
    }

    async handleSend (text) {
        const lowerCaseText = text.toLowerCase();
        const lowerCaseCommand = text.includes("!") && text.includes(" ") ? text.split(" ")[0].toLowerCase() : lowerCaseText;
        const includesSuffix = text.includes("!") && text.includes(" ");
        const suffix = includesSuffix ? text.split(" ").slice(1).join(" ") : false;
        const parsedSuffix = includesSuffix ? (this.onParse ? await this.onParse(suffix) : suffix) : false;


        // find command that best matches the text lowerCaseCommand
        let commandMatch = false;
        for(let command in Commands) {
            const aliases = Commands[command].aliases;   
            for(let i = 0; i < aliases.length; i++) {
                const alias = aliases[i];
                if(alias === lowerCaseCommand) {
                    commandMatch = command;
                    break;
                }
            }
        }

        
        if(commandMatch) {
            const commandHandler = this.commandHandlers[commandMatch];
            if(!commandHandler) throw new Error("[ThingkingCLI] No command handler for command " + commandMatch);
            
            return await commandHandler(parsedSuffix);
        }
        return await this.onNoCommand(text, parsedSuffix);
    }
}