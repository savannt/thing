#!/usr/bin/env node

import "colors";
import boxen from "boxen";

const logoHeader = () => {
    return boxen(`${"  thing".bold}${"king".italic}\n${"v1.0    alpha".italic}`, { padding: 0, margin: 0, borderStyle: "none", borderColor: "gray" });
}
const pageHeader = (page) => {
    return boxen(page, { padding: 0, margin: 0, borderStyle: "none", borderColor: "gray" });
}

const getWidth = () => {
    return process.stdout.columns;
}

const rightAlign = (text, multiplier = 1) => {
    const width = getWidth() * multiplier;
    return " ".repeat(width - text.length) + text;
}

console.log(logoHeader());
console.log(rightAlign(pageHeader("⬢ stage"), 0.5));


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

const prompt = () => {
    return new Promise(resolve => {
        let input = "";
        // resolve once the user types something and press Enter
        // once they press Enter- clear that line and resolve the input
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", function (key) {
            if (key === "\u0003") {
                process.exit();
            }
            if (key === "\r") {
                // clear the line
                process.stdout.write("\x1b[2K");
                process.stdout.write("\x1b[0G");
                process.stdin.pause();
                clearInterval(blinking);
                return resolve(input);
            }
            process.stdout.write(key);
            input += key;
        });
    });
}

(async () => {

    const handleInput = async () => {
        const input = await prompt();
        
        

        return await handleInput();
    }

    handleInput();
})();

