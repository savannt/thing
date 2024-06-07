(function() {
    window.IS_THING_KING_EXTENSION = true;
    
    let isClosed = false;
    let isDragging = false;
    let isMaximize = false;
    let mouseDownOffset = { x: 0, y: 0 };

    const openButton = document.createElement("div");

    const container = document.createElement("div");
    container.setAttribute("name", "thingking-container");

    const iframe = document.createElement("iframe");
    iframe.src = "https://thingking.org";

    const header = document.createElement("div");
    const title = document.createElement("p");
    title.textContent = "𝘁𝗵𝗶𝗻𝗴 𝑘𝑖𝑛𝑔";

    const buttons = document.createElement("div");
    const close = document.createElement("button");
    close.appendChild(document.createElement("div"));
    const maximize = document.createElement("button");
    maximize.appendChild(document.createElement("div"));

    buttons.setAttribute("name", "buttons");
    close.setAttribute("name", "close");
    maximize.setAttribute("name", "maximize");

    close.onclick = () => {
        isClosed = !isClosed;
        container.style.display = isClosed ? "none" : "block";
        openButton.style.display = isClosed ? "block" : "none";
    };

    maximize.onclick = () => {
        if (isMaximize) {
            container.style.width = "50%";
            container.style.height = "50%";
            container.style.left = "25%";
            container.style.top = "25%";
        } else {
            container.style.width = "100%";
            container.style.height = "100%";
            container.style.left = "0";
            container.style.top = "0";
        }
        isMaximize = !isMaximize;
    };

    header.onmousedown = (e) => {
        isDragging = true;
        mouseDownOffset = {
            x: e.clientX - container.offsetLeft,
            y: e.clientY - container.offsetTop
        };
    };

    header.ondblclick = () => {
        maximize.click();
    };

    window.onmouseup = () => {
        isDragging = false;
    };

    window.onmousemove = (e) => {
        if (isDragging) {
            if (isMaximize) {
                maximize.click();
            }

            if (!container.style.width) {
                container.style.width = container.offsetWidth + "px";
            }
            if (!container.style.height) {
                container.style.height = container.offsetHeight + "px";
            }

            container.style.left = `${e.clientX - mouseDownOffset.x}px`;
            container.style.top = `${e.clientY - mouseDownOffset.y}px`;

            // Prevent the container from going off the screen
            if (container.offsetLeft < 0) {
                container.style.left = "0";
            }
            if (container.offsetTop < 0) {
                container.style.top = "0";
            }
            if (container.offsetLeft + container.offsetWidth > window.innerWidth) {
                container.style.left = `${window.innerWidth - container.offsetWidth}px`;
            }
            if (container.offsetTop + container.offsetHeight > window.innerHeight) {
                container.style.top = `${window.innerHeight - container.offsetHeight}px`;
            }
        }
    };

    buttons.appendChild(maximize);
    buttons.appendChild(close);

    header.appendChild(title);
    header.appendChild(buttons);

    container.appendChild(header);
    container.appendChild(iframe);

    close.click(); // Collapse by default
    document.body.appendChild(container);

    openButton.innerHTML = `<div></div> 𝘁𝗵𝗶𝗻𝗴 𝑘𝑖𝑛𝑔`;
    openButton.onclick = () => {
        close.click();
    };
    openButton.id = "thing-king-open-button";
    document.body.appendChild(openButton);
})();
