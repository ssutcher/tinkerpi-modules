const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
	start() {
		console.log(`Starting module helper: ${this.name}`);
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "FETCH_PHISH_DATA") {
			console.log(`[${this.name}] Received FETCH_PHISH_DATA, apiKey present: ${!!payload.apiKey}`);
			this.fetchAll(payload);
		}
	},

	async fetchAll(config) {
		const apiKey = config.apiKey;
		if (!apiKey) {
			console.error(`${this.name}: No API key configured`);
			return;
		}

		try {
			console.log(`[${this.name}] Fetching data from phish.net...`);
			const [nextShow, lastSetlist, onThisDay] = await Promise.all([
				this.fetchNextShow(apiKey),
				this.fetchLastSetlist(apiKey),
				this.fetchOnThisDay(apiKey),
			]);

			console.log(`[${this.name}] Data fetched — next: ${nextShow?.date || "none"}, last: ${lastSetlist?.date || "none"}, otd: ${onThisDay?.year || "none"}`);

			this.sendSocketNotification("PHISH_DATA", {
				nextShow,
				lastSetlist,
				onThisDay,
				fetchedAt: new Date().toISOString(),
			});
		} catch (err) {
			console.error(`[${this.name}] fetchAll error:`, err);
		}
	},

	async apiGet(endpoint, apiKey) {
		const url = `https://api.phish.net/v5/${endpoint}?apikey=${apiKey}`;
		try {
			const response = await fetch(url);
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const json = await response.json();
			if (json.error) throw new Error(json.error_message || "API error");
			return json.data || [];
		} catch (err) {
			console.error(`${this.name} API error (${endpoint}):`, err.message);
			return [];
		}
	},

	async fetchNextShow(apiKey) {
		const today = new Date().toISOString().split("T")[0];
		const year = new Date().getFullYear();

		// Check current year and next year for upcoming shows
		let shows = await this.apiGet(`shows/showyear/${year}.json`, apiKey);
		let future = shows.filter((s) => s.showdate > today && s.artistid === 1);

		if (future.length === 0) {
			shows = await this.apiGet(`shows/showyear/${year + 1}.json`, apiKey);
			future = shows.filter((s) => s.showdate > today && s.artistid === 1);
		}

		if (future.length === 0) return null;

		// Sort ascending, take the nearest show
		future.sort((a, b) => a.showdate.localeCompare(b.showdate));
		const show = future[0];

		return {
			date: show.showdate,
			venue: show.venue,
			city: show.city,
			state: show.state,
			country: show.country,
		};
	},

	async fetchLastSetlist(apiKey) {
		const year = new Date().getFullYear();
		const data = await this.apiGet(`setlists/showyear/${year}.json`, apiKey);

		// Filter Phish only
		const phish = data.filter((r) => r.artistid === 1);
		if (phish.length === 0) return null;

		// Group by showid, find the latest show
		const shows = new Map();
		for (const row of phish) {
			if (!shows.has(row.showid)) shows.set(row.showid, []);
			shows.get(row.showid).push(row);
		}

		// Find show with latest date
		let latestId = null;
		let latestDate = "";
		for (const [id, rows] of shows) {
			if (rows[0].showdate > latestDate) {
				latestDate = rows[0].showdate;
				latestId = id;
			}
		}

		const rows = shows.get(latestId);
		if (!rows || rows.length === 0) return null;

		// Sort by position within each set
		rows.sort((a, b) => {
			if (a.set !== b.set) return a.set < b.set ? -1 : 1;
			return a.position - b.position;
		});

		// Build setlist strings grouped by set
		const sets = {};
		for (const row of rows) {
			if (!sets[row.set]) sets[row.set] = [];
			sets[row.set].push(row);
		}

		const formatSet = (songs) =>
			songs.map((s, i) => {
				const next = songs[i + 1];
				const sep = next ? (s.trans_mark || ", ").trimEnd() + " " : "";
				return s.song + sep;
			}).join("");

		const result = {
			date: rows[0].showdate,
			venue: rows[0].venue,
			city: rows[0].city,
			state: rows[0].state,
			sets: {},
		};

		if (sets["1"]) result.sets.s1 = formatSet(sets["1"]);
		if (sets["2"]) result.sets.s2 = formatSet(sets["2"]);
		if (sets["3"]) result.sets.s3 = formatSet(sets["3"]);
		if (sets["e"]) result.sets.encore = formatSet(sets["e"]);
		if (sets["e2"]) result.sets.encore2 = formatSet(sets["e2"]);

		return result;
	},

	async fetchOnThisDay(apiKey) {
		const now = new Date();
		const month = now.getMonth() + 1;
		const day = now.getDate();

		const shows = await this.apiGet(`shows/showmonth/${month}.json`, apiKey);
		const todayShows = shows.filter(
			(s) => s.showday === day && s.artistid === 1
		);

		if (todayShows.length === 0) return null;

		// Pick a random show from this day in history
		const show = todayShows[Math.floor(Math.random() * todayShows.length)];

		return {
			year: show.showyear,
			venue: show.venue,
			city: show.city,
			state: show.state,
		};
	},
});
