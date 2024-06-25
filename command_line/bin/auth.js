import axios from "axios";











import puppeteer from "puppeteer";
import chromePaths from "chrome-paths";
import EventEmitter from "events";
import ps from "ps-node";

export const DEFAULT_URL = "http://localhost:3000";
export const DEFAULT_LOGIN_URL = "https://precise-lion-46.clerk.accounts.dev";
export const BACKGROUND_STARTUP_DELAY = 250;

let cookies = "";
let username = "";

class ThingkingPuppeteer {
    constructor() {
        this.events = new EventEmitter();
    }

    async cleanUp () {
        // close all puppeteer processes
        await new Promise(resolve => {
            ps.lookup({
                command: "chrome",
                arguments: "--thingking-app",
                psargs: "aux"
            }, (err, resultList) => {
                if(err) throw new Error(err);
                resultList.forEach(async process => {
                    await ps.kill(process.pid, err => {
                        if(err) throw new Error(err);
                    });
                });

                resolve();
            });
        });
    }

    async _launch (headless = false, url = DEFAULT_URL) {
        await this.cleanUp();

        this.browser = await puppeteer.launch({
            // executablePath: chromePaths.chrome === "google-chrome" ? "/usr/bin/google-chrome" : chromePaths.chrome,
            headless,
            userDataDir: "./chrome_data",
            args: [
                `--app=${url}`,
                `--thingking-app`,
            ],
            defaultViewport: null
        });
        this.page = (await this.browser.pages())[0];

        this.page.on("request", async request => {
            request.continue();
        });

        this.page.on("requestfinished", async request => {
            const headers = request.headers();
            
            const cookieHeader = headers["cookie"] || false;
            if(cookieHeader && cookieHeader.includes("__session=")) this.events.emit("cookies", cookieHeader);
            else if(request.url().includes("/logged_out")) {
                this.events.emit("logged_out");
            }
        });

        await this.page.setRequestInterception(true);
        return this.page.goto(url);
    }

    async close () {
        this.didClose = true;
        if(this.browser) await this.browser.close();
    }
    
    async login (url = DEFAULT_URL) {
        return await new Promise(async resolve => {
            let didResolve = false;
            const promise = await this._launch(false);
            await promise;

            this.page.once("close", () => {
                if(!didResolve) {
                    didResolve = true;
                    resolve(false)
                }
            });

            this.events.once("cookies", async cookies => {
                didResolve = true;
                await this.close();
                setTimeout(async () => {
                    await this._startBackground();
                }, BACKGROUND_STARTUP_DELAY);
            
                resolve(true);
            });
        });
    }

    async edit (url = DEFAULT_URL, groupId, chatId, launchCallback) {
        return await new Promise(async resolve => {            
            const promise = await this._launch(false, url + `/?groupId=${groupId}&chatId=${chatId}&terminal=true&edit=true`);
            await promise;

            if(launchCallback) launchCallback(async () => await this.close());

            this.page.once("close", () => {
                setTimeout(async () => {
                    await this._startBackground();
                    resolve(true);
                }, 250);
            });
        });
    }

    async logout (url = DEFAULT_URL) {
        return await new Promise(async resolve => {
            await this.close();
            const promise = await this._launch(false, DEFAULT_URL + "/logout");
            await promise;

            let didResolve = false;
            this.page.once("close", () => {
                if(didResolve) return;
                didResolve = true;
                resolve(false);
            });
            this.events.once("logged_out", async () => {
                await this.close();
                didResolve = true;
                resolve(true);
            })
        })
    }

    async _startBackground (url = DEFAULT_URL) {
        return await new Promise(async resolve => {
            const promise = await this._launch(true);
            await promise;
            resolve();
        });
    }
}
const pptr = new ThingkingPuppeteer();

export async function login () {
    const didLogin = await pptr.login();
    if(!didLogin) return false;
    pptr.events.on("cookies", _cookies => cookies = _cookies);

    return true;
}

export async function logout () {
    await pptr.logout();
}

export async function launchEdit (groupId, chatId, launchCallback) {
    return await pptr.edit(DEFAULT_URL, groupId, chatId, launchCallback);
}

export function getUsername () {
    return username;
}

export async function chat (url = DEFAULT_URL, chatId, groupId) {
    try {
        const response = await axios.get(`${url}/api/chat/${chatId}?groupId=${groupId}`, {
            headers: {
                Cookie: cookies
            }
        });

        return response.data;
    } catch (err) {
        // TODO: Handle auth error
    }
}

export async function group (url = DEFAULT_URL, groupId, title) {
    try {
        let fullUrl = `${url}/api/group/${groupId}`;
        if(title) fullUrl += `?title=${title}`;
        const response = await axios.get(fullUrl, {
            headers: {
                Cookie: cookies
            }
        });

        return response.data;
    } catch (err) {
        throw err;
    }
}

export async function groups (url = DEFAULT_URL) {
    // const response = await axios.get(`${url}/api/groups`);
    
    
    // set the __client cookie to the token

    // set Authorization header bearer to token (jwt)
    
    try {
        const response = await axios.get(`${url}/api/groups`, {
            headers: {
                Cookie: cookies
            }
        });
        
        return response.data;
    } catch (err) {
        // TODO: Handle auth error
        // console.log(err.response.headers);
        throw err;
    }
}

export async function chats (url = DEFAULT_URL, groupId) {
    try {
        const response = await axios.get(`${url}/api/chats?groupId=${groupId}`, {
            headers: {
                Cookie: cookies
            }
        });

        return response.data;
    } catch (err) {
        throw err;
    }
}

export async function event(url = DEFAULT_URL, eventName, eventParameters) {
    try {
        const response = await axios.get(`${url}/api/flow/event/${eventName}`, {
            method: "POST",
            headers: {
                Cookie: cookies
            },
            data: eventParameters
        });

        return response.data;
    } catch (err) {
        // TODO: Handle auth error
    }
}

export async function user (url = DEFAULT_LOGIN_URL) {
    try {
        const response = await axios.get(`${url}/v1/me`, {
            headers: {
                Cookie: cookies
            }
        });

        return response.data;
    } catch (err) {
        throw err;
    }
}