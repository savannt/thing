const {
    app,
    BrowserWindow
} = require("electron");

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

    window.loadURL("https://www.thingking.org");   

    window.once("ready-to-show", () => {
        window.show();
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