export default async function updateOrganizationSettings(id, settings, options = {}) {
	let url = "/api/updateOrganizationSettings?id=" + id;
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(settings),
		...options,
	});
	const data = await response.json();
	return data;
}