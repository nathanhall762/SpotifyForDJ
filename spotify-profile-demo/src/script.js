const clientId = "38f1ee602dbe4bffbb05672320a597f1"; // Replace with your client ID
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

if (!code) {
    redirectToAuthCodeFlow(clientId);
} else {
    const accessToken = await getAccessToken(clientId, code);
    const profile = await fetchProfile(accessToken);
    populateUI(profile);
    let allTracks = await fetchTracks(accessToken);
    allTracks = jsonToObjects(allTracks);
    console.log("Size of allTracks (in bytes) " + JSON.stringify(allTracks).length);
    allTracks = await renderTable(allTracks, accessToken)
    console.log("allTracks is a " + typeof(allTrack));
    console.log(allTracks);

    // Add click event handlers to the table headers
$('#trackTable th').on('click', function () {
    const columnIndex = $(this).closest('th').index() + 3; // Get the index of the clicked column

    // Retrieve the track object ids from the table
    const workingIds = $('#trackTableBody').find('tr').map(function () {
        return $(this).attr('id');
    }).get();

    // Build an array of track objects from allTracks whose ids match workingIds and assign to workingTracks
    const workingTracks = allTracks.filter(track => workingIds.includes(track.id));

    // Sort the track objects based on the selected column
    workingTracks.sort((a, b) => {
        // Access the values in the track objects based on the selected column
        const valueA = a[Object.keys(a)[columnIndex]];
        const valueB = b[Object.keys(b)[columnIndex]];

        // Compare the values and return the result for sorting
        if (typeof valueA === 'string') {
            return valueA.localeCompare(valueB); // Sort strings alphabetically
        } else {
            return valueA - valueB; // Sort numbers in ascending order
        }
    });

    console.log(workingTracks);

    // Re-render the table with sorted data
    rerenderTable(workingTracks);
});

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

function jsonToObjects(allTracks) {
    const tracks = [];

    for (let i = 0; i < allTracks.length; i++) {
        const jsonTrack = allTracks[i];
        const { added_at, track } = jsonTrack;
        const { album, artists, name, duration_ms, popularity, preview_url, id } = track;

        const artistObjects = [];
        for (let j = 0; j < artists.length; j++) {
            const artist = artists[j];
            artistObjects.push({
                name: artist.name,
                id: artist.id
            });
        }

        const trackObj = {
            added_at,
            album,
            artists: artistObjects,
            name,
            duration_ms,
            popularity,
            preview_url,
            id
        };

        tracks.push(trackObj);
    }

    console.log(tracks);
    return tracks;
}

// Add Table Header Row
function makeTableHeaderRow() {
    $('#TrackInfoSection').append(`
        <table id="trackTable">
            <thead>
                <tr>
                    <th>Track Title</th>
                    <th>Artist Name(s)</th>
                    <th>Duration (ms)</th>
                    <th>Popularity</th>
                    <th>Preview URL</th>
                    <th>Acousticness</th>
                    <th>Danceability</th>
                    <th>Energy</th>
                    <th>Instrumentalness</th>
                    <th>Key</th>
                    <th>Liveness</th>
                    <th>Loudness</th>
                    <th>Speechiness</th>
                    <th>Tempo</th>
                    <th>Time Signature</th>
                    <th>Valence</th>
                </tr>
            </thead>
            <tbody id="trackTableBody"></tbody>
        </table>
    `);
}


// Add Song Rows
function addSongRows(tracks, targetElement) {
    for (const trackObject of tracks) {
        const artistList = [];
        if (trackObject.artists && Array.isArray(trackObject.artists)) {
            for (const artist of trackObject.artists) {
                artistList.push(artist.name);
            }
        }
        $(targetElement).append(`
        <tr id="${trackObject.id}">
        <td>${trackObject.name}</td>
        <td>${artistList.join(', ')}</td>
        <td>${trackObject.duration_ms}</td>
        <td>${trackObject.popularity}</td>
        <td><a href="${trackObject.preview_url}">Play Song</a></td>
        <td>${trackObject.acousticness}</td>
        <td>${trackObject.danceability}</td>
        <td>${trackObject.energy}</td>
        <td>${trackObject.instrumentalness}</td>
        <td>${trackObject.key}</td>
        <td>${trackObject.liveness}</td>
        <td>${trackObject.loudness}</td>
        <td>${trackObject.speechiness}</td>
        <td>${trackObject.tempo}</td>
        <td>${trackObject.time_signature}</td>
        <td>${trackObject.valence}</td>
        </tr>
      `);
    }
}

// Function to render the table with initial full dataset and assign audio features to track objects
async function renderTable(trackObjects, accessToken) {
    console.log('rendering table...');
    makeTableHeaderRow();
    const tableBody = $('#trackTableBody');
    tableBody.empty(); // Clear the table body

    // Fetch audio features using trackObject ids
    const trackIds = trackObjects.map(track => track.id);
    const audioFeatures = await fetchAudioFeatures(accessToken, trackIds);
    // Add audio features to corresponding track objects
    trackObjects.forEach(trackObj => {
        const audioFeature = audioFeatures.find(feature => feature.id === trackObj.id);
        if (audioFeature) {
            // Add audio feature properties to track object
            trackObj.acousticness = audioFeature.acousticness;
            trackObj.danceability = audioFeature.danceability;
            trackObj.energy = audioFeature.energy;
            trackObj.instrumentalness = audioFeature.instrumentalness;
            trackObj.key = audioFeature.key;
            trackObj.liveness = audioFeature.liveness;
            trackObj.loudness = audioFeature.loudness;
            trackObj.speechiness = audioFeature.speechiness;
            trackObj.tempo = audioFeature.tempo;
            trackObj.time_signature = audioFeature.time_signature;
            trackObj.valence = audioFeature.valence;
        }
    });
    console.log(typeof(trackObjects));
    await addSongRows(trackObjects, tableBody);
    console.log('table rendered successfully');
    return trackObjects;
}

// Function to rerender the table with updated data
function rerenderTable(trackObjects) {
    console.log('re-rendering table...');
    const tableBody = $('#trackTableBody');
    tableBody.empty(); // Clear the table body

    addSongRows(trackObjects, tableBody);
    console.log('table re-rendered successfully');
}

// Get Audio Features
async function fetchAudioFeatures(token, trackIds) {
    const audioFeatures = [];

    // Split the track IDs into chunks of 100
    const chunks = [];
    while (trackIds.length) {
        chunks.push(trackIds.splice(0, 100));
    }

    // Fetch audio features for each chunk of track IDs
    for (const chunk of chunks) {
        const response = await fetch(
            `https://api.spotify.com/v1/audio-features/?ids=${chunk.join(',')}`,
            {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        const data = await response.json();
        audioFeatures.push(...data.audio_features);
    }

    return audioFeatures;
}
