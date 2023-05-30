const clientId = "38f1ee602dbe4bffbb05672320a597f1"; // Replace with your client ID
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

if (!code) {
    redirectToAuthCodeFlow(clientId);
} else {
    const accessToken = await getAccessToken(clientId, code);
	// Call the songRecorder function with access token
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

	const { access_token } = await result.json();
	return access_token;
}

// songRipper function (playlist_id: string, access_token: string): void
function songRipper(playlist_id, access_token) {
	if (isValidPlaylistId(playlist_id)) {
	  try {
		let songIDs = IDsFromPlaylist(playlist_id, access_token);
		for (let id of songIDs) {
		  let song_info = getSongInformation(id, access_token);
		  startRecordingAboveThreshold();
		  startPlayback(id, access_token);
		  if (playbackStarted() && !recordingStarted()) {
			throw new Error("Recording did not start");
		  }
		  let duration = song_info.duration_ms;
		  recordSong(duration);
		  let track = createTrack();
		  addMetadataToTrack(song_info, track);
		  exportTrack(track, target_directory);
		}
	  } catch (error) {
		// Handle the error here
		console.error("An error occurred:", error.message);
	  }
	} else {
	  console.error("Invalid playlist ID");
	}
  }
  
  // isValidPlaylistId function (playlist_id: string): boolean
  function isValidPlaylistId(playlist_id) {
	// Check if the playlist_id is a non-empty string
	if (!playlist_id || typeof playlist_id !== "string" || playlist_id.length !== 22) {
	  return false;
	}
	// For each character in playlist_id
	for (let i = 0; i < playlist_id.length; i++) {
	  let char = playlist_id[i];
	  // If the character is not alphanumeric (A-Z, a-z, 0-9), return false
	  if (!isAlphaNumeric(char)) {
		return false;
	  }
	}
	return true;
  }
  
  // IDsFromPlaylist function (playlist_id: string, access_token: string): string[]
  function IDsFromPlaylist(playlist_id, access_token) {
	try {
	  let playlist_info = getPlaylistInformation(playlist_id, access_token);
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
  function getPlaylistInformation(playlist_id, access_token) {
	try {
	  // Make Spotify API request to get playlist information
	  // Return the response containing the playlist information
	} catch (error) {
	  // Handle the error here
	  console.error("An error occurred:", error.message);
	  return null;
	}
  }
  
  // getSongInformation function (song_id: string, access_token: string): SongInformation
  function getSongInformation(song_id, access_token) {
	try {
	  // Make Spotify API request to get song information
	  // Return the response containing the song information
	} catch (error) {
	  // Handle the error here
	  console.error("An error occurred:", error.message);
	  return null;
	}
  }
  
  // startPlayback function (song_id: string, access_token: string): boolean
  function startPlayback(song_id, access_token) {
	try {
	  // Make Spotify API request to start playback of the song on the current device
	  // Return true if the playback was successfully started; otherwise, false
	} catch (error) {
	  // Handle the error here
	  console.error("An error occurred:", error.message);
	  return false;
	}
  }
  
  // recordSong function (duration: number): void
  function recordSong(duration) {
	try {
	  // Start recording audio for the specified duration
	  // Save the recorded audio to a file or perform any other required operations
	} catch (error) {
	  // Handle the error here
	  console.error("An error occurred:", error.message);
	}
  }
  
  // createTrack function (): Track
  function createTrack() {
	// Return a new instance of the Track object
  }
  
  // addMetadataToTrack function (song_info: SongInformation, track: Track): void
  function addMetadataToTrack(song_info, track) {
	try {
	  track.album = song_info.album.name;
	  track.artists = song_info.artists.map(artist => artist.name);
	  track.genres = song_info.album.genres;
	  // Add other relevant metadata to the track object
	} catch (error) {
	  // Handle the error here
	  console.error("An error occurred:", error.message);
	}
  }
  
  // exportTrack function (track: Track, target_directory: string): void
  function exportTrack(track, target_directory) {
	try {
	  // Export the track object or save it to a file in the specified target_directory
	} catch (error) {
	  // Handle the error here
	  console.error("An error occurred:", error.message);
	}
  }
  
  // Utility function: isAlphaNumeric function (char: string): boolean
  function isAlphaNumeric(char) {
	return /^[a-zA-Z0-9]+$/.test(char);
  }
  
  // Utility function: playbackStarted function (): boolean
  function playbackStarted() {
	// Return whether the playback has started or not
  }
  
  // Utility function: recordingStarted function (): boolean
  function recordingStarted() {
	// Return whether the recording has started or not
  }

//   Please note that this pseudocode assumes the existence of certain utility functions (isAlphaNumeric, playbackStarted, recordingStarted) and objects (Track) that you need to define and implement according to your requirements and the available libraries or frameworks you are using.
