import styles from "@/app/Chat/Console/Console.module.css";

import ChatGraph from "@/app/Chat/ChatGraph/ChatGraph";

import { useState, useEffect, createRef } from "react";
import Button from "@/components/Button/Button";

import { groupDelete, groupNew } from "@/client/group";
import { chatNew } from "@/client/chat";

import { useRouter } from "next/router";

import { useChannel } from "ably/react";

import stringSimilarity from "string-similarity";
import useMobile from "@/providers/Mobile/useMobile";

import error from "@/client/error";

import event, { onUserMessage, onChatCreated } from "@/client/event";
import Notifications from "@/app/Notifications/Notifications";
import notification from "@/client/notification";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

import CommandLine from "@/services/command_line/CommandLine";

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

function InputRow ({ id, error = false, onErrorFinish, onFocus, onBlur, border = false, type = "inputRow", onNewLine, onLineDelete, onSend, value, onChange }) {
    const isMobile = useMobile();

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
            <input ref={mobileInputRef} value={value} onFocus={() => {
                setIsFocused(true);
                if(onFocus) onFocus();
            }} onBlur={() => {
                if(onBlur) onBlur();
                // setIsFocused(false);
            }} onChange={(e) => {
                let value = e.target.value;
                if(onChange) onChange(value);
            }} onKeyDown={(e) => {
                if(e.key === "Enter") {
                    if(onSend) onSend(e.target.value);
                    return e.preventDefault();
                } 
            }} style={{
                // display: "none",
                // opacity: 0,
                // visibility: "hidden",
                position: "absolute",
                left: "-10000000px",
            }} onClick={(e) => {
                return e.stopPropagation();
            }}></input>
            <p id={id} type={type} onFocus={() => {
                setIsFocused(true);
                if(isMobile) {
                    mobileInputRef.current.focus();
                    return;
                }
                if(onFocus) onFocus();
            }} onBlur={() => {
                setIsFocused(false);
                if(onBlur) onBlur();
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
            }} tabIndex={0} aria-pressed={false} autoFocus={true} className={styles.ConsoleChat__Input} onKeyDown={(e) => {
                if(e.key === "Escape") {
                    // loose focus
                    
                    // remove focus from ref
                    document.activeElement.blur();
                    document.activeElement.blur();

                    return e.stopPropagation();
                }


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
            }}>{!value && !isFocused ? `＿` : value}</p>
            <span className={`${styles.Blinker} ${error ? styles.Blinker_Error : ""}`} onAnimationEnd={() => {
                if(onErrorFinish) onErrorFinish();
            }} style={{
                position: selectionPosition ? "absolute" : "relative",
                left: selectionPosition ? (selectionPosition[0] * TEXT_WIDTH) : "0px",
                width: selectionPosition ? ((selectionPosition[1] - selectionPosition[0]) * TEXT_WIDTH) + 1 : undefined,
                animation: selectionPosition && selectionPosition[0] !== selectionPosition[1] ? "none" : undefined,

                height: LINE_HEIGHT + "px",

                mixBlendMode: "difference",

                visibility: isFocused ? "visible" : "hidden",
            }} onMouseDown={() => {
                setSelectionPosition(false);
                mobileInputRef.current.focus();
            }}></span>
        </Row>
    )
}

function ConsoleLogo ({ page = false, pageDescription = false }) {
    return (
        <ConsoleRegion inline={true} className={styles.ConsoleLogos}>
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

            <div className={styles.PageLogo}>
                { page && <h2 className={styles.ConsoleLogo__Page}>{page}</h2> }
                { pageDescription && <p className={styles.ConsoleLogo__PageDescription}>{pageDescription}</p> }
            </div>
        </ConsoleRegion>
    )
}


function ConsoleRegion ({ className, gap = false, onHeaderButtonClick, headerButton = false, headerButtonImage = false, disabled = false, header = false, border = false, children, inline = false }) {
    return (
        <div className={`${styles.Region} ${disabled ? styles.Disabled : ""} ${className}`} style={{
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

function DisappearingText ({ className, text, onDisappear }) {
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
                if(!textValue) {
                    onDisappear();
                    return;
                }
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

        return () => {
            clearInterval(interval);
        }
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
            document.addEventListener("click", onKeyDown);
        }, 50);

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("click", onKeyDown);
        }
    })

    return (<p style={{
        width: "var(--min-width)",
        textAlign: "center"
    }}>Press <i>&lt;any&gt;</i> key to continue.</p>)
}


