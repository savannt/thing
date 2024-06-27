export default async function tryRefresh(options = {}) {
	let url = "/api/flow/tryRefresh";	
	const response = await fetch(url, options);
	const data = await response.json();
	return data;
}