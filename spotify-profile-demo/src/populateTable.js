async function fetchTracks(token) {
	let allTracks = [];
	let offset = 0;
	let limit = 50;
	let total = Infinity;

	while (offset < total) {
		const result = await fetch(
			`https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`,
			{
				method: "GET",
				headers: { Authorization: `Bearer ${token}` },
			}
		);

		const data = await result.json();
		allTracks = allTracks.concat(data.items);
		total = data.total;
		offset += limit;
	}

	return allTracks;
}

function jsonToObjects(alltracks) {
	// Create an empty array to store track objects
	const tracks = [];
	
	// Iterate over each object in the JSON response
	for (let i = 0; i < jsonResponse.length; i++) {
		const jsonTrack = jsonResponse[i];
	
		// Extract the relevant properties to create a track object
		const { added_at, track } = jsonTrack;
		const { album, artists, name, duration_ms, popularity, preview_url } = track;
	
		// Create a new track object
		const trackObj = {
			added_at,
			album,
			artists,
			name,
			duration_ms,
			popularity,
			preview_url
		};
	
		// Store the track object in the array
		tracks.push(trackObj);
	}
}

// Now the tracks array contains individual track objects
console.log(tracks);

class Track {
	constructor(name, artists, durationMs, popularity, previewUrl, externalUrl, id) {
		this.name = name;
		this.artists = artists;
		this.durationMs = durationMs;
		this.popularity = popularity;
		this.previewUrl = previewUrl;
		this.externalUrl = externalUrl;
		this.id = id;
	}

	getArtistNames() {
		return this.artists.map(artist => artist.name).join(", ");
	}
}

// Add Table Header Row
function makeTableHeaderRow() {
	$('#TrackInfoSection').append(`
	<table id="trackTable">
		<thead>
		<tr>
			<th>Track Title</th>
			<th>Artist Name(s)</th>
			<th>Duration</th>
			<th>Popularity</th>
			<th>Preview URL</th>
			<th>Spotify URL</th>
			<th>Track ID</th>
		</tr>
		</thead>
		<tbody></tbody>
	</table>
	`);
}

// Add Song Rows
function addSongRows() {
	let idList = [];
	for (const trackItem of tracks) {
		var song = new Track(
			trackItem.track.name,
			trackItem.track.artists,
			trackItem.track.duration_ms,
			trackItem.track.popularity,
			trackItem.track.preview_url,
			trackItem.track.external_urls.spotify,
			trackItem.track.id
		);
		$('#TrackInfoSection').append(`
		<tr id="${song.id}">
		<td>${song.name}</td>
		<td>${song.getArtistNames()}</td>
		<td>${song.durationMs}</td>
		<td>${song.popularity}</td>
		<td><a href="${song.previewUrl}" target="_blank">${song.previewUrl}</a></td>
		<td><a href="${song.externalUrl}" target="_blank">${song.externalUrl}</a></td>
		<td>${song.id}</td>
		</tr>
		`);
		idList.push(song.id);
	}
	console.log(idList);
	return idList; // returns list of all song IDs
}