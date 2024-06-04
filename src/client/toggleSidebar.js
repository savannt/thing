export default function toggleSidebar () {
	if(!document.getElementById("toggle-sidebar")) return alert("A Fatal Error Has Occured:\n\nuhh, jeepers this ain't good chief-\nI can't find the sidebar toggle button");
	document.getElementById("toggle-sidebar").click();
}