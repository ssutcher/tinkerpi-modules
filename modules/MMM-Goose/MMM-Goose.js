Module.register("MMM-Goose", {
	defaults: {
		updateInterval: 15 * 60 * 1000, // 15 minutes
	},

	start() {
		this.gooseData = null;
		this.errorMsg = null;
		this.sendSocketNotification("GOOSE_FETCH", this.config);

		// Refresh on interval
		setInterval(() => {
			this.sendSocketNotification("GOOSE_FETCH", this.config);
		}, this.config.updateInterval);

		// Tick countdown every second
		this.countdownInterval = setInterval(() => {
			this.updateDom(0);
		}, 1000);
	},

	getStyles() {
		return ["MMM-Goose.css"];
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "GOOSE_DATA") {
			this.gooseData = payload;
			this.errorMsg = null;
			this.updateDom();
		} else if (notification === "GOOSE_ERROR") {
			this.errorMsg = payload;
			this.updateDom();
		}
	},

	getDom() {
		const wrapper = document.createElement("div");
		wrapper.className = "goose-wrapper";

		if (this.errorMsg) {
			wrapper.innerHTML = `<div class="goose-label">Goose</div><div class="goose-error">${this.errorMsg}</div>`;
			return wrapper;
		}

		if (!this.gooseData) {
			wrapper.innerHTML = `<div class="goose-label">Goose</div><div class="goose-loading">Loading...</div>`;
			return wrapper;
		}

		const { nextShow, lastShow } = this.gooseData;

		if (!nextShow) {
			wrapper.innerHTML = this.getOffTourHtml(lastShow);
			return wrapper;
		}

		// Calculate countdown to next show (assume 8pm showtime if not provided)
		const showDate = new Date(nextShow.date + "T20:00:00");
		const now = new Date();
		const diff = showDate - now;

		if (diff <= 0) {
			wrapper.innerHTML = this.getLiveHtml(nextShow, lastShow);
		} else {
			const days = Math.floor(diff / (1000 * 60 * 60 * 24));
			const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
			const secs = Math.floor((diff % (1000 * 60)) / 1000);

			const isTonight = days === 0;

			if (isTonight) {
				wrapper.innerHTML = this.getTonightHtml(nextShow, lastShow, hours, mins, secs);
			} else {
				wrapper.innerHTML = this.getBetweenShowsHtml(nextShow, lastShow, days, hours, mins, secs);
			}
		}

		return wrapper;
	},

	getBetweenShowsHtml(next, last, days, hours, mins, secs) {
		const pad = (n) => String(n).padStart(2, "0");
		return `
			<div class="goose-label">Next Show</div>
			<div class="goose-countdown-hero">
				<span class="goose-countdown-big">${days}</span>
				<span class="goose-countdown-unit">DAYS</span>
			</div>
			<div class="goose-countdown-sub">${pad(hours)}h ${pad(mins)}m ${pad(secs)}s</div>
			<div class="goose-venue">${next.venue}</div>
			<div class="goose-city">${next.city}</div>
			<div class="goose-date">${next.date}</div>
			${next.tour ? `<div class="goose-tour">${next.tour}</div>` : ""}
			${this.getSetlistHtml(last)}
		`;
	},

	getTonightHtml(next, last, hours, mins, secs) {
		const pad = (n) => String(n).padStart(2, "0");
		return `
			<div class="goose-tonight-glow"></div>
			<div class="goose-label goose-tonight-label">Tonight</div>
			<div class="goose-countdown-hero">
				<span class="goose-countdown-big goose-tonight-big">${hours}</span>
				<span class="goose-countdown-unit goose-tonight-unit">HRS</span>
			</div>
			<div class="goose-countdown-sub goose-tonight-sub">${pad(mins)}m ${pad(secs)}s</div>
			<div class="goose-venue goose-tonight-venue">${next.venue}</div>
			<div class="goose-city" style="color:#aa8800;">${next.city}</div>
			${this.getSetlistHtml(last)}
		`;
	},

	getLiveHtml(next, last) {
		return `
			<div class="goose-live-badge"><span class="goose-live-dot"></span><span class="goose-live-text">Live</span></div>
			<div class="goose-live-venue">${next.venue} // ${next.city}</div>
			${this.getSetlistHtml(last)}
		`;
	},

	getOffTourHtml(last) {
		return `
			<div class="goose-label">Goose</div>
			<div class="goose-offtour">No upcoming shows</div>
			${this.getSetlistHtml(last)}
		`;
	},

	getSetlistHtml(last) {
		if (!last) return "";

		let rows = "";
		if (last.sets.s1) {
			rows += `<div class="goose-set-row"><span class="goose-set-tag">S1</span><span class="goose-set-songs">${last.sets.s1}</span></div>`;
		}
		if (last.sets.s2) {
			rows += `<div class="goose-set-row"><span class="goose-set-tag">S2</span><span class="goose-set-songs">${last.sets.s2}</span></div>`;
		}
		if (last.sets.s3) {
			rows += `<div class="goose-set-row"><span class="goose-set-tag">S3</span><span class="goose-set-songs">${last.sets.s3}</span></div>`;
		}
		if (last.sets.encore) {
			rows += `<div class="goose-set-row"><span class="goose-set-tag goose-encore">E</span><span class="goose-set-songs">${last.sets.encore}</span></div>`;
		}

		return `
			<div class="goose-setlist-section">
				<div class="goose-setlist-header">// Last: ${last.date} @ ${last.venue}</div>
				${rows}
			</div>
		`;
	},
});
