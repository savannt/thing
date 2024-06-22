import { useRef, useState, useEffect } from 'react';
import styles from '@/app/Chat/ChatGraph/ContextMenu/ContextMenu.module.css';
import ColorImage from '@/components/ColorImage/ColorImage';

export const CLOSE_DELAY = 2500;

export default function ContextMenu({
    id,
    relative = false,
    options,
    position,
    onMouseEnter = () => {},
    onMouseLeave = () => {},
    onClose = () => {},
    style,
}) {
    if (!position) return null;

    const buttonGroups = options;

    return (
        <div
            id={id}
            name="context-menu"
            className={styles.ContextMenu}
            style={{
                position: relative ? 'relative' : 'absolute',
                top: position.y,
                left: position.x,
                ...style,
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onMouseDownCapture={(e) => {
                e.stopPropagation();
                return
            }}
        >
            {/* {options && options.length > 0 && (
                options.map((option, index) => (
                    <Button key={index} option={option} onClose={onClose} />
                ))
            )}
            {
                options && options.length > 0 && defaultOptions && defaultOptions.length > 0 && <Seperator />
            } */}

            {
                // do the above-- but options is now called buttonGroups- for each item of the aray is another array of buttons- put a seperator at the end of each array
                buttonGroups && buttonGroups.length > 0 && (
                    buttonGroups.map((buttonGroup, index) => {
                        console.log("BUTTNO GROUP", buttonGroup);
                        
                        // if buttongroup is another array of buttons
                        if(Array.isArray(buttonGroup)) {
                            const isLast = index === buttonGroups.length - 1;
                            const isEmpty = buttonGroup.length === 0;

                            return (
                                <>
                                    {
                                        buttonGroup.map((option, index) => (
                                            <Button key={index} option={option} onClose={onClose} />
                                        ))
                                    }
                                    { !isLast && !isEmpty && <Seperator /> }
                                </>
                            )
                        } else {
                            return (
                                <>
                                    <Button key={index} option={buttonGroup} onClose={onClose} />
                                </>
                            )
                        }
                    })
                )
            }
        </div>
    );
}

function Seperator() {
    return <div className={styles.Seperator}></div>;
}

function Button({ option, onClose }) {
    const ref = useRef(null);
    const hasOptions = option.options && option.options.length > 0;
    const [showOptions, setShowOptions] = useState(false);
    const [subMenuPosition, setSubMenuPosition] = useState({ x: 0, y: 0 });
    let timeoutId;

    useEffect(() => {
        return () => {
            clearTimeout(timeoutId);
        };
    }, []);

    function onMouseEnter(e) {
        if (hasOptions) {
            const rect = ref.current.getBoundingClientRect();
            setSubMenuPosition({
                x: rect.width,
                y: -1,
            });
            clearTimeout(timeoutId);
            setShowOptions(true);

            const parent = ref.current.parentElement;
            const allContextMenu = parent.querySelectorAll('[name="context-menu"]');
            allContextMenu.forEach((contextMenu) => {
                if (contextMenu !== ref.current) {
                    contextMenu.style.display = 'none';
                }
            });
        }
    }

    function onMouseLeave() {
        timeoutId = setTimeout(() => {
            setShowOptions(false);
        }, CLOSE_DELAY); // 300ms delay before hiding the submenu
    }

    return (
        <>
            <div
                ref={ref}
                tabIndex={option.onClick ? 0 : undefined}
                role={option.onClick ? 'button' : 'none'}
                aria-pressed={false}
                className={styles.Button}
                onClick={(...e) => {
                    if (option.onClick) {
                        option.onClick(...e);
                        onClose();
                    }
                }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                <p>{option.title}</p>
                {hasOptions && <ColorImage image="/images/icons/caret/caret_right.svg" />}
            </div>
            {showOptions && (
                <ContextMenu
                    options={option.options}

                    position={subMenuPosition}
                    relative={false} // Always position nested menus absolutely
                    onMouseEnter={() => clearTimeout(timeoutId)} // Keep submenu open
                    onMouseLeave={onMouseLeave} // Delay hiding submenu
                    onClose={onClose}
                />
            )}
        </>
    );
}
