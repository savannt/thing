export default async function billing(changeSeats = false) {
    let url = "/api/billing";
    if(changeSeats) url += "?seats=" + changeSeats;
    const response = await fetch(url, {});
    const data = await response.json();
    // if(!data.url || !data.subscribed_seats) return false;
    return data;
}
