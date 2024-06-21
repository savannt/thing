export function setSaved (saved) {
    if(!window || !window.localStorage) return;
    window.localStorage.setItem("saved", saved);
    window.dispatchEvent(new Event("storage"));
}
export function setSaving (saving) {
    if(!window || !window.localStorage) return;
    window.localStorage.setItem("saving", saving);
    window.dispatchEvent(new Event("storage"));
}