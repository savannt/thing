(function() {
    // Create the iframe element

    const container = document.createElement("div");
    
    const iframe = document.createElement("iframe");
    iframe.src = "https://thingking.org";

    const header = document.createElement("div");
    const title = document.createElement("p");
    title.textContent = "𝘁𝗵𝗶𝗻𝗴 𝑘𝑖𝑛𝑔";
    header.appendChild(title);

    container.appendChild(header);
    container.appendChild(iframe);

    document.body.appendChild(container);
  })();
  