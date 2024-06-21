#!/usr/bin/env node

import CommandLine from "../../src/services/command_line/CommandLine.js";


import "colors";
import boxen from "boxen";
import prompts from "prompts";
import { Spinner } from "cli-spinner";
import consoleClear from "console-clear";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";
import unorm from "unorm";

import boxes from "./boxes.json" assert { type: "json" };

const customPrompt = async (questions) => {
    const oldRenderer = prompts._select.renderer;
}

marked.setOptions({
    renderer: new TerminalRenderer()
});

import {
    login,

    getUsername,
    groups as fetchGroups,
    chats as fetchChats,
    chat as fetchChat,
    group as fetchGroup,
    event as sendEvent,
    launchEdit as editChat,

    logout as _logout,
} from "./auth.js";

const ERROR_TIMEOUT = 2500;
const WELCOME_TIMEOUT = 1000;
const EXIT_TIMEOUT = 1000;

const logoHeader = (small = false) => {
    let txt = `${"thing".yellow.bold}${"king ".yellow.italic}\n${"".gray.italic}`;
    if(small) txt = `★ `.yellow.bold + txt;
    return boxen(txt, { padding: 0, margin: 0.5, borderStyle: "none", borderColor: "gray", textAlignment: "left" });
}
const pageHeader = (page, pageDescription) => {
    let txt = !pageDescription ? page : `${page}\n${pageDescription.gray}`
    return boxen(txt, { padding: 0, margin: 0, borderStyle: "none", borderColor: "gray", textAlignment: "left" });
}
const getWidth = () => {
    return process.stdout.columns - 1;
}
const getHeight = () => {
    return process.stdout.rows;
}
const rightAlign = (text, multiplier = 1) => {
    const width = getWidth() * multiplier;
    return " ".repeat(width - text.length) + text;
}
const spaceBetween = (textA, textB) => {
    // join textA to textB with spaces in between-
    // max width of getWidth()-
    // do this per line

    const width = getWidth();
    const linesA = textA.split("\n");
    const linesB = textB.split("\n");

    let result = "";
    for(let i = 0; i < Math.max(linesA.length, linesB.length); i++) {
        let lineA = linesA[i] || "";
        let lineB = linesB[i] || "";
        // remove any excees whitespaces after text
        lineA = lineA.trimEnd();
        lineB = lineB.trimEnd();

        // strip any colors from text before getting length
        let cleanLineA = lineA.replace(/\x1b\[[0-9;]*m/g, "");
        let cleanLineB = lineB.replace(/\x1b\[[0-9;]*m/g, "");

        let lineALength = getLength(lineA);
        let lineBLength = getLength(lineB);


        // result += lineA + " ".repeat(width - lineA.length - lineB.length) + lineB + "\n";
        result += lineA + " ".repeat(width - lineALength - lineBLength) + lineB + "\n";
    }

    return result;
}
const safeStr = (str) => {
    // if special unicode is present- convert to regular characters-
    // do the above, but if `𝑙𝑜𝑎𝑑𝑒𝑟: load an act` -> `loader: load an act`
    // return str.replace(/\x1b\[[0-9;]*m/g, "");

    let result = str;
    result = result.replace(/\x1b\[[0-9;]*m/g, "");
    result = unorm.nfkc(result);
    
    return result;
}
const getLength = (str) => {
    // get char length of str- strip color- or special unicode- just raw normal text count that it visibley takes up in the terminal
    return safeStr(str).length;
}
const center = (text) => {
    const width = getWidth();
    const cleanText = text.replace(/\x1b\[[0-9;]*m/g, "");
    const length = cleanText.length;
    return " ".repeat(Math.floor((width - length) / 2)) + text;
}

const printWelcome = async () => {
    const username = getUsername();
    console.log(boxen(`Welcome back,\n${username.bold}`, { padding: { top: 1, bottom: 1, left: 4, right: 4 }, margin: 1, borderStyle: "round", dimBorder: true, borderColor: "gray" }));
    await new Promise(resolve => setTimeout(resolve, WELCOME_TIMEOUT));
}




const centerCursor = () => {
    const x = Math.floor(getWidth() / 2);
    const y = Math.floor(getHeight() / 2);

    process.stdout.write(`\x1b[${y};${x}H`);

}

const loginPrompt = async () => {
    clear();
    const _error = async (msg) => {
        setThinking(false);

        // if msg has no colors applied, apply red
        if(!msg.includes("\x1b")) {
            msg = msg.red.italic;
        }
        console.log(msg);
        await new Promise(resolve => setTimeout(resolve, ERROR_TIMEOUT));
        clear();
        return await loginPrompt();
    }
    console.log(logoHeader(true));

    console.log("\nWaiting for login...".gray.italic);
    const didLogin = await login();
    if(!didLogin) return await _error("Failed to login.");

    return true;
}

// prompt user with blinking cursor- if the console is not "active" and there is no blinking- show an underscore _
const blinkInterval = () => {
    const blinking = setInterval(() => {
        process.stdout.write("\x1b[?25h");
        setTimeout(() => {
            process.stdout.write("\x1b[?25l");
        }, 500);
    }, 1000);
    return blinking;
}
const blinking = blinkInterval();











const prompt = (prefix = "", sensitive = false, phoneNumber = false, boxen = false) => {
    return new Promise(resolve => {
        // make sure to unbind the process.std.on after we resolve
        const onKeyPress = (key) => {
            if (key === "\u0003") {
                process.exit();
            }
            if (key === "\r") {
                // clear the line
                process.stdout.write("\x1b[2K");
                process.stdout.write("\x1b[0G");
                process.stdin.pause();
                clearInterval(blinking);
                process.stdin.removeListener("data", onKeyPress);


                if(phoneNumber) return resolve(input.replace(/-/g, ""));
                return resolve(input);
            }
            // if key is backspace, remove the last character from input
            if (key === "\u007F") {
                // be careful here not to remove the prefix
                if(input.length === 0) return;
                process.stdout.write("\b \b");
                input = input.slice(0, -1);
                return;
            }

            if(phoneNumber) {
                if(!key.match(/[0-9]/)) return;
                if(input.length >= 15) return;
                if(input === "" && key !== "+1 ") {
                    process.stdout.write("+1 ");
                    input += "+1 ";
                }

                // add dashes in between in the foramt of XXX-XXX-XXXX
                if(input.length === 6 || input.length === 10) {
                    process.stdout.write("-");
                    input += "-";
                }
                process.stdout.write(sensitive ? "*" : key);
                input += key;

                // process.stdout.write(sensitive ? "*" : key);
                // input += key;

            } else {
                process.stdout.write(sensitive ? "*" : key);
                input += key;
            }
        }

        let input = "";
        // resolve once the user types something and press Enter
        // once they press Enter- clear that line and resolve the input
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding("utf8");
        process.stdout.write(prefix);
        process.stdin.on("data", onKeyPress);
    });
}
const refreshGroups = async () => {
    return await fetchGroups();
}
const refreshChats = async (groupId) => {
    return await fetchChats(undefined, groupId);
}
const clear = async () => {
    return consoleClear();
}
const message = async (groupId, chatId, message) => {
    return await sendEvent(undefined, "Events/OnUserMessage", {
        chatId: chatId,
        message: { role: "user", content: message }
    });
}
const exit = async () => {
    console.log("Goodbye.".white.italic);
    setTimeout(() => {
        clear();
        process.exit();
    }, EXIT_TIMEOUT);
}
const newGroup = async (name) => {
    return await fetchGroups(undefined, "new", name);
}
const newChat = async (groupId, name) => {
    return await fetchChat(undefined, "new", groupId);
}
const error = async (msg, secondary) => {
    if(msg && !msg.includes("\x1b")) msg = msg.red;
    if(secondary && !secondary.includes("\x1b")) secondary = secondary.italic;

    let txt = msg ? "Error: ".red.bold + msg : "Error.".red.bold;
    if(secondary) txt += ": " + secondary.italic;
    console.log(txt + "\n");
}
let thinkingSpinner;
const setThinking = async (thinking = false) => {
    // if true, print ... thinking ..., if false, clear the line
    if(thinking) {
        // set cursor position to center of the screen
        thinkingSpinner = new Spinner(`%s ${"thinking...".gray}`);
        thinkingSpinner.setSpinnerString(18);
        thinkingSpinner.start();
    } else {
        if(thinkingSpinner && thinkingSpinner.stop) thinkingSpinner.stop();
        process.stdout.write("\x1b[2K");
        process.stdout.write("\x1b[0G");
    }
}
const print = async (...e) => {
    console.log(...e);
}
const logout = async () => {
    console.log("\nLogging out...".gray.italic);
    await _logout();
    console.log("\n\Goodbye.".white.italic);
    return process.exit();
}
const anyKey = async (msg = "Press any key to continue.") => {
    console.log("       " + msg.gray.italic);
    return await new Promise(resolve => {
        process.stdin.setRawMode(true);
        // remove all listeners form stdin on data
        process.stdin.removeAllListeners("data");

        process.stdin.resume();
        process.stdin.once("data", () => {
            process.stdin.pause();
            resolve();
        });
    });
}
const menu = async (title, description, choices) => {
    return await new Promise(async resolve => {
        // const response = await prompts({
        //     type: "select",
        //     name: title,
        //     message: description,
        //     choices: choices.map(choice => {
        //         return { title: choice, value: choice };
        //     }),
        // });
        // resolve(Object.values(response)[0]);

        // instead lets create our own custom cli prompt menu which lists choices and allows users to select one by using the up and down arrow keys to re-render the list with the selected choice highlighted
        // this could be called at anytime (console.logged at anyheight) but regardless once rewritten- don't even overflow the height- show the first X choices before overflowing- then "scroll" the list


        // const select = async (choices) => {
        //     let cursor = 0;
        //     let done = false;
        //     const optionsPerPage = 10;
        //     const render = () => {
        //         consoleClear();
        //         console.log(logoHeader());
        //         console.log(pageHeader(title, description));
        //         console.log("\n");

        //         for(let i = 0; i < choices.length; i++) {
        //             let choice = choices[i];
        //             if(cursor === i) {
        //                 console.log(`  ${">".green} ${choice}`);
        //             } else {
        //                 console.log(`    ${choice}`);
        //             }
        //         }
        //     }

        //     render();

        //     process.stdin.setRawMode(true);
        //     process.stdin.resume();
        //     process.stdin.setEncoding("utf8");

        //     process.stdin.on("data", (key) => {
        //         if(done) return;
        //         if(key === "\u0003") {
        //             process.exit();
        //         }
        //         if(key === "\r") {
        //             done = true;
        //             process.stdin.pause();
        //             process.stdin.removeAllListeners("data");
        //             return resolve(choices[cursor]);
        //         }
        //         if(key === "\u001B\u005B\u0041") {
        //             cursor = Math.max(0, cursor - 1);
        //         }
        //         if(key === "\u001B\u005B\u0042") {
        //             cursor = Math.min(choices.length - 1, cursor + 1);
        //         }
        //         render();
        //     });
        // }

        // select(choices);


        const box = (boxes, headerText, contentText, footerText) => {
            const paddingInline = 2;
            const paddingBlock = 1;
            const width = Math.floor(getWidth() / 2);


            const paddingInlineStr = ` `.repeat(paddingInline);

            // **use rounded corners**
            const start  = paddingInlineStr + boxes.topLeft       + boxes.top.repeat(width - paddingInline * 2)    + boxes.topRight     + paddingInlineStr
            const middle = paddingInlineStr + boxes.verticalRight + boxes.bottom.repeat(width - paddingInline * 2) + boxes.verticalLeft + paddingInlineStr
            const end    = paddingInlineStr + boxes.bottomLeft    + boxes.bottom.repeat(width - paddingInline * 2) + boxes.bottomRight  + paddingInlineStr
            
            const content = (text) => {
                const availableWidth = width - 1 - paddingInline * 2;
                // if text is longer than available width, split it into multiple lines
                
                // if we shall make overflow ...
                const ELLIPSIS_OVERFLOW = false;
                const lines = [];
                if(!ELLIPSIS_OVERFLOW) {
                    let currentLine = "";

                    // for(let i = 0; i < text.length; i++) {
                    //     if(currentLine.length >= availableWidth) {
                    //         lines.push(currentLine);
                    //         currentLine = "";
                    //     }
                    //     currentLine += text[i];
                    // }
                    // if(currentLine.length > 0) lines.push(currentLine);

                    // do the above- but split by each line

                    let _lines = text.split("\n");
                    for(let i = 0; i < _lines.length; i++) {
                        let line = _lines[i];
                        let currentLine = "";
                        for(let j = 0; j < line.length; j++) {
                            if(currentLine.length >= availableWidth) {
                                lines.push(currentLine);
                                currentLine = "";
                            }
                            currentLine += line[j];
                        }
                        if(currentLine.length > 0) lines.push(currentLine);
                    }
                } else {
                    lines = text.split("\n");
                    
                    // if we have any overflow on any line make it so that it ends with ...
                    for(let i = 0; i < lines.length; i++) {
                        let line = lines[i];
                        if(getLength(line) > availableWidth) {
                            lines[i] = line.slice(0, availableWidth - 3) + "...";
                        }
                    }
                }

                
                if(lines.length === 1) {
                    const lineText = lines[0];
                    const lineTextLength = getLength(lineText);
                    const padding = availableWidth - lineTextLength;


                    return ` `.repeat(paddingInline) + boxes.left + ` ` + lineText + ` `.repeat(padding) + boxes.right + ` `.repeat(paddingInline);
                } else return lines.map(line => content(line)).join("\n");
            }


            console.log(start);
            if(headerText) console.log(content(headerText) + "\n" + middle);
            if(contentText) console.log(content(contentText));
            if(footerText) console.log(middle + "\n" + content(footerText) + "\n" + end);
            else console.log(end);
        }


        const colorBoxes = (boxes, color) => {
            // for each value, color it by color
            for(let key in boxes) {
                if(boxes[key][color]) {
                    boxes[key] = boxes[key][color];
                } else {
                    boxes[key] = boxes[key].white;
                }
            }
            return boxes;
        }

        const boxStyle = colorBoxes({
            ...boxes.round,
            verticalLeft: "┤",
            verticalRight: "├",
        }, "gray");


        // do the above but surround the whole thing in a boxen
        const select = async (choices) => {
            let cursor = 0;
            let done = false;
            const optionsPerPage = 10;
            const render = () => {
                consoleClear();

                const width = Math.floor(getWidth() / 2);
                console.log(spaceBetween(logoHeader(), pageHeader(title, description)));

                // for(let i = 0; i < choices.length; i++) {
                //     let choice = choices[i];
                //     if(cursor === i) {
                //         console.log(` │ ${">".yellow.bold} ${choice.underline}`);
                //     } else {
                //         console.log(` │ ${">".gray} ${choice}`);
                //     }
                // }
                // // print rounded corners at bottom
                // console.log(" | " + "-".repeat(width - 4) + " |");


                // surround the above in box
                box(boxStyle, title + " " + description.gray, choices.map((choice, i) => {
                    if(cursor === i) return `> `.yellow.bold +  `${choice}`.white.underline;
                    return `> ${choice}`;
                }).join("\n"));
            }

            render();

            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.setEncoding("utf8");

            process.stdin.on("data", (key) => {
                if(done) return;
                if(key === "\u0003") {
                    process.exit();
                }
                if(key === "\r") {
                    done = true;
                    process.stdin.pause();
                    process.stdin.removeAllListeners("data");
                    return resolve(choices[cursor]);
                }
                if(key === "\u001B\u005B\u0041") {
                    cursor = Math.max(0, cursor - 1);
                }
                if(key === "\u001B\u005B\u0042") {
                    cursor = Math.min(choices.length - 1, cursor + 1);
                }
                render();
            });
        }
        select(choices);
    });
}
const edit = async (groupId, chatId) => {
    if(!groupId) return await error("No thing on stage.");
    if(!chatId) return await error("No chat on stage.");
    return await editChat(groupId, chatId, (kill) => anyKey("Editor launched, close it or press any key to continue.").then(kill));
}

const commandLine = new CommandLine({
    "error": error,
    "newChat": newChat,
    "newGroup": newGroup,
    "exit": exit,
    "message": message,
    "clear": clear,
    "refreshGroups": refreshGroups,
    "refreshChats": refreshChats,
    "prompt": prompt,
    "setThinking": setThinking,
    "print": print,
    "logout": logout,
    "anyKey": anyKey,
    "menu": menu,
    "edit": edit
}, {
    "header": (page = false, pageDescription = false) => {
        if(!page) page = "stage ★";
        else page = page + " ⬢";
        return spaceBetween(
            logoHeader(),
            pageHeader(page, pageDescription)
        );
    }
}, (content) => {
    return marked(content);
});

(async () => {
    await loginPrompt();
    console.log("Logged in successfully.".green.italic);
    await new Promise(resolve => setTimeout(resolve, WELCOME_TIMEOUT));
    consoleClear();

    // Starts the command line interface
    commandLine.start();
})();

