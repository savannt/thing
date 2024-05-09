export default async function error (code) {
    if(window && window.location) {
        // const urlParams = new URLSearchParams(window.location.search);
        // urlParams.set("error", code);
        // window.location.search = urlParams;

        // update url without refresh
        // window.history.pushState({}, "", window.location.pathname + "?error=" + code);


        // update url without refresh
        // router.push(window.location.pathname + "?error=" + code);



        // instead of using the query param, use localStorage
        localStorage.setItem("error", code);
        console.log("[ERROR] [Safe] Set error in localStorage", code);
        console.log(localStorage, localStorage.getItem("error"));
        window.dispatchEvent(new Event("storage"));
    }
}