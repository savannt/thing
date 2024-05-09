export default async function authInit (session) {
    try {
        const eraseCookie = function(name) {
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        };
        eraseCookie("nobusiness.session-hash");
        eraseCookie("nobusiness.userid");

        // get cookie
        const sessionHashCookie = document.cookie.split(";").find(c => c.trim().startsWith("nobusiness.session-hash="));
        const userIdCookie = document.cookie.split(";").find(c => c.trim().startsWith("nobusiness.userid="));
        console.log("Before session hash", sessionHashCookie, userIdCookie);
    
        const response = await fetch("/api/auth/init?userId=" + session.user.id);
        if(response.status !== 200) return false;

        const sessionHashCookieAfter = document.cookie.split(";").find(c => c.trim().startsWith("nobusiness.session-hash="));
        const userIdCookieAfter = document.cookie.split(";").find(c => c.trim().startsWith("nobusiness.userid="));
        console.log("After session hash", sessionHashCookieAfter, userIdCookieAfter);

        const data = await response.json();
        return data;
    } catch (err) { return false; }
}
