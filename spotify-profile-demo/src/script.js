const clientId = "38f1ee602dbe4bffbb05672320a597f1"; // Replace with your client ID
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

if (!code) {
    redirectToAuthCodeFlow(clientId);
} else {
    main(clientId, code);
}

async function main(clientId, code) {
    const Tokens = await getAccessToken(clientId, code);
    const accessToken = Tokens.access_token;
    const refreshToken =Tokens.refresh_token;


    // const profile = await fetchProfile(accessToken);
    // populateUI(profile);
    // let allTracks = await fetchTracks(accessToken);
    // allTracks = jsonToObjects(allTracks);
    // allTracks = await renderTable(allTracks, accessToken)
    // console.log("Size of allTracks (in bytes) " + JSON.stringify(allTracks).length);
    // console.log("allTracks is a " + typeof (allTrack));
    // console.log(allTracks);
    // startPlayback(accessToken);
    
    
    // // Add click event handlers to the table headers
    // $('#trackTable th').on('click', function () {
    //     const columnIndex = $(this).closest('th').index() + 3; // Get the index of the clicked column
    //     console.log(columnIndex);
    
    //     // Retrieve the track object ids from the table
    //     const workingIds = $('#trackTableBody').find('tr').map(function () {
    //         return $(this).attr('id');
    //     }).get();
    
    //     // Build an array of track objects from allTracks whose ids match workingIds and assign to workingTracks
    //     const workingTracks = allTracks.filter(track => workingIds.includes(track.id));
    
    //     // Toggle the sorting direction between ascending and descending
    //     const currentSortOrder = $(this).data('sort-order') || 'asc';
    //     const newSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    //     $(this).data('sort-order', newSortOrder);
    
    //     // Sort the track objects based on the selected column and sort order
    //     workingTracks.sort((a, b) => {
    //         // Access the values in the track objects based on the selected column
    //         const valueA = a[Object.keys(a)[columnIndex]];
    //         const valueB = b[Object.keys(b)[columnIndex]];
    
    //         // Compare the values and return the result for sorting
    //         let comparison = 0;
    //         if (typeof valueA === 'string') {
    //             comparison = valueA.localeCompare(valueB); // Sort strings alphabetically
    //         } else {
    //             comparison = valueA - valueB; // Sort numbers in ascending order
    //         }
    
    //         // Reverse the sort order if descending
    //         if (newSortOrder === 'desc') {
    //             comparison *= -1;
    //         }
    
    //         return comparison;
    //     });
    
    //     // Re-render the table with sorted data
    //     rerenderTable(workingTracks);
    //     console.log("Size of allTracks (in bytes) " + JSON.stringify(allTracks).length);
    //     console.log("allTracks is a " + typeof (allTrack));
    //     console.log(allTracks);
    // });
    
    const playlist_id = '2E38zwRmBqdnuxgpGqE78i'
    songRipper(playlist_id, accessToken, refreshToken);
}

async function songRipper(playlist_id, accessToken, refreshToken) {
    try {
        let songIDs = await IDsFromPlaylist(playlist_id, accessToken);
        for (let id of songIDs) {
            accessToken = await refreshAccessToken(clientId, refreshToken);
            console.log(accessToken);
            let song_info = await getSongInformation(id, accessToken);
            let duration = song_info.duration_ms;
            startPlayback(id, accessToken);
            await wait(duration);
            await wait(10000);
            // await recordSong(duration);
            // stopPlayback(access_token);
            // let track = createTrack();
            // addMetadataToTrack(song_info, track);
            // await exportTrack(track, target_directory);
        }
    } catch (error) {
        // Handle the error here
        console.error("An error occurred:", error.message);
    }
}

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

// IDsFromPlaylist function (playlist_id: string, access_token: string): string[]
async function IDsFromPlaylist(playlist_id, access_token) {
    try {
        let playlist_info = await getPlaylistInformation(playlist_id, access_token);
        let songIDs = [];
        for (let item of playlist_info.tracks.items) {
            songIDs.push(item.track.id);
        }
        return songIDs;
    } catch (error) {
        // Handle the error here
        console.error("An error occurred:", error.message);
        return [];
    }
}

// getPlaylistInformation function (playlist_id: string, access_token: string): PlaylistInformation
async function getPlaylistInformation(playlist_id, access_token) {
    console.log(`Access token: ${access_token}`);
    try {
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlist_id}`, {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        if (response.ok) {
            const playlistInfo = await response.json();
            return playlistInfo;
        } else {
            throw new Error("Failed to fetch playlist information");
        }
    } catch (error) {
        console.error("An error occurred:", error.message, response);
        return null;
    }
}

// getSongInformation function (song_id: string, access_token: string): SongInformation
async function getSongInformation(song_id, access_token) {
    try {
        const response = await fetch(`https://api.spotify.com/v1/tracks/${song_id}`, {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });
        console.log(response);
        if (response.ok) {
            const songInfo = await response.json();
            return songInfo;
        } else {
            throw new Error("Failed to fetch song information");
        }
    } catch (error) {
        console.error("An error occurred:", error.message);
        return null;
    }
}

// startPlayback function (song_id: string, access_token: string):
async function startPlayback(song_id, access_token) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/play', {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uris: [`spotify:track:${song_id}`]
            })
        });

        return response.ok;
    } catch (error) {
        console.error('An error occurred:', error.message);
        return false;
    }
}

export async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("scope", "user-read-private user-read-email user-library-read user-modify-playback-state");
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

    const { access_token, refresh_token } = await result.json();
    console.log(access_token);
    console.log(refresh_token);
    return { access_token, refresh_token };
}

export async function refreshAccessToken(clientId, refreshToken) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);
    params.append("client_id", clientId);
    params.append("code_verifier", verifier);


    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    console.log("access_token");
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
        <td><button class="play-button" data-preview="${trackObject.preview_url}"></button></td>
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
    // Attach event listener to play buttons
    $('.play-button').on('click', function () {
        const previewUrl = $(this).data('preview');
        playAudio(previewUrl);
    });
}

function playAudio(previewUrl) {
    const audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.src = previewUrl;
    audioPlayer.play();
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
    console.log(typeof (trackObjects));
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

// // Start playback on current device
// async function startPlayback(accessToken) {
//     const url = 'https://api.spotify.com/v1/me/player/play';
//     const headers = {
//         'Authorization': `Bearer ${accessToken}`,
//         'Content-Type': 'application/json'
//     };
//     const data = {
//         "context_uri": "spotify:album:5ht7ItJgpBH7W6vJ5BqpPr",
//         "offset": {
//             "position": 5
//         },
//         "position_ms": 0
//     };

//     try {
//         const response = await fetch(url, {
//             method: 'PUT',
//             headers,
//             body: JSON.stringify(data)
//         });
//         console.log('Playback started successfully.');
//     } catch (error) {
//         console.error('Error starting playback:', error);
//     }
// }