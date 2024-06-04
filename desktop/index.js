const {
	app,
	dialog,
	BrowserWindow,
} = require("electron");
process.env = require("dotenv").config({ path: __dirname + "/.env.local" }).parsed;
if(!process.env.USE_LOCAL) throw new Error("USE_LOCAL not set in .env.local");
for(let key in process.env) {
	if(process.env[key] === "true") process.env[key] = true;
	if(process.env[key] === "false") process.env[key] = false;
}
const LOGO = `𝘁𝗵𝗶𝗻𝗴 𝑘𝑖𝑛𝑔`;


const { USE_LOCAL, LOCALHOST = "127.0.0.1:3000" } = process.env;

const createAppWindow = () => {
	const window = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true
		},
		show: false,

		// remove menu
		autoHideMenuBar: true
	});

	window.loadURL(USE_LOCAL ? `http://${LOCALHOST}` : "https://www.thingking.org");	 

	window.once("ready-to-show", () => {
		window.show();
	});

	// on fail
	window.webContents.on("did-fail-load", () => {
		// create error popup
		dialog.showErrorBox(`Failed to load ${LOGO}`, USE_LOCAL ? `Failed to load http://${LOCALHOST}` : "Failed to load https://www.thingking.org");
		console.error(`Failed to load ${LOGO}`);
		window.close();
	});
};


app.whenReady().then(() => {
	createAppWindow();

	app.on("activate", () => {
		if(BrowserWindow.getAllWindows().length === 0) {
			createAppWindow();
		}
	});
});

app.on("window-all-closed", () => {
	if(process.platform !== "darwin") {
		app.quit();
	}
});