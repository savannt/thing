export default class Event {
	constructor () {
		this.queue = [];
		this.free = true;
	}

	async handle (data) {
		if(this.callback) {
			if(this.free) {
				this.free = false;
				await this.callback(data);
				this.free = true;
				if(this.queue.length > 0) await this.handle(this.queue.shift());
			}
		}
		else this.queue.push(data);
	}

	async on (callback) {
		this.callback = callback;
		if(this.queue.length > 0) {
            for(const data of this.queue) {
                await this.callback(data);
            }
        }
        this.queue = [];
	}
}