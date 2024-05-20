/* test endpoint, simply log whatever body is sent */
export default async function handler(req, res) {
    console.log(req.body);
    res.status(200).send("ok");
}