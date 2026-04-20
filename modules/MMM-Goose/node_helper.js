const NodeHelper = require("node_helper");

const BASE_URL = "https://elgoose.net/api/v2";

module.exports = NodeHelper.create({
	start() {
		console.log(`Starting module helper: ${this.name}`);
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "GOOSE_FETCH") {
			this.fetchAll(payload);
		}
	},

	async fetchAll(config) {
		try {
			const [latestRes, showsRes] = await Promise.all([
				fetch(`${BASE_URL}/latest.json`),
				fetch(`${BASE_URL}/shows/artist_id/1.json`),
			]);

			const latestData = await latestRes.json();
			const showsData = await showsRes.json();

			const lastShow = this.parseSetlist(latestData.data);

			const today = new Date().toISOString().slice(0, 10);
			const upcoming = showsData.data
				.filter((s) => s.showdate >= today)
				.sort((a, b) => a.showdate.localeCompare(b.showdate));

			const nextShow = upcoming.length > 0 ? upcoming[0] : null;

			this.sendSocketNotification("GOOSE_DATA", {
				lastShow,
				nextShow: nextShow
					? {
							date: nextShow.showdate,
							venue: this.decodeHtml(nextShow.venuename),
							city: `${nextShow.city}, ${nextShow.state}`,
							tour: nextShow.tourname,
						}
					: null,
				upcomingCount: upcoming.length,
			});
		} catch (error) {
			console.error(`${this.name} fetch error:`, error.message);
			this.sendSocketNotification("GOOSE_ERROR", error.message);
		}
	},

	parseSetlist(tracks) {
		if (!tracks || tracks.length === 0) return null;

		const first = tracks[0];
		const sets = {};

		for (const track of tracks) {
			const key = track.setnumber;
			if (!sets[key]) sets[key] = [];
			sets[key].push(track);
		}

		const formatSet = (setTracks) => {
			let result = "";
			for (let i = 0; i < setTracks.length; i++) {
				result += setTracks[i].songname;
				if (i < setTracks.length - 1) {
					const tr = setTracks[i].transition;
					if (tr && tr.trim()) {
						result += tr.includes(">") ? " > " : ", ";
					} else {
						result += ", ";
					}
				}
			}
			return result;
		};

		const result = {
			date: first.showdate,
			venue: this.decodeHtml(first.venuename),
			city: `${first.city}, ${first.state}`,
			tour: first.tourname,
			sets: {},
		};

		for (const [key, setTracks] of Object.entries(sets)) {
			if (key === "e") {
				result.sets.encore = formatSet(setTracks);
			} else {
				result.sets[`s${key}`] = formatSet(setTracks);
			}
		}

		return result;
	},

	decodeHtml(str) {
		return str
			.replace(/&#039;/g, "'")
			.replace(/&amp;/g, "&")
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">")
			.replace(/&quot;/g, '"');
	},
});
