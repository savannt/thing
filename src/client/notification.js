export default async function notification (str) {
    if(window && window.location) {
        // const urlParams = new URLSearchParams(window.location.search);
        // urlParams.set("error", code);
        // window.location.search = urlParams;

        // update url without refresh
        // window.history.pushState({}, "", window.location.pathname + "?error=" + code);


        // update url without refresh
        // router.push(window.location.pathname + "?error=" + code);



        // instead of using the query param, use localStorage
        localStorage.setItem("notification", str);
        console.log("[ERROR] [Safe] Set notification in localStorage", str);
        console.log(localStorage, localStorage.getItem("notification"));
        window.dispatchEvent(new Event("storage"));
    }
}