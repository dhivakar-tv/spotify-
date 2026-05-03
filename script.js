// Authentication Check
if (localStorage.getItem('spotify_logged_in') !== 'true') {
    window.location.href = 'login.html';
}

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('spotify_logged_in');
    window.location.href = 'login.html';
});

// Default songs fallback
const defaultSongs = [
    {
        title: "Turn In The Sun",
        artist: "Simon Herody",
        album: "Singles",
        url: "https://res.cloudinary.com/dpies5g3o/video/upload/q_auto/f_auto/v1777824999/Turn_In_The_Sun_-_Simon_Herody_bhfabh.mp3"
    },
    {
        title: "Taught Her How To Leave",
        artist: "Bill Douglas",
        album: "Singles",
        url: "https://res.cloudinary.com/dpies5g3o/video/upload/q_auto/f_auto/v1777824974/Taught_Her_How_To_Leave_-_Bill_Douglas_ir4qlu.mp3"
    },
    {
        title: "Tonight Again",
        artist: "Rod Kim feat. Mostly Moss",
        album: "Singles",
        url: "https://res.cloudinary.com/dpies5g3o/video/upload/q_auto/f_auto/v1777824969/Tonight_Again_-_Rod_Kim_feat._Mostly_Moss_pqgyfm.mp3"
    },
    {
        title: "Tiny Shell - Blue Deer",
        artist: "Nyles Lannon",
        album: "Singles",
        url: "https://res.cloudinary.com/dpies5g3o/video/upload/q_auto/f_auto/v1777824963/Tiny_Shell_-_Blue_Deer_Nyles_Lannon_px8ubx.mp3"
    },
    {
        title: "The Fog",
        artist: "Trey Xavier, Rod Kim",
        album: "Singles",
        url: "https://res.cloudinary.com/dpies5g3o/video/upload/q_auto/f_auto/v1777824957/The_Fog_-_Trey_Xavier_Rod_Kim_lzvab8.mp3"
    },
    {
        title: "Scratches On The B-Side",
        artist: "National Sweetheart",
        album: "Singles",
        url: "https://res.cloudinary.com/dpies5g3o/video/upload/q_auto/f_auto/v1777824954/Scratches_On_The_B-Side_-_National_Sweetheart_zdpqth.mp3"
    }
];

// Load songs from LocalStorage or use defaults
let songs = JSON.parse(localStorage.getItem('spotify_songs'));
if (!songs || songs.length === 0) {
    songs = [...defaultSongs];
    localStorage.setItem('spotify_songs', JSON.stringify(songs));
}

// Audio elements
let currentAudio = new Audio();
let currentSongIndex = 0;
let isPlaying = false;

// DOM Elements
const songListEl = document.getElementById('song-list');
const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = document.getElementById('play-icon');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const totalDurationEl = document.getElementById('total-duration');

const volumeBar = document.getElementById('volume-bar');

const currentTitleEl = document.getElementById('current-title');
const currentArtistEl = document.getElementById('current-artist');

// Modal Elements
const addModal = document.getElementById('add-song-modal');
const openAddModalBtn = document.getElementById('open-add-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const addSongForm = document.getElementById('add-song-form');

// Format time (seconds to M:SS)
function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Initialize Playlist
function initPlaylist() {
    songListEl.innerHTML = '';
    songs.forEach((song, index) => {
        const div = document.createElement('div');
        div.classList.add('song-item');
        if (index === currentSongIndex) {
            div.classList.add('playing');
        }
        
        div.innerHTML = `
            <div class="song-item-num">${index + 1}</div>
            <div class="song-item-info">
                <div class="song-item-title">${song.title}</div>
                <div class="song-item-artist">${song.artist}</div>
            </div>
            <div class="song-item-album">${song.album}</div>
            <div class="song-item-time" id="time-${index}">--:--</div>
            <div class="delete-icon" data-index="${index}"><i class="fa-solid fa-trash"></i></div>
        `;
        
        // Load metadata to get duration
        const tempAudio = new Audio(song.url);
        tempAudio.addEventListener('loadedmetadata', () => {
            const timeEl = document.getElementById(`time-${index}`);
            if (timeEl) {
                timeEl.textContent = formatTime(tempAudio.duration);
            }
        });

        // Click to play song
        div.addEventListener('click', (e) => {
            // Prevent playing if clicking the delete icon
            if (e.target.closest('.delete-icon')) return;
            
            if (currentSongIndex !== index || !isPlaying) {
                loadSong(index);
                playSong();
            } else {
                pauseSong();
            }
        });

        // Delete song logic
        const deleteBtn = div.querySelector('.delete-icon');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSong(index);
        });

        songListEl.appendChild(div);
    });
}

function deleteSong(index) {
    if (confirm("Are you sure you want to delete this song?")) {
        songs.splice(index, 1);
        localStorage.setItem('spotify_songs', JSON.stringify(songs));
        
        // Handle case where we delete the currently playing song
        if (index === currentSongIndex) {
            pauseSong();
            currentSongIndex = 0; // Reset to start
            if (songs.length > 0) {
                loadSong(0);
            } else {
                // No songs left
                currentTitleEl.textContent = "No songs available";
                currentArtistEl.textContent = "";
                currentAudio.src = "";
            }
        } else if (index < currentSongIndex) {
            currentSongIndex--; // Shift index back to keep playing same song
        }
        
        initPlaylist();
    }
}

function updateActiveSongInList() {
    const items = songListEl.querySelectorAll('.song-item');
    items.forEach((item, index) => {
        if (index === currentSongIndex) {
            item.classList.add('playing');
            // Auto-scroll the playing song into view
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            item.classList.remove('playing');
        }
    });
}

function loadSong(index) {
    if (songs.length === 0) return;
    currentSongIndex = index;
    const song = songs[index];
    currentAudio.src = song.url;
    currentTitleEl.textContent = song.title;
    currentArtistEl.textContent = song.artist;
    
    // Add scroll effect for very long titles
    if (song.title.length > 25) {
        currentTitleEl.classList.add('scroll');
    } else {
        currentTitleEl.classList.remove('scroll');
    }

    updateActiveSongInList();
}

function playSong() {
    if (!currentAudio.src) return;
    isPlaying = true;
    currentAudio.play().catch(e => console.error("Playback prevented:", e));
    playIcon.classList.remove('fa-play');
    playIcon.classList.add('fa-pause');
}

function pauseSong() {
    isPlaying = false;
    currentAudio.pause();
    playIcon.classList.remove('fa-pause');
    playIcon.classList.add('fa-play');
}

function togglePlayPause() {
    if (isPlaying) {
        pauseSong();
    } else {
        if (!currentAudio.src && songs.length > 0) {
            loadSong(0);
        }
        playSong();
    }
}

function nextSong() {
    if (songs.length === 0) return;
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    loadSong(currentSongIndex);
    playSong();
}

function prevSong() {
    if (songs.length === 0) return;
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    loadSong(currentSongIndex);
    playSong();
}

// Event Listeners
playPauseBtn.addEventListener('click', togglePlayPause);
nextBtn.addEventListener('click', nextSong);
prevBtn.addEventListener('click', prevSong);

// Audio Event Listeners for Progress Bar
currentAudio.addEventListener('timeupdate', () => {
    if (currentAudio.duration) {
        const progressPercent = (currentAudio.currentTime / currentAudio.duration) * 100;
        progressBar.value = progressPercent;
        currentTimeEl.textContent = formatTime(currentAudio.currentTime);
        totalDurationEl.textContent = formatTime(currentAudio.duration);

        // Update the CSS variable or direct styling to color track behind thumb
        progressBar.style.background = `linear-gradient(to right, var(--spotify-white) ${progressPercent}%, #535353 ${progressPercent}%)`;
    }
});

currentAudio.addEventListener('loadedmetadata', () => {
    totalDurationEl.textContent = formatTime(currentAudio.duration);
});

currentAudio.addEventListener('ended', nextSong);

// Progress Bar Scrubbing
progressBar.addEventListener('input', (e) => {
    if (!currentAudio.duration) return;
    const scrubTime = (e.target.value / 100) * currentAudio.duration;
    currentAudio.currentTime = scrubTime;
    progressBar.style.background = `linear-gradient(to right, var(--spotify-green) ${e.target.value}%, #535353 ${e.target.value}%)`;
});

// Volume Control
volumeBar.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    currentAudio.volume = volume;
    volumeBar.style.background = `linear-gradient(to right, var(--spotify-white) ${e.target.value}%, #535353 ${e.target.value}%)`;
});

// Modal Event Listeners
openAddModalBtn.addEventListener('click', () => {
    addModal.classList.add('show');
});

closeModalBtn.addEventListener('click', () => {
    addModal.classList.remove('show');
});

// Close modal if clicked outside
window.addEventListener('click', (e) => {
    if (e.target === addModal) {
        addModal.classList.remove('show');
    }
});

// Add Song Form Submit
addSongForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newSong = {
        title: document.getElementById('song-title').value,
        artist: document.getElementById('song-artist').value,
        album: document.getElementById('song-album').value,
        url: document.getElementById('song-url').value
    };

    songs.push(newSong);
    localStorage.setItem('spotify_songs', JSON.stringify(songs));
    
    // Reset form and close modal
    addSongForm.reset();
    addModal.classList.remove('show');
    
    // Refresh list
    initPlaylist();
});

// Setup initial state
initPlaylist();
if (songs.length > 0) {
    loadSong(0); // Pre-load the first song info
}
volumeBar.style.background = `linear-gradient(to right, var(--spotify-white) 100%, #535353 100%)`;
progressBar.style.background = `linear-gradient(to right, var(--spotify-white) 0%, #535353 0%)`;

// Ensure audio is paused to start
currentAudio.volume = 1;
