(function() {
    // Create the iframe element

    
    let isDragging = false;
    let isMaximize = false;
    let mouseDownOffset = { x: 0, y: 0 };

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
    const minimize = document.createElement("button");
    minimize.appendChild(document.createElement("div"));
    const maximize = document.createElement("button");
    maximize.appendChild(document.createElement("div"));
    const duplicate = document.createElement("button");
    duplicate.appendChild(document.createElement("div"));

    close.setAttribute("name", "close");
    minimize.setAttribute("name", "minimize");
    maximize.setAttribute("name", "maximize");
    duplicate.setAttribute("name", "duplicate");

    close.onclick = () => {

    }
    minimize.onclick = () => {
        // set height to min-height
        if(container.style.height === "50%") {
            container.style.height = "var(--header-height)";
        } else {
            container.style.height = "50%";
        }
    }
    maximize.onclick = () => {
        if(container.style.width === "100%") {
            isMaximize = false;
            container.style.width = "50%";
            container.style.height = "50%";
            container.style.left = "25%";
            container.style.top = "25%";
        } else {
            isMaximize = true;
            container.style.width = "100%";
            container.style.height = "100%";
            container.style.left = "0";
            container.style.top = "0";
        }
    }
    duplicate.onclick = () => {

    }

    // on mousedown, set dragging to true, on mouseup set dragging false-- if dragging is true, set the position of the container to the mouse position
    header.onmousedown = (e) => {
        isDragging = true;

        // record the offset of the mouse from the top left corner of the container
        mouseDownOffset = {
            x: e.clientX - container.offsetLeft,
            y: e.clientY - container.offsetTop
        }
    }
    header.ondblclick = () => {
        maximize.click();
    }
    window.onmouseup = () => {
        isDragging = false;
    }

    window.onmousemove = (e) => {
        if(isDragging) {
            if(isMaximize) {
                maximize.click();
            }

            if(!container.style.width) {
                container.style.width = container.offsetWidth + "px";
            }
            if(!container.style.height) {
                container.style.height = container.offsetHeight + "px";
            }

            container.style.left = e.clientX - mouseDownOffset.x + "px";
            container.style.top = e.clientY - mouseDownOffset.y + "px";
            
            // don't let the container go off the screen
            if(container.offsetLeft < 0) {
                container.style.left = 0;
            }
            if(container.offsetTop < 0) {
                container.style.top = 0;
            }
            if(container.offsetLeft + container.offsetWidth > window.innerWidth) {
                container.style.left = window.innerWidth - container.offsetWidth + "px";
            }
            if(container.offsetTop + container.offsetHeight > window.innerHeight) {
                container.style.top = window.innerHeight - container.offsetHeight + "px";
            }

        }
    }


    buttons.appendChild(duplicate);
    buttons.appendChild(minimize);
    buttons.appendChild(maximize);
    buttons.appendChild(close);


    header.appendChild(title);
    header.appendChild(buttons);

    container.appendChild(header);
    container.appendChild(iframe);

    document.body.appendChild(container);
  })();
  