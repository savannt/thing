export default function tryUntilSuccess (fn, interval = 5000) {
		// call fn in a try block until it succeeds, when it does resolve its value- if it fails OR if the value is !value, wait interval and try again
		return new Promise((resolve, reject) => {
				let tryFn = async () => {
						try {
								let result = await fn();
								if(result) {
										resolve(result);
								} else {
										setTimeout(tryFn, interval);
								}
						} catch (error) {
								setTimeout(tryFn, interval);
						}
				}
				tryFn();
		});
}