export default function tryUntilSuccess (fn, interval = 5000) {
    return new Promise(async resolve => {
        function _retry (interval) {
            console.log(`[ERROR] [Safe] Retrying in ${interval}ms`);
            setInterval(async () => {
                return resolve(await tryUntilSuccess(fn, interval));
            }, interval);   
        }

        try {
            resolve(await fn());
        } catch (err) {
            _retry(interval);
        }
    })
}