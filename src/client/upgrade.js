export default async function upgrade(seats = 1) {
	const response = await fetch("/api/upgrade?seats=" + seats, {});
	const data = await response.json();
	if(!data.url) return false;
	return data;
}
