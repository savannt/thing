export default async function enterprise(enterpriseSlug, options = {}) {
	let url = "/api/enterprise/" + enterpriseSlug;
	const response = await fetch(url, {});
	const data = await response.json();
	return data;
}