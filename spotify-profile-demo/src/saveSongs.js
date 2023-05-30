
// Assuming you have a way to retrieve the playlist tracks based on the playlistId
playlistId = '3CcuzwLtKF2tRH7M0cqgtx'
const playlistTracks = getPlaylistTracks(playlistId);

if (!playlistTracks || playlistTracks.length === 0) {
    console.log('Playlist tracks not found.');
}

// Extract the necessary information from each playlist track and add it to the liked songs
for (const track of playlistTracks) {
    const songId = track.id;
    const songName = track.name;
    const artistList = track.artists.map(artist => artist.name);
    const duration = track.duration_ms;
    // Add any other required information

    // Assuming you have a function to add a song to the liked songs
    addSongToLikedSongs(songId, songName, artistList, duration);
}

console.log('All playlist songs added to liked songs.');


async function addSongToLikedSongs(songId) {
    // Make a request to the Spotify API to add the song to the user's liked songs
    const result = await fetch(`https://api.spotify.com/v1/me/tracks?ids=${songId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    if (result.ok) {
        console.log('Song added to liked songs successfully.');
    } else {
        console.log('Failed to add song to liked songs.');
    }
}

async function getPlaylistTracks(playlistId, accessToken) {
    const result = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (result.ok) {
        const data = await result.json();
        return data.items.map(item => item.track);
    } else {
        console.log('Failed to retrieve playlist tracks.');
        return [];
    }
}
