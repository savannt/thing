export function untilSuccess (callback, interval = 5000) {
    return new Promise(async resolve => {
        function _retry (interval) {
            console.log(`[ERROR] [Safe] Retrying in ${interval}ms`);
            setInterval(async () => {
                return resolve(await untilSuccess(callback, interval));
            }, interval);   
        }

        try {
            const value = await callback();
            if(typeof value !== "undefined") resolve(value);
            else _retry(interval);
        } catch (err) {
            _retry(interval);
        }
    });
}       