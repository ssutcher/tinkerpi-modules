Module.register("MMM-Phish", {
	defaults: {
		apiKey: "",
		updateInterval: 15 * 60 * 1000, // 15 minutes
	},

	start() {
		this.phishData = null;
		this.sendSocketNotification("FETCH_PHISH_DATA", this.config);

		// Refresh data on interval
		setInterval(() => {
			this.sendSocketNotification("FETCH_PHISH_DATA", this.config);
		}, this.config.updateInterval);

		// Tick countdown every second
		this.countdownInterval = setInterval(() => {
			this.updateDom(0);
		}, 1000);
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "PHISH_DATA") {
			this.phishData = payload;
			this.updateDom();
		}
	},

	getStyles() {
		return ["MMM-Phish.css"];
	},

	getDom() {
		const wrapper = document.createElement("div");
		wrapper.className = "phish-wrapper";

		if (!this.phishData) {
			wrapper.innerHTML = '<div class="phish-label">Loading...</div>';
			return wrapper;
		}

		const next = this.phishData.nextShow;
		const last = this.phishData.lastSetlist;
		const otd = this.phishData.onThisDay;

		if (!next) {
			// No upcoming shows — just show last setlist and OTD
			wrapper.innerHTML = this.getNoShowHtml(last, otd);
			return wrapper;
		}

		// Calculate countdown to next show (assume 8pm showtime)
		const showDate = new Date(next.date + "T20:00:00");
		const now = new Date();
		const diff = showDate - now;

		if (diff <= 0) {
			wrapper.innerHTML = this.getLiveHtml(next, last);
		} else {
			const days = Math.floor(diff / (1000 * 60 * 60 * 24));
			const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
			const secs = Math.floor((diff % (1000 * 60)) / 1000);

			if (days === 0) {
				wrapper.innerHTML = this.getTonightHtml(next, hours, mins, secs, last, otd);
			} else {
				wrapper.innerHTML = this.getBetweenShowsHtml(next, days, hours, mins, secs, last, otd);
			}
		}

		return wrapper;
	},

	formatLocation(data) {
		if (!data) return "";
		const parts = [data.city];
		if (data.state) parts.push(data.state);
		if (data.country && data.country !== "USA") parts.push(data.country);
		return parts.join(", ");
	},

	getSetlistHtml(last, otd) {
		if (!last) return "";
		let html = `
			<div class="phish-setlist-section">
				<div class="phish-setlist-header">// Last: ${last.date} @ ${last.venue}</div>`;

		if (last.sets.s1) html += `<div class="phish-set-row"><span class="phish-set-tag">S1</span><span class="phish-set-songs">${last.sets.s1}</span></div>`;
		if (last.sets.s2) html += `<div class="phish-set-row"><span class="phish-set-tag">S2</span><span class="phish-set-songs">${last.sets.s2}</span></div>`;
		if (last.sets.s3) html += `<div class="phish-set-row"><span class="phish-set-tag">S3</span><span class="phish-set-songs">${last.sets.s3}</span></div>`;
		if (last.sets.encore) html += `<div class="phish-set-row"><span class="phish-set-tag phish-encore">E</span><span class="phish-set-songs">${last.sets.encore}</span></div>`;
		if (last.sets.encore2) html += `<div class="phish-set-row"><span class="phish-set-tag phish-encore">E2</span><span class="phish-set-songs">${last.sets.encore2}</span></div>`;

		if (otd) {
			html += `<div class="phish-otd"><strong>OTD ${otd.year}</strong> // ${otd.venue} @ ${otd.city}, ${otd.state}</div>`;
		}

		html += `</div>`;
		return html;
	},

	getBetweenShowsHtml(next, days, hours, mins, secs, last, otd) {
		const pad = (n) => String(n).padStart(2, "0");
		const location = this.formatLocation(next);
		return `
			<div class="phish-label">Next Show</div>
			<div class="phish-countdown-hero">
				<span class="phish-countdown-big">${days}</span>
				<span class="phish-countdown-unit">DAYS</span>
			</div>
			<div class="phish-countdown-sub">${pad(hours)}h ${pad(mins)}m ${pad(secs)}s</div>
			<div class="phish-venue">${next.venue}</div>
			<div class="phish-city">${location}</div>
			<div class="phish-date">${next.date}</div>
			${this.getSetlistHtml(last, otd)}
		`;
	},

	getTonightHtml(next, hours, mins, secs, last, otd) {
		const pad = (n) => String(n).padStart(2, "0");
		const location = this.formatLocation(next);
		return `
			<div class="phish-tonight-glow"></div>
			<div class="phish-label phish-tonight-label">Tonight</div>
			<div class="phish-countdown-hero">
				<span class="phish-countdown-big phish-tonight-big">${hours}</span>
				<span class="phish-countdown-unit phish-tonight-unit">HRS</span>
			</div>
			<div class="phish-countdown-sub phish-tonight-sub">${pad(mins)}m ${pad(secs)}s</div>
			<div class="phish-venue phish-tonight-venue">${next.venue}</div>
			<div class="phish-city" style="color:#aa8800;">${location}</div>
			<div class="phish-doors">SHOW 20:00</div>
			${this.getSetlistHtml(last, otd)}
		`;
	},

	getLiveHtml(next, last) {
		// Show has started — display the last known setlist as "live" state
		const location = this.formatLocation(next);
		let setHtml = "";

		if (last && last.date === next.date) {
			// We have setlist data for tonight's show
			const sets = last.sets;
			const currentSet = sets.encore2 ? "Encore 2" : sets.encore ? "Encore" : sets.s3 ? "Set 3" : sets.s2 ? "Set 2" : "Set 1";
			const currentSongs = sets.encore2 || sets.encore || sets.s3 || sets.s2 || sets.s1 || "";

			setHtml = `
				<div class="phish-live-set-label">${currentSet}</div>
				<div class="phish-live-songs">
					<div class="phish-song current">${currentSongs}</div>
				</div>
			`;
		} else {
			setHtml = `
				<div class="phish-live-set-label">Show Time</div>
				<div class="phish-live-songs">
					<div class="phish-song current">Waiting for setlist data...<span class="phish-cursor"></span></div>
				</div>
			`;
		}

		return `
			<div class="phish-live-badge"><span class="phish-live-dot"></span><span class="phish-live-text">Live</span></div>
			<div class="phish-live-venue">${next.venue} // ${location}</div>
			${setHtml}
			<div class="phish-live-footer"><span class="phish-cursor"></span></div>
		`;
	},

	getNoShowHtml(last, otd) {
		let html = '<div class="phish-label">No Upcoming Shows</div>';

		if (last) {
			html += `
				<div class="phish-venue" style="margin-top: 20px;">${last.venue}</div>
				<div class="phish-city">${this.formatLocation(last)}</div>
				<div class="phish-date">${last.date}</div>
			`;
		}

		html += this.getSetlistHtml(last, otd);
		return html;
	},
});
