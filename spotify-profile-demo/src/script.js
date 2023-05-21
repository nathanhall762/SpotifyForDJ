const clientId = "38f1ee602dbe4bffbb05672320a597f1"; // Replace with your client ID
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

if (!code) {
    redirectToAuthCodeFlow(clientId);
} else {
    const accessToken = await getAccessToken(clientId, code);
    const profile = await fetchProfile(accessToken);
    console.log("Profile info: " + JSON.stringify(profile)); // Profile data logs to console
    populateUI(profile);
    const allTracks = await fetchTracks(accessToken);
    console.log("All Tracks: " + JSON.stringify(allTracks)); // Track data logs to console
    console.log("Size of allTracks (in bytes) " + JSON.stringify(allTracks).length);
    makeTableHeaderRow();
    addSongRows(allTracks)
}

export async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("scope", "user-read-private user-read-email user-library-read");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}


export async function getAccessToken(clientId, code) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("code_verifier", verifier);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    return access_token;
}

async function fetchProfile(token) {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

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


function populateUI(profile) {
    $('#displayName').text(profile.display_name);
    if (profile.images[0]) {
        const profileImage = $('<img>').attr('src', profile.images[0].url).attr('width', 200).attr('height', 200);
        $('#avatar').append(profileImage);
        $('#imgUrl').text(profile.images[0].url);
    }
    $('#id').text(profile.id);
    $('#email').text(profile.email);
    $('#uri').text(profile.uri).attr('href', profile.external_urls.spotify);
    $('#url').text(profile.href).attr('href', profile.href);
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
            <tbody id=trackTableBody></tbody>
	</table>
	`);
}

// Add Song Rows
function addSongRows(tracks) {
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
		$('#trackTableBody').append(`
		<tr id="${song.id}">
		<td>${song.name}</td>
		<td>${song.getArtistNames()}</td>
		<td>${song.durationMs}</td>
		<td>${song.popularity}</td>
		<td><a href="${song.previewUrl}">Play Song</a></td>
		<td><a href="${song.externalUrl}" target="_blank">Go To Song</a></td>
		<td>${song.id}</td>
		</tr>
		`);
		idList.push(song.id);
	}
	console.log(idList);
	return idList; // returns list of all song IDs
}