function ThinkingText ({ visible = true, className }) {

    const [content, setContent] = useState(visible ? "." : "");
    const TIME_BETWEEN_CHANGE = 100;
    const EXPONENTIAL_FACTOR = 0.85;

    useEffect(() => {
        let timeout;

        if (!visible) {
            let currentInterval = TIME_BETWEEN_CHANGE;

            const removeCharacter = () => {
                setContent((prev) => {
                    if (prev.length === 0) {
                        clearTimeout(timeout);
                        return "";
                    }
                    return prev.slice(0, prev.length - 1);
                });

                if (content.length > 0) {
                    currentInterval = currentInterval * EXPONENTIAL_FACTOR;
                    timeout = setTimeout(removeCharacter, currentInterval);
                }
            };

            timeout = setTimeout(removeCharacter, currentInterval);
        } else {
            const interval = setInterval(() => {
                setContent((prev) => {
                    return prev + ".";
                });
            }, TIME_BETWEEN_CHANGE);

            return () => {
                clearInterval(interval);
            };
        }

        return () => {
            clearTimeout(timeout);
        };
    }, [visible]);

    const showCursor = content.length !== 0;

    if(!content) return null;

    return (
        <Row style={{
            alignItems: "flex-end"
        }}>
            <p className={className}>{content}</p>
            <span className={styles.Blinker} style={{
                position: "relative",
                width: (0.8 * TEXT_WIDTH) + "px",
                height: LINE_HEIGHT + "px",
                mixBlendMode: "difference",
                visibility: showCursor ? "visible" : "hidden",
            }}></span>
        </Row>
    )

}

function LoadingText ({ visible = true, className, text = "... thinking ...", safeLength = 1 }) {
    const [showPointer, setShowPointer] = useState(false);

    const TIME_BETWEEN = 3000; // wait TIME_BETWEEN before deleting or adding
    const TIME_BETWEEN_CHANGE = 100; // wait TIME_BETWEEN_CHANGE before changing a character
    const LENGTH = text.length;
    const ANIMATE_LENGTH = LENGTH - safeLength;

    if(ANIMATE_LENGTH > LENGTH) throw new Error("ANIMATE_LENGTH must be less than LENGTH");

    const [content, setContent] = useState(visible ? text.slice(0, safeLength) : "");

    
    // animate using the above "...", adding or removing
    useEffect(() => {
        if(!visible) {
            // remove all characters in interval of TIME_BETWEEN_CHANGE
            let remove = true;
            setShowPointer(true);
            const _interval = () => {
                const call = () => {
                    setContent((prev) => {
                        return prev.slice(0, prev.length - 1);
                    });
                }

                for(let i = 0; i < content.length; i++) {
                    setTimeout(() => {
                        call();
                    }, TIME_BETWEEN_CHANGE * i);
                }
            }

            const interval = setInterval(() => { _interval(); }, TIME_BETWEEN);
            _interval();

            setTimeout(() => {
                setShowPointer(false);
            }, TIME_BETWEEN_CHANGE * content.length)

            return () => {
                clearInterval(interval);
            }

        }
        if(visible && content === "") {
            setContent(text.slice(0, safeLength));
        }
        
        let remove = true;

        const _interval = () => {

            const call = () => {
                setContent((prev) => {
                    if(remove) {
                        return prev.slice(0, prev.length - 1);
                    } else {
                        // find prev in initialContent and add next character
                        let index = text.indexOf(prev);
                        if(index === -1) {
                            return prev;
                        }
                        let next = text[index + prev.length];
                        return prev + next;

                    }
                })
            }

            setShowPointer(true);

            for(let i = 0; i < ANIMATE_LENGTH; i++) {
                setTimeout(() => {
                    call();
                }, TIME_BETWEEN_CHANGE * i);
            }
            setTimeout(() => {
                setShowPointer(false);
            }, TIME_BETWEEN_CHANGE * ANIMATE_LENGTH);

            remove = !remove;
        }

        
        const interval = setInterval(() => { _interval(); }, TIME_BETWEEN);
        _interval();

        return () => {
            clearInterval(interval);
        }
    }, [visible]);

    let showCursor = false;
    if(showPointer) showCursor = true;
    if(content.length !== text.length) showCursor = true;
    // if(!showPointer) showCursor = false;
    if(content.length === 0) showCursor = false;

    if(!content) return null;

    return (
        <Row style={{
            alignItems: "flex-end"
        }}>
            <p className={className}>{content}</p>
            <span className={styles.Blinker} style={{
                position: "relative",
                // left: selectionPosition ? (selectionPosition[0] * TEXT_WIDTH) : "0px",
                width: (0.8 * TEXT_WIDTH) + "px",
                height: LINE_HEIGHT + "px",
                mixBlendMode: "difference",
                visibility: showCursor ? "visible" : "hidden",
                animation: content.length !== safeLength ? "none" : undefined,
            }}></span>
        </Row>
    )
}

function Message ({ message }) {
    if(!message) throw new Error("Message must be defined");
    const { content, role } = message;
    

    const [html, setHtml] = useState("");
    useEffect(() => {
        if(message && message.content) {
            unified()
                .use(remarkParse)
                .use(remarkGfm)
                .use(remarkRehype)
                .use(rehypeHighlight)
                .use(rehypeStringify)
                .process("**>** " + message.content, (err, file) => {
                    if(err) throw err;
                    setHtml(String(file));
                })
        }
    }, [message?.content]);

    if(role === "user") {
        return (
            <p style={{
                marginBottom: "var(--gap)",
                color: "var(--secondary-text-color)"
            }}>
                {content} 
            </p>
        )
    } else {
        return (
            <p dangerouslySetInnerHTML={{ __html: html }} />
        )
    }
}

function ConsoleChat ({ messages, setShowChat, setShowGraph, showGraph, onBack, enterpriseId, group: _defaultGroup, chat, groups, setGroups }) {
    const [inputLines, setInputLines] = useState([""]);

    const groupsResults = groups || [];

    const [showNewGroup, setShowNewGroup] = useState(false);
    const [newGroupDisabled, setNewGroupDisabled] = useState(false);
    const [newGroupValue, setNewGroupValue] = useState("new thing");

    const [group, setGroup] = useState(_defaultGroup || false);
    const [groupsDisabled, setGroupsDisabled] = useState(false);
    const [disabledGroups, setDisabledGroups] = useState([]);

    const [firstAppear, setFirstAppear] = useState(false);
    useEffect(() => {
        // if we don't have THING_KING_LAST_VISIT cookie, set firstAppear- then set that cookie
        let hasCookie = document.cookie.split(";").filter((item) => {
            return item.trim().startsWith("THING_KING_LAST_VISIT=");
        }).length > 0;

        if(!hasCookie) {
            setFirstAppear(true);
        }

        document.cookie = "THING_KING_LAST_VISIT=true; max-age=31536000; path=/";
    }, []);




    const [showHelp, setShowHelp] = useState(false);

    const [thinking, _setThinking] = useState(false);

    const [loading, setLoading] = useState(false);

    const [inputError, setInputError] = useState(false);

    const [inputFocus, setInputFocus] = useState(false);

    const [screenContent, setScreenContent] = useState([]);
    const pushContent = (content) => {
        setScreenContent((prev) => {
            // get current index
            const index = messages.length;
            if(!prev[index]) prev[index] = [];
            prev[index].push(content);
            return prev;
        });
    }
    useEffect(() => {
        setScreenContent([]);
    }, [chat]);


    useChannel(`flow-${chat.chatId}`, "error", (msg) => {
		const data = msg.data;

        if(data.message) {
            pushContent(<p className={styles.Error}><b>An error occured.</b> {data.title}: <i>{data.message}</i></p>);
        } else {
            pushContent(<p className={styles.Error}><b>An error occured.</b> {data.title}</p>);
        }
	});

    useChannel(`flow-${chat.chatId}`, "finish", (msg) => {
        const { success } = msg.data;

        setThinking(false);
    })


    useEffect(() => {
        setLoading(false);
    }, [chat]);



    const prompt = (prefix = "", sensitive = false, boxen = false) => {
    }
    const refreshGroups = async () => {
    }
    const clear = async () => {
    }
    const message = async (groupId, chatId, message) => {
    }
    const exit = async () => {
    }
    const newChat = async (groupId, name) => {
    }
    const error = async (msg, secondary) => {
    }
    const setThinking = async (thinking = false) => {
    }
    const print = async (...e) => {
    }
    const logout = () => {
    }
    const anyKey = () => {

    }


    // const commandLine = new CommandLine({
    //     "error": error,
    //     "newChat": newChat,
    //     "exit": exit,
    //     "message": message,
    //     "clear": clear,
    //     "refreshGroups": refreshGroups,
    //     "prompt": prompt,
    //     "setThinking": setThinking,
    //     "print": print,
    //     "logout": logout,
    //     "anyKey": anyKey,
    // }, {
    //     "header": (page = "stage ⋆") => {
    //         return spaceBetween(
    //             logoHeader(),
    //             pageHeader(page)
    //         );
    //     }
    // }, (content) => {
    //     return marked(content);
    // });





    const onSend = (text) => {
        this.commandLine.send(text);

        const lowerCaseText = text.toLowerCase();

        if([
            "!stage",
            "!home"
        ].includes(lowerCaseText)) {
            if(!group) {
                setInputError(true);
            } else {
                setGroup(false);
                setShowGraph(false);
            }
            return;
        } else if(lowerCaseText === "!edit") {
            if(group && chat) {
                setShowGraph((prev) => {
                    return !prev;
                });
            } else {
                setInputError(true);
            }
        } else if(lowerCaseText === "!save" || lowerCaseText === "!back") {
            if(!group) {
                setInputError(true);
            } else {
                setShowGraph(false);
                setShowChat(true);
            }
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
        } else if([
            "!new",
            "!clear",
            "!empty"
        ].includes(lowerCaseText)) {
            if(!group) {
                setInputError(true);
            } else {
                if(document.getElementById("newChat")) {
                    document.getElementById("newChat").click();
                    setLoading(true);
                    return;
                } else {
                    error("Failed to create new chat");
                }
            }
        } else if(lowerCaseText.startsWith("!")) {
            let cmd = false;
            let content = text.slice(1);
            if(lowerCaseText.startsWith("!new") || lowerCaseText.startsWith("!edit")) {
                cmd = content.split(" ")[0];
                content = content.split(" ").slice(1).join(" ");
            }

            if(cmd === "new") {
                setLoading(true);
                groupNew(enterpriseId, content).then((group) => {
                    if(!group) {
                        error("Failed to create group");
                        setLoading(false);
                    } else {
                        chatNew(enterpriseId, group.groupId).then((chat) => {
                            if(!chat) {
                                error("Failed to create chat");
                            } else {
                                setGroup(group);
                            }
                            setLoading(false);
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
            } else {
                setInputError(true);
            }
        } else {
            if(!chat || !group) {
                setInputError(true);
                return;
            }

            setThinking(true);
            onUserMessage(chat.chatId, {
                content: text,
                role: "user",
            }).then((response) => {
                if(!response) error("OnUserMessage Event Failed");
            });

        }
    }

    function Row ({ children }) {
        return (
            <div style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "flex-end",
                alignItems: "center",
                maxWidth: "40dvw",
                overflow: "hidden",
                /* allow flex wrap */
                flexWrap: "wrap",
                gap: "var(--gap)",
            }}>
                { children }
            </div>
        )
    }

    let content = messages.map((message, index) => {
        const _content = screenContent[index];
        return {
            message,
            content: _content
        }
    });
    // add any screenContent that is longer then messages length
    for(let i = messages.length; i < screenContent.length; i++) {
        content.push({
            message: false,
            content: screenContent[i]
        });
    }

    return (
        <div className={styles.ConsoleChat} onClick={() => {
            // click first p[type='consoleInput']
            let firstInput = document.querySelector("p[type='consoleInput']");
            if(firstInput) {
                firstInput.focus();
            }
        }}>
            <Notifications />

            <ConsoleLogo page={showHelp ? "help ❓" : (!group ? "stage ⋆" : `${group?.title} ⬢`)} pageDescription={chat?.title} />
                
            
            {
                loading ? <>
                <div className={styles.CenterContainer}>
                    <LoadingText className={styles.Light} text="... console is loading ..." />
                </div>
                </> : <>
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
                                            <Row>
                                                <span className={styles.Border}>!exit</span>
                                                <span className={styles.Border}>!quit</span>
                                                <span className={styles.Border}>!back</span>
                                                <span className={styles.Border}>!leave</span>
                                            </Row>
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
                                            <Row>
                                                <span className={styles.Border}>!stage &lt;name&gt;</span>
                                            </Row>
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
                                    <tr>
                                        <td>
                                            <Row>
                                                <span className={styles.Border}>!new</span>
                                                <span className={styles.Border}>!clear</span>
                                                <span className={styles.Border}>!empty</span>
                                            </Row>
                                        </td>
                                        <td>starts a new chat</td>
                                    </tr>
                                </tbody>
                            </table>
        
                            <PressAnyKey onClick={() => {
                                setShowHelp(false);
                            }} />
                        </> : <div className={`${styles.ConsoleBody} ${showGraph ? styles.ConsoleBody__Graph : ""} animate__animated ${showGraph && !inputFocus ? "animate__fadeOut" : ""}`}>
                            
                            
                            {
                                group && !showGraph && firstAppear && <DisappearingText className={styles.Light} text={`Note: to return to the 𝑡ℎ𝑖𝑛𝑔 𝑠𝑡𝑎𝑔𝑒, type \`!stage\` at anytime.`} onDisappear={() => setFirstAppear(false)} />
                            }
        
                            {
                                group && showGraph && firstAppear && <DisappearingText className={styles.Light} text={`Note: to return, type \`!back\` at anytime.`} onDisappear={() => setFirstAppear(false)} />
                            }
        
                            { 
                                !group && <>
                                    <ConsoleRegion>
                                        <p className={styles.Bold}>Welcome to the 𝑠𝑡𝑎𝑔𝑒 !</p>
                                        <p className={styles.Light}>Select a 𝑡ℎ𝑖𝑛𝑔 from list to load the act.</p>
                                    </ConsoleRegion>
                                
                                    <ConsoleRegion className={styles.LoaderMenu} disabled={groupsDisabled} border={true} header={"𝑙𝑜𝑎𝑑𝑒𝑟"} headerButton="New" onHeaderButtonClick={(e) => {
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
                                !group && firstAppear && <ConsoleRegion>
                                    <DisappearingText className={styles.Light} text={`Note: to return to default application, type \`!exit\` at anytime.`}></DisappearingText>
                                </ConsoleRegion>
                            }
        

                            <ConsoleRegion className={styles.MessagesBody}>
                                {
                                    // 


                                    group && chat && <>
            
                                        {
                                            // messages is an array
                                            // screenContent is an array- same length as messages- but can be mostly undefined-
                                            // i need to somehow combine both arrays at the same index's

                                            
                                            content.map(({ message, content: _content }, index) => {
                                                return (
                                                    <>
                                                        { message && <Message key={index} message={message} /> }
                                                        {_content && _content.map((content, index) => {
                                                            return content;   
                                                        })}
                                                    </>
                                                )
                                            })
                                        }
            
                                    </>
                                }
                            </ConsoleRegion>
        
                            <div className={styles.InputRow}>
                                <ThinkingText visible={thinking} className={styles.Light} />
            
                                {
                                    !thinking && inputLines.map((line, index) => {
                                        let id = "";
                                        // if first line, set id to consoleInput
                                        if(index === 0) id = "consoleInput";
                                        else id = `consoleInput${index}`;
                                        return (
                                            <InputRow error={inputError} onErrorFinish={() => {
                                                setInputError(false);
                                            }} id={id} key={index} type="consoleInput" value={line} onChange={(newValue) => {
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
                                            }} onFocus={() => {
                                                setInputFocus(true);
                                            }} onBlur={() => {
                                                setInputFocus(false);
                                            }} />
                                        )
                                    })
                                }   
                            </div>
                        </div>
                    }
                </>
            }
        </div>
    )
}

export default function Console ({ messages, onBack: _onBack, chat, group, groups, setGroups, enterpriseId }) {
    const router = useRouter();

    const [showGraph, setShowGraph] = useState(false);
    const [showChat, setShowChat] = useState(true);
    
    const [showConsoleBorder, setShowBorder] = useState(false);
    const [consoleColor, setConsoleColor] = useState([25, 25, 25]);
    const [consoleGlow, setConsoleGlow] = useState(false);

    useChannel(`console`, `setColor`, (msg) => {
        const { color } = msg.data;
        if(typeof color === "undefined") return error("Color must be defined");
        setConsoleColor(color);
    });

    useChannel(`console`, `setHasBorder`, (msg) => {
        const { hasBorder } = msg.data;
        if(typeof hasBorder === "undefined") return error("Border must be defined");
        setShowBorder(hasBorder);
    });

    useChannel(`console`, `setHasGlow`, (msg) => {
        const { hasGlowv } = msg.data;
        if(typeof hasGlowv === "undefined") return error("Glow must be defined");
        setConsoleGlow(hasGlowv);
    });



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
        <div id="console" className={`${styles.ConsoleContainer} ${showConsoleBorder ? styles.ConsoleContainer__Border : ""}`} style={{
            "--color": `${consoleColor[0]}, ${consoleColor[1]}, ${consoleColor[2]}`
        }}>

            <div className={styles.Monitor}>
                <div className={styles.Screen}>
                    <div className={styles.CRT}>
                        <div className={styles.Content}>
                            { showChat      && <ConsoleChat messages={messages} setShowGraph={setShowGraph} setShowChat={setShowChat} showGraph={showGraph} onBack={onBack} enterpriseId={enterpriseId} chat={chat} group={group} groups={groups} setGroups={setGroups} /> }
                            { showGraph     && <ChatGraph onEscape={() => {
                                if(document.querySelector("#consoleInput")) {
                                    // if it already has focus, loose it's focus
                                    document.querySelector("#consoleInput").focus();
                                }
                            }} showHeader={false} type="console-graph" chat={chat} group={group} enterpriseId={enterpriseId} /> }
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}