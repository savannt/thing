import styles from "@/app/Chat/Console/Console.module.css";

import ChatGraph from "@/app/Chat/ChatGraph/ChatGraph";

import { useState, useEffect, createRef } from "react";
import Button from "@/components/Button/Button";

import { groupDelete, groupNew } from "@/client/group";
import { chatNew } from "@/client/chat";

import { useRouter } from "next/router";

import stringSimilarity from "string-similarity";

export const TEXT_WIDTH = 12.95;
export const LINE_HEIGHT = 20;

function Row ({ className, children, style = {} }) {
    return (
        <div className={className} style={{
            position: "relative",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            ...style
        }}>
            { children }
        </div>
    )
}

function BorderInputRow ({ type = "inputRow", onNewLine, onLineDelete, onSend, value, onChange }) {
    const id = Math.random().toString(36).substring(7);

    return (
        <div className={styles.Input} onClick={(e) => {
            console.log("CLICKED YO!");
            // get e query selector p
            let p = e.target;
            if(p.tagName !== "P") {
                p = p.querySelector("p");
            }
            if(p && p.tagName === "P") {
                p.focus();
            }
            return e.stopPropagation();
        }}>
            <InputRow type={type} onNewLine={onNewLine} onLineDelete={onLineDelete} onSend={onSend} value={value} onChange={onChange} />
        </div>
    )
}

function InputRow ({ id, border = false, type = "inputRow", onNewLine, onLineDelete, onSend, value, onChange }) {
    const ref = createRef();
    const mobileInputRef = createRef();

    const [selectionPosition, setSelectionPosition] = useState(false);
    const [isSelecting, setIsSelecting] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if(isSelecting) {
            const onMouseUp = () => {
                setIsSelecting(false);
            }
            const onMouseMove = (e) => {
                console.log("isSelecting", isSelecting);
                if(isSelecting && selectionPosition) {
                    if(!ref || !ref.current) return;   
                    
                    let left = e.clientX - ref.current.getBoundingClientRect().left;

                    left = Math.floor(left / TEXT_WIDTH);
        
                    left += 1;
                    console.log("left", left);
        
                    let max = value.length;
                    if(left > max) left = max;
                    if(left < 0) left = 0;
                    
                    setSelectionPosition((prev) => {
                        if(left > prev[0]) {
                            return [prev[0], left];
                        } else {
                            return [left, prev[1]];
                        }
                    });
                }
            }
            
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
    
            return () => {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            }
        }
    }, [isSelecting, ref]);

    
    return (
        <Row style={{
            alignItems: "flex-end"
        }}>
            <input ref={mobileInputRef} value={value} onChange={onChange} style={{
                display: "none",
            }}></input>
            <p id={id} type={type} onFocus={() => {
                setIsFocused(true);
            }} onBlur={() => {
                setIsFocused(false);
            }} ref={ref} onDoubleClick={(e) => {
                // get position
                let left = e.clientX - ref.current.getBoundingClientRect().left;
                left = Math.floor(left / TEXT_WIDTH);

                // get word at position (split by spaces)- find the word that contains the left position,
                // then set selectionPosition to the start and end of that word

                let words = value.split(" ");
                let start = 0;
                let end = 0;
                let current = 0;
                for(let i = 0; i < words.length; i++) {
                    let word = words[i];
                    if(current + word.length >= left) {
                        start = current;
                        end = current + word.length;
                        break;
                    }
                    current += word.length + 1;
                }

                setSelectionPosition([start, end]);


            }} onMouseDown={(e) => {
                if(!isFocused && !selectionPosition) {
                    ref.current.focus();
                    return e.stopPropagation();
                }

                setIsSelecting(true);

                // get our left pos relative to this element
                let left = e.clientX - ref.current.getBoundingClientRect().left;
                
                // snap left to intervals of TEXT_WIDTH
                left = Math.floor(left / TEXT_WIDTH);
                
                console.log("initialLeft", left);

                setSelectionPosition([left, left]);
            }} style={{
               lineHeight: LINE_HEIGHT + "px",
            }} onMouseUp={(e) => {
                setIsSelecting(false);
            }} tabIndex={0} aria-pressed={false} autoFocus={true} onChange={onChange} className={styles.ConsoleChat__Input} onKeyDown={(e) => {

                // if ctrl + a
                if(e.key === "a" && e.ctrlKey) {
                    setSelectionPosition([0, value.length]);
                    return e.stopPropagation();
                }
                
                // if backspace
                if(e.key === "Backspace") {
                    if(selectionPosition) {
                        if(selectionPosition[0] === selectionPosition[1]) {
                            let newValue = value;
                            newValue = newValue.slice(0, selectionPosition[0] - 1) + newValue.slice(selectionPosition[1]);
                            if(onChange) onChange(newValue);
                            setSelectionPosition(prev => {
                                return [prev[0] - 1, prev[1] - 1];
                            });
                            return e.stopPropagation();
                        } else {
                            // delete this region
                            let newValue = value;
                            // delete characters [0] to [1]
                            newValue = newValue.slice(0, selectionPosition[0]) + newValue.slice(selectionPosition[1]);
                            if(onChange) onChange(newValue);

                            // set selectionposition to the left side of what we deleted
                            setSelectionPosition([selectionPosition[0], selectionPosition[0]]);
                            return e.stopPropagation();
                        }
                    } else {
                        if(value.length === 0) {
                            if(onLineDelete) onLineDelete();
                            return e.stopPropagation();
                        } else {
                            let newValue = value;
                            newValue = newValue.slice(0, newValue.length - 1);
                            if(onChange) onChange(newValue);
                            return e.stopPropagation();
                        }
                    }
                }



                let newValue = value;
                let end = "";

                if(selectionPosition && selectionPosition[0] === selectionPosition[1]) {
                    // split newValue at selectionPosition[0] 
                    let left = newValue.slice(0, selectionPosition[0]);
                    let right = newValue.slice(selectionPosition[0]);
                    newValue = left;
                    end = right;
                }



                let didHandle = false;

                const focusAbove = () => {
                    let parentRow = e.target.parentElement.previousElementSibling;
                    if(parentRow && parentRow.querySelector("p")) {
                        parentRow.querySelector("p").focus();
                    }
                }

                const focusBelow = () => {
                    // set focus to input next to this one that is input
                    let parentRow = e.target.parentElement.nextElementSibling;
                    if(parentRow && parentRow.querySelector("p")) {
                        parentRow.querySelector("p").focus();
                    }
                }

                // if key is Shift+Enter, add a new line
                if(e.key === "Enter") {
                    if(e.shiftKey) {
                        if(onNewLine) onNewLine(value + "\n");
                        setTimeout(() => {
                            focusBelow();
                        }, 50);
                    } else {
                        if(onSend) onSend(value);
                    }
                    return e.preventDefault();
                }

                // if key is up arrow
                if(e.key === "ArrowUp") {
                    // set focus to input previous to this one that is input
                    focusAbove();
                }

                // if key is down arrow
                if(e.key === "ArrowDown") {
                    focusBelow();
                }


                if(e.key === "ArrowLeft" || e.key === "ArrowRight") {
                    
                    
                    if(e.key === "ArrowLeft") {
                        if(selectionPosition && selectionPosition[0] === selectionPosition[1]) {
                            if(selectionPosition[0] === 0) {
                                return e.stopPropagation();
                            }
                        }

                        // if shifting
                        if(e.shiftKey) {
                            if(!selectionPosition) {
                                setSelectionPosition([value.length - 1, value.length - 0]);
                            } else {
                                setSelectionPosition((prev) => {
                                    if(prev[0] === 0) {
                                        focusAbove();
                                        return false;
                                    }
                                    return [prev[0] - 1, prev[1]];
                                });
                            }
                        } else {
                            if(!selectionPosition || selectionPosition[0] !== selectionPosition[1]) {
                                if(selectionPosition[0] !== selectionPosition[1]) {
                                    setSelectionPosition([selectionPosition[0], selectionPosition[0]]);
                                } else {
                                    if(selectionPosition[0]) setSelectionPosition([selectionPosition[0], selectionPosition[0]]);
                                    else setSelectionPosition([value.length - 1, value.length - 1]);
                                }
                            } else {
                                setSelectionPosition((prev) => {
                                    // if prev[0] !== prev[1] set false- otherwise move both [0] and [1] left
                                    if(prev[0] !== prev[1]) {
                                        return false;
                                    }
                                    if(prev[0] === 0) {
                                        focusAbove();
                                        return false;
                                    }
                                    return [prev[0] - 1, prev[1] - 1];
                                });
                            }
                        }
                    } else {
                        if(e.shiftKey) {
                            if(!selectionPosition) {
                                setSelectionPosition([value.length - 1, value.length - 2]);
                            } else {
                                setSelectionPosition((prev) => {
                                    if(prev[1] >= value.length - 1) {
                                        focusBelow();
                                        return false;
                                    }
                                    return [prev[0], prev[1] + 1];
                                });
                            }
                        } else {
                            if(!selectionPosition || selectionPosition[0] !== selectionPosition[1]) {
                                if(selectionPosition[1]) setSelectionPosition([selectionPosition[1], selectionPosition[1]]);
                                else setSelectionPosition([value.length - 1, value.length - 1]);
                            } else {
                                setSelectionPosition((prev) => {
                                    // if prev[0] !== prev[1] set false- otherwise move both [0] and [1] right
                                    if(prev[0] !== prev[1]) {
                                        return false;
                                    }
                                    if(prev[0] >= value.length - 1) {
                                        focusBelow();
                                        return false;
                                    };
                                    return [prev[0] + 1, prev[1] + 1];
                                });
                            }
                        }
                    }
                    return e.stopPropagation();
                }

                if(e.key === "Space") {
                    // newValue += " ";
                    // use special invisible character after the space so we can stack spaces
                    newValue += " ";
                    // newValue += "\u200B";
                    didHandle = true;
                }

                


                if(!didHandle) {
                    console.log("Key", e.key, e.key.length, e.key.charCodeAt(0));
                    if(e.key.length === 1) {
                        newValue += e.key;   
                    }
                }

                
                newValue += end;
                if(onChange) onChange(newValue);

                if(e.key.length === 1 && selectionPosition && selectionPosition[0] === selectionPosition[1]) {
                    setSelectionPosition(prev => {
                        // adavnce by 1
                        return [prev[0] + 1, prev[0] + 1];
                    });
                }
            }}>{value}</p>
            <span className={styles.Blinker} style={{
                position: selectionPosition ? "absolute" : "relative",
                left: selectionPosition ? (selectionPosition[0] * TEXT_WIDTH) : "0px",
                width: selectionPosition ? ((selectionPosition[1] - selectionPosition[0]) * TEXT_WIDTH) + 1 : undefined,
                animation: selectionPosition && selectionPosition[0] !== selectionPosition[1] ? "none" : undefined,

                height: LINE_HEIGHT + "px",

                mixBlendMode: "difference"
            }} onMouseDown={() => {
                setSelectionPosition(false);
                mobileInputRef.current.focus();
            }}></span>
        </Row>
    )
}

function ConsoleLogo ({ page = false }) {
    return (
        <ConsoleRegion inline={true}>
            <div className={styles.ConsoleLogo}>
                <div className={styles.ConsoleLogo__Header}>
                    <h1>thing</h1>
                    <h3>king</h3>
                </div>
                <div className={styles.ConsoleLogo__Body}>
                    <p>alpha v1</p>
                    <p><span>©</span>2024</p>
                </div>
            </div>

            { page && <h2 className={styles.ConsoleLogo__Page}>{page}</h2> }
        </ConsoleRegion>
    )
}


function ConsoleRegion ({ gap = false, onHeaderButtonClick, headerButton = false, headerButtonImage = false, disabled = false, header = false, border = false, children, inline = false }) {
    return (
        <div className={`${styles.Region} ${disabled ? styles.Disabled : ""}`} style={{
            border: border ? "var(--border)" : undefined,
            borderRadius: border ? "var(--border-radius)" : undefined,
            minWidth: "var(--min-width)",
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? "not-allowed" : undefined,
        }} onClick={(e) => {
            if(disabled) return e.stopPropagation();
        }}>            
            {
                header && <div className={styles.Region__Header} style={{
                    paddingInline: border ? "calc(var(--margin-inline)" : undefined,
                    paddingBlock: border ? "calc(var(--margin-block) * 0.7)" : undefined,
                }}>
                    <h3>{header}</h3>
                    {headerButton && <Button className={styles.Region__Header__Button} text={headerButton} image={headerButtonImage} onClick={onHeaderButtonClick} /> }
                </div>
            }
            <div className={styles.Region__Body} style={{                
                flexDirection: inline ? "row" : "column",
                alignItems: inline ? "center" : "flex-start",
                gap: inline || gap ? "var(--gap)" : undefined,
                paddingInline: border ? "var(--margin-inline)" : undefined,
                paddingBlock: border ? "var(--margin-block)" : undefined,
                paddingRight: border ? "var(--margin-block)" : undefined,
            }}>
                { children }
            </div>
        </div>
    )
}

function ConsoleButtonRow ({ disabled = false, showDelete = false, onDelete, onClick, text, style }) {
    return (
        <div className={`${styles.ButtonRow} ${disabled ? styles.ButtonRow__Disabled : ""}`} style={style} onClick={(e) => {
            if(disabled) return e.stopPropagation();
            else onClick(e);
        }} >
            <p>{text}</p>
            <Button text="Delete" background="transparent" onClick={(e) => {
                e.stopPropagation();
                if(disabled) return;
                if(onDelete) onDelete(e);
            }} />
        </div>
    )
}

function DisappearingText ({ className, text }) {
    const DISAPPEAR_TIME = 5000;
    const DISAPPEAR_INTERVAL = 100;

    const [timeLeft, setTimeLeft] = useState(DISAPPEAR_TIME);
    const [textValue, setTextValue] = useState(text);
    const [isDisappearing, setIsDisappearing] = useState(false);

    // create interval that slowly removes textValue
    useEffect(() => {
        setTimeout(() => {
            setIsDisappearing(true);


            let time = DISAPPEAR_INTERVAL;
            const removeLast = () => {
                if(!textValue) return;
                if(textValue.length === 0) {
                    setTextValue(false);
                    return;
                }

                setTextValue((prev) => {
                    return prev.slice(0, -1);
                });

                time = time * 0.95;
                setTimeout(removeLast, time);
            }

            removeLast();

        }, DISAPPEAR_TIME);

        const UPDATE_EVERY = 100;
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if(prev <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - UPDATE_EVERY;
            });
        }, UPDATE_EVERY);
    }, []);

    if(!textValue) return null;

    return (
        <Row style={{
            alignItems: "flex-end"
        }}>
            <p className={className} dangerouslySetInnerHTML={{
                __html: textValue.replace(/`([^`]+)`/g, "<span style='border: var(--border); border-radius: var(--border-radius); padding-inline: calc(var(--margin-inline) * 0.2); padding-block: calc(var(--margin-block) * 0.2);'>$1</span>")
            }} />
            {
                (timeLeft && !isDisappearing) ? <p className={styles.Bold} style={{
                    marginLeft: "calc(var(--gap) * 2)"
                }}>{`${timeLeft}ms`}</p> : <></>
            }
            <span className={styles.Blinker} style={{
                position: "relative",
                // left: selectionPosition ? (selectionPosition[0] * TEXT_WIDTH) : "0px",
                width: (0.8 * TEXT_WIDTH) + "px",
                height: LINE_HEIGHT + "px",
                mixBlendMode: "difference",
                visibility: isDisappearing ? "visible" : "hidden",
            }}></span>
        </Row>
    )
}

function PressAnyKey ({ onClick }) {
    useEffect(() => {
        const onKeyDown = (e) => {
            if(onClick) {
                onClick();
            }
        }
        
        setTimeout(() => {
            document.addEventListener("keydown", onKeyDown);
        }, 50);

        return () => {
            document.removeEventListener("keydown", onKeyDown);
        }
    })

    return (<p style={{
        width: "var(--min-width)",
        textAlign: "center"
    }}>Press <i>&lt;any&gt;</i> key to continue.</p>)
}

function ConsoleChat ({ setShowChat, setShowGraph, showGraph, onBack, enterpriseId, group: _defaultGroup, groups, setGroups }) {
    const [inputLines, setInputLines] = useState([""]);

    const groupsResults = groups || [];

    const [showNewGroup, setShowNewGroup] = useState(false);
    const [newGroupDisabled, setNewGroupDisabled] = useState(false);
    const [newGroupValue, setNewGroupValue] = useState("new thing");

    const [group, setGroup] = useState(_defaultGroup || false);
    const [groupsDisabled, setGroupsDisabled] = useState(false);
    const [disabledGroups, setDisabledGroups] = useState([]);

    const [showHelp, setShowHelp] = useState(false);

    const onSend = (text) => {
        const lowerCaseText = text.toLowerCase();

        if(lowerCaseText === "!stage") {
            setGroup(false);
            setShowGraph(false);
            return;
        } else if(lowerCaseText === "!edit") {
            if(group) {
                setShowGraph((prev) => {
                    return !prev;
                });
            }
        } else if(lowerCaseText === "!save" || lowerCaseText === "!back") {
            setShowGraph(false);
            setShowChat(true);
        } else if([
            "!exit",
            "!back",
            "!leave",
            "!quit",
        ].includes(lowerCaseText)) {
            if(onBack) onBack();
            return;
        } else if(lowerCaseText === "!help") {
            setShowHelp("test");
        } else if(lowerCaseText.startsWith("!")) {
            let cmd = false;
            let content = text.slice(1);
            if(lowerCaseText.startsWith("!new") || lowerCaseText.startsWith("!edit")) {
                cmd = content.split(" ")[0];
                content = content.split(" ").slice(1).join(" ");
            }

            if(cmd === "new") {
                groupNew(enterpriseId, content).then((group) => {
                    if(!group) {
                        error("Failed to create group");
                    } else {
                        chatNew(enterpriseId, group.id).then((chat) => {
                            if(!chat) {
                                error("Failed to create chat");
                            } else {
                                setGroup(group);
                            }
                        });
                    }
                });
                return;
            }

            // find group from groups.title that most matches content, and set that as the group
            // use "string-similarity"
            // if not above a certain threshold- don't do anything

            let bestMatch = false;
            let bestMatchValue = 0;
            for(let i = 0; i < groupsResults.length; i++) {
                let group = groupsResults[i];
                let match = stringSimilarity.compareTwoStrings(content, group.title);
                if(match > bestMatchValue) {
                    bestMatch = group;
                    bestMatchValue = match;
                }
            }

            if(bestMatchValue > 0.2) {
                setGroup(bestMatch);
                if(cmd === "edit") {
                    setShowGraph(true);
                }
            }
        }
    }

    return (
        <div className={styles.ConsoleChat} onClick={() => {
            // click first p[type='consoleInput']
            let firstInput = document.querySelector("p[type='consoleInput']");
            if(firstInput) {
                firstInput.focus();
            }
        }}>


            <ConsoleLogo page={showHelp ? "help ❓" : (!group ? "stage ⋆" : `${group?.title} ⬢`)} />

            {
                showHelp ? <>
                    { /* Table with two columns, commands, and description */ }
                    <table>
                        <thead>
                            <tr>
                                <th>command</th>
                                <th>description</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><span className={styles.Border}>!help</span></td>
                                <td>show this help</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className={styles.Border}>!exit</span>
                                    <span className={styles.Border}>!quit</span>
                                    <span className={styles.Border}>!back</span>
                                    <span className={styles.Border}>!leave</span>
                                </td>
                                <td>leave the terminal</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className={styles.Border}>!stage</span>
                                </td>
                                <td>return to the 𝑡ℎ𝑖𝑛𝑔 𝑠𝑡𝑎𝑔𝑒</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className={styles.Border}>!stage &lt;name&gt;</span>
                                </td>
                                <td>stage a 𝑡ℎ𝑖𝑛𝑔 given a name</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className={styles.Border}>!new</span>
                                </td>
                                <td>opens new 𝑡ℎ𝑖𝑛𝑔 menu</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className={styles.Border}>!new &lt;name&gt;</span>
                                </td>
                                <td>creates a new 𝑡ℎ𝑖𝑛𝑔 given a name</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className={styles.Border}>!edit</span>
                                </td>
                                <td>edits the current 𝑡ℎ𝑖𝑛𝑔</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className={styles.Border}>!edit &lt;name&gt;</span>
                                </td>
                                <td>edits a 𝑡ℎ𝑖𝑛𝑔 given a name</td>
                            </tr>
                        </tbody>
                    </table>

                    <PressAnyKey onClick={() => {
                        setShowHelp(false);
                    }} />
                </> : <>
                    {
                        group && !showGraph && <DisappearingText className={styles.Light} text={`Note: to return to the 𝑡ℎ𝑖𝑛𝑔 𝑠𝑡𝑎𝑔𝑒, type \`!stage\` at anytime.`} />
                    }

                    {
                        group && showGraph && <DisappearingText className={styles.Light} text={`Note: to return, type \`!back\` at anytime.`} />
                    }

                    { 
                        !group && <>
                            <ConsoleRegion>
                                <p className={styles.Bold}>Welcome to the 𝑠𝑡𝑎𝑔𝑒 !</p>
                                <p className={styles.Light}>Select a 𝑡ℎ𝑖𝑛𝑔 from list to load the act.</p>
                            </ConsoleRegion>
                        
                            <ConsoleRegion disabled={groupsDisabled} border={true} header={"𝑙𝑜𝑎𝑑𝑒𝑟"} headerButton="New" onHeaderButtonClick={(e) => {
                                setShowNewGroup(true);
                                setGroupsDisabled(true);
                            }}>
                                {
                                    (!groupsResults || groupsResults.length === 0) && <p className={styles.Light} style={{
                                        width: "100%",
                                        textAlign: "center"
                                    }}>No 𝑡ℎ𝑖𝑛𝑔 found.</p>
                                }
                                {
                                    groupsResults.map((group, index) => {
                                        const disabled = disabledGroups.includes(group.groupId);
                                        return (
                                            <ConsoleButtonRow key={index} disabled={disabled} text={group.title} style={{
                                                marginInline: "calc(var(--margin-inline) * -1)",
                                                paddingInline: "calc(var(--margin-inline))",
                                                paddingBlock: "calc(var(--margin-block) / 2)",
                                                marginRight: "calc(var(--margin-block) * -1)",
                                                paddingRight: "calc(var(--margin-block) * 1)",
                                            }} onClick={() => {
                                                setGroup(group);
                                            }} showDelete={true} onDelete={() => {
                                                // delete group
                                                setDisabledGroups((prev) => {
                                                    return [...prev, group.groupId];
                                                });
                                                groupDelete(group.groupId).then((res) => {
                                                    if(res) {
                                                        // remove group from groups
                                                        setGroup(false);
                                                        setGroups((groups) => {
                                                            return groups.filter((g) => {
                                                                return g.groupId !== group.groupId;
                                                            });
                                                        });
                                                        setDisabledGroups((prev) => {
                                                            return prev.filter((g) => {
                                                                return g !== group.groupId;
                                                            });
                                                        });
                                                    } else {
                                                        // error
                                                        error("Failed to delete group");
                                                    }
                                                });
                                            }} />
                                        )
                                    })
                                }
                            </ConsoleRegion>
                        </>
                    }
                

                    {
                        // new thing in special text: 𝑛𝑒𝑤 𝑡ℎ𝑖𝑛𝑔
                        showNewGroup && <ConsoleRegion disabled={newGroupDisabled} header="𝑛𝑒𝑤 𝑡ℎ𝑖𝑛𝑔" headerButton="Cancel" onHeaderButtonClick={(e) => {
                            setShowNewGroup(false);
                            setGroupsDisabled(false);
                        }} border={true} inline={true}>
                            <h4>name: </h4>
                            <BorderInputRow type="newGroupInput" value={newGroupValue} onChange={(newValue) => {
                                setNewGroupValue(newValue);
                            }} onSend={() => {
                                if(document.querySelector("#newGroupSend")) {
                                    document.querySelector("#newGroupSend").click();
                                }
                            }} />
                            <Button id="newGroupSend" className={styles.Button} text="Create" onClick={() => {
                                setNewGroupDisabled(true);

                                groupNew(enterpriseId, newGroupValue).then((group) => {
                                    if(!group) {
                                        error("Failed to create group");
                                    } else {
                                        chatNew(enterpriseId, group.id).then((chat) => {
                                            if(!chat) {
                                                error("Failed to create chat");
                                            } else {
                                                setGroup(group);
                                                setShowNewGroup(false);
                                                setGroupsDisabled(false);
                                                setNewGroupDisabled(false);
                                                setGroups((groups) => {
                                                    return [...groups, group];
                                                });
                                            }
                                        });
                                    }
                                });
                                // TODO: Create new group with name


                            }} />
                        </ConsoleRegion>
                    }


                    {
                        // "Note: to return to thingking, type !exit at anytime."
                        !group && <ConsoleRegion>
                            <p className={styles.Light}>Note: to return to default application, type <span className={styles.Border}>!exit</span> at anytime.</p>
                        </ConsoleRegion>
                    }

                    {
                        inputLines.map((line, index) => {
                            let id = "";
                            // if first line, set id to consoleInput
                            if(index === 0) id = "consoleInput";
                            else id = `consoleInput${index}`;
                            return (
                                <InputRow id={id} key={index} type="consoleInput" value={line} onChange={(newValue) => {
                                    setInputLines((lines) => {
                                        lines[index] = newValue;
                                        return [...lines];
                                    });
                                }} onNewLine={(newLine) => {
                                    console.log("New Line", newLine);
                                    setInputLines((lines) => {
                                        return [...lines, ""];
                                    });
                                }} onLineDelete={() => {
                                    // if this is the last line, ignore
                                    if(inputLines.length === 1) return;

                                    setInputLines((lines) => {
                                        // remove only this line
                                        lines.splice(index, 1);
                                        return [...lines];
                                    });
                                }} onSend={(text) => {
                                    onSend(text);
                                    setInputLines([""]);
                                }} />
                            )
                        })
                    }   
                </>
            }
        </div>
    )
}

export default function Console ({ onBack: _onBack, chat, group, groups, setGroups, enterpriseId }) {
    const router = useRouter();

    const [showGraph, setShowGraph] = useState(false);
    const [showChat, setShowChat] = useState(true);

    const onBack = () => {
        // remove ?terminal= from url
        router.push({
            pathname: router.pathname,
            query: {
                ...router.query,
                terminal: undefined
            }
        }, undefined, { shallow: true });

        if(_onBack) _onBack();
    }

    return (
        <div id="console" className={styles.ConsoleContainer}>

            <div className={styles.Monitor}>
                <div className={styles.Screen}>
                    <div className={styles.CRT}>
                        <div className={styles.Content}>
                            {/* <p>Test</p> */}

                            { showChat      && <ConsoleChat setShowGraph={setShowGraph} setShowChat={setShowChat} showGraph={showGraph} onBack={onBack} enterpriseId={enterpriseId} group={group} groups={groups} setGroups={setGroups} /> }
                            { showGraph     && <ChatGraph onEscape={() => {
                                if(document.querySelector("#consoleInput")) {
                                    // if it already has focus, loose it's focus
                                    if(document.activeElement === document.querySelector("#consoleInput")) {
                                        document.querySelector("body").click();
                                    } else {
                                        document.querySelector("#consoleInput").focus();
                                    }
                                }
                            }} showHeader={false} type="console-graph" chat={chat} group={group} enterpriseId={enterpriseId} /> }
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}