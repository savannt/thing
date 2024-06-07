(function() {
    // Constants
    const FULLSCREEN_ONLY_WIDTH_THRESHOLD = 450;

    // Global state flags
    window.IS_THING_KING_EXTENSION = true;
    let isClosed = true; // Set to true to ensure it starts collapsed
    let isDragging = false;
    let isMaximized = false;
    let mouseDownOffset = { x: 0, y: 0 };
    let didSafeMaximize = false;

    // DOM Elements
    const openButton = document.createElement("div");
    const container = document.createElement("div");
    const iframe = document.createElement("iframe");
    const header = document.createElement("div");
    const title = document.createElement("p");
    const buttons = document.createElement("div");
    const closeButton = document.createElement("button");
    const maximizeButton = document.createElement("button");

    // Set attributes and initial styles
    container.setAttribute("name", "thingking-container");
    iframe.src = "https://thingking.org";
    title.textContent = "𝘁𝗁𝗂𝗇𝗀 𝑘𝑖𝑛𝑔";
    buttons.setAttribute("name", "buttons");
    closeButton.setAttribute("name", "close");
    maximizeButton.setAttribute("name", "maximize");

    // Append elements to their respective parents
    closeButton.appendChild(document.createElement("div"));
    maximizeButton.appendChild(document.createElement("div"));
    buttons.appendChild(maximizeButton);
    buttons.appendChild(closeButton);
    header.appendChild(title);
    header.appendChild(buttons);
    container.appendChild(header);
    iframe.setAttribute("name", "thingking-iframe");
    container.appendChild(iframe);

    // Initial container state
    container.style.display = "none"; // Ensure container starts hidden
    document.body.appendChild(container);

    // Setup openButton
    openButton.innerHTML = `<div></div>𝘁𝗁𝗂𝗇𝗀 𝑘𝑖𝑛𝑔`;
    openButton.onclick = () => closeButton.click();
    openButton.id = "thing-king-open-button";
    document.body.appendChild(openButton);

    // Event handlers
    closeButton.onclick = () => {
        isClosed = !isClosed;
        container.style.display = isClosed ? "none" : "block";
        openButton.style.display = isClosed ? "flex" : "none";
        if (!isClosed && window.innerWidth < FULLSCREEN_ONLY_WIDTH_THRESHOLD) {
            maximizeButton.click(); // Go fullscreen if below the threshold
        }
    };

    maximizeButton.onclick = () => {
        if (isMaximized) {
            container.style.width = "var(--min-width)";
            container.style.minWidth = "var(--min-width)";
            container.style.height = ""; // Allow iframe to resize
        } else {
            if(window.innerWidth < FULLSCREEN_ONLY_WIDTH_THRESHOLD) {
                container.style.minWidth = "100%";
            } else {
                container.style.minWidth = "var(--min-width)";
            }
            container.style.width = "100%";
            container.style.height = "100%";
            container.style.left = "0";
            container.style.top = "0";
        }
        isMaximized = !isMaximized;
    };

    const onMouseDown = (e, ee) => {
        isDragging = true;
        mouseDownOffset = {
            x: e.clientX - container.offsetLeft,
            y: e.clientY - container.offsetTop
        };
        if(ee) ee.stopPropagation();
        else e.stopPropagation();
    };

    const onMouseMove = (e, ee) => {
        if (isDragging) {
            if (isMaximized) maximizeButton.click(); // Exit maximized mode when dragging

            // Set container dimensions if not already set
            if (!container.style.width) container.style.width = `${container.offsetWidth}px`;
            if (!container.style.height) container.style.height = `${container.offsetHeight}px`;

            // Update container position
            container.style.left = `${e.clientX - mouseDownOffset.x}px`;
            container.style.top = `${e.clientY - mouseDownOffset.y}px`;

            // Prevent container from going off-screen
            if (container.offsetLeft < 0) container.style.left = "0";
            if (container.offsetTop < 0) container.style.top = "0";
            if (container.offsetLeft + container.offsetWidth > window.innerWidth) container.style.left = `${window.innerWidth - container.offsetWidth + 1}px`;
            if (container.offsetTop + container.offsetHeight > window.innerHeight) container.style.top = `${window.innerHeight - container.offsetHeight + 1}px`;

            if(ee) ee.stopPropagation();
            else e.stopPropagation();
        }
    };

    const onMouseUp = () => isDragging = false;

    // Attach event listeners
    header.onmousedown = onMouseDown;
    header.ondblclick = () => maximizeButton.click();
    header.ontouchstart = (e) => onMouseDown(e.touches[0], e);
    window.onmousemove = onMouseMove;
    window.ontouchmove = (e) => onMouseMove(e.touches[0], e);
    window.onmouseup = onMouseUp;

    // Adjust container if window is resized
    window.onresize = () => {
        if (window.innerWidth < FULLSCREEN_ONLY_WIDTH_THRESHOLD) {
            if (!isClosed && !isMaximized) {
                maximizeButton.click(); // Go fullscreen if below the threshold
                didSafeMaximize = true;
            }
        } else {
            if (isMaximized && didSafeMaximize) {
                maximizeButton.click(); // Exit fullscreen if above the threshold
                didSafeMaximize = false;
            }
        }
    };
})();
