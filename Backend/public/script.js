/*************************************************
 * TAB NAV
 *************************************************/
const miniTitle = document.getElementById("miniTitle");
const tabs = document.querySelectorAll(".tab");
const contents = document.querySelectorAll(".tab-content");

tabs.forEach(tab => {
  tab.onclick = () => {
    tabs.forEach(t => t.classList.remove("active"));
    contents.forEach(c => c.classList.remove("active"));

    tab.classList.add("active");
    const id =
      tab.dataset.tab === "playlists" ? "playlistsTab" : tab.dataset.tab;
    document.getElementById(id)?.classList.add("active");
  };
});

/*************************************************
 * ELEMENTS
 *************************************************/
const audio = document.getElementById("audio");

const songsList = document.getElementById("songs");
const searchInput = document.getElementById("search");
const volumeSlider = document.getElementById("volumeSlider");

const playlistInput = document.getElementById("playlistName");
const createPlaylistBtn = document.getElementById("createPlaylist");
const playlistsList = document.getElementById("playlists");
const playlistSelect = document.getElementById("playlistSelect");

const playPauseBtn = document.getElementById("playPauseBtn");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");
const recentSongsList = document.getElementById("recentSongs");


const youtubeResults = document.getElementById("youtubeResults");


/*************************************************
 * PROGRESS BAR ELEMENTS
 *************************************************/
const progressBar = document.getElementById("progressBar");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");

/*************************************************
 * AUDIO PROGRESS & SEEK
 *************************************************/

// Update progress while playing
audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;

  const percent = (audio.currentTime / audio.duration) * 100;
  progressBar.value = percent;

  currentTimeEl.textContent = formatTime(audio.currentTime);
  durationEl.textContent = formatTime(audio.duration);
});

// Seek when user drags
progressBar.addEventListener("input", () => {
  if (!audio.duration) return;

  const seekTime = (progressBar.value / 100) * audio.duration;
  audio.currentTime = seekTime;
});

// Format seconds → mm:ss
function formatTime(sec) {
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

/*************************************************
 * YOUTUBE API
 *************************************************/
const YT_API_KEY = "AIzaSyD_Ua_hr7Gam0p2pU62cGyWfAyosWlge-c";

/*************************************************
 * STATE
 *************************************************/
let allSongs = [];
let filteredSongs = [];
let playlists = JSON.parse(localStorage.getItem("playlists")) || {};
let activePlaylist = null;

let currentSongFile = null;
let currentLi = null;
let currentIndex = -1;

let visibleCount = 20;
let isShuffle = false;
let repeatMode = 0; // 0 off | 1 repeat all | 2 repeat one
let recentSongs = JSON.parse(localStorage.getItem("recentSongs")) || [];

/*************************************************
 * FETCH LOCAL SONGS
 *************************************************/
fetch("/songs-list")
  .then(res => res.json())
  .then(data => {
    allSongs = data;
    filteredSongs = data;
    renderSongs();
    renderPlaylists();
    renderDropdown();
  });

/*************************************************
 * RENDER SONGS
 *************************************************/
function renderSongs() {
  songsList.innerHTML = "";

  filteredSongs.slice(0, visibleCount).forEach((song, index) => {
    const li = document.createElement("li");
    li.textContent = "▶ " + song.title;

    const btn = document.createElement("button");
    btn.textContent = activePlaylist ? "❌" : "+";
    btn.onclick = e => {
      e.stopPropagation();
      activePlaylist ? removeSong(index) : addToPlaylist(song);
    };

    li.appendChild(btn);
    li.onclick = () => playSong(song, li, index);
    songsList.appendChild(li);
  });
}

/*************************************************
 * VOLUME
 *************************************************/
audio.volume = 0.7;
if (volumeSlider) {
  volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value / 100;
  });
}

/*************************************************
 * PLAY SONG
 *************************************************/
function playSong(song, li, index) {
  currentIndex = index;

  if (currentSongFile === song.file) {
    audio.paused ? audio.play() : audio.pause();
    li.firstChild.textContent = audio.paused
      ? "▶ " + song.title
      : "⏸ " + song.title;
    return;
  }

  if (currentLi) {
    currentLi.classList.remove("active");
    currentLi.firstChild.textContent =
      "▶ " +
      currentLi.firstChild.textContent.replace("▶ ", "").replace("⏸ ", "");
  }

  currentSongFile = song.file;
  currentLi = li;

  audio.src = `/songs/${song.file}`;
  audio.currentTime = 0;
  audio.play();

  li.classList.add("active");
  li.firstChild.textContent = "⏸ " + song.title;

  if (miniTitle) miniTitle.textContent = song.title;

addToRecent({
  id: "local-" + song.file,
  title: song.title,
  url: `/songs/${song.file}`,
  source: "Local Library"
});
}

/*************************************************
 * SEARCH (LOCAL + YOUTUBE)
 *************************************************/
let ytTimer = null;

searchInput.oninput = () => {
  const q = searchInput.value.trim().toLowerCase();

  activePlaylist = null;
  filteredSongs = allSongs.filter(s =>
    s.title.toLowerCase().includes(q)
  );

  visibleCount = 20;
  currentIndex = -1;
  renderSongs();

  clearTimeout(ytTimer);
  ytTimer = setTimeout(() => searchYouTube(q), 400);
};

/*************************************************
 * INFINITE SCROLL
 *************************************************/
window.addEventListener("scroll", () => {
  if (activePlaylist) return;
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    visibleCount += 20;
    renderSongs();
  }
});

/*************************************************
 * AUTOPLAY / SHUFFLE / REPEAT
 *************************************************/
audio.addEventListener("ended", () => {
  if (repeatMode === 2) {
    audio.currentTime = 0;
    audio.play();
    return;
  }
  playNext();
});

function playNext() {
  if (!filteredSongs.length) return;

  currentIndex = isShuffle
    ? Math.floor(Math.random() * filteredSongs.length)
    : currentIndex + 1;

  if (currentIndex >= filteredSongs.length) {
    if (repeatMode === 1) currentIndex = 0;
    else return;
  }

  songsList.children[currentIndex]?.click();
}

function playPrev() {
  if (currentIndex > 0) {
    currentIndex--;
    songsList.children[currentIndex]?.click();
  }
}

/*************************************************
 * CONTROLS
 *************************************************/
playPauseBtn.onclick = () => {
  if (!currentLi) return;
  audio.paused ? audio.play() : audio.pause();
};

nextBtn.onclick = playNext;
prevBtn.onclick = playPrev;

shuffleBtn.onclick = () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle("active", isShuffle);
};

repeatBtn.onclick = () => {
  repeatMode = (repeatMode + 1) % 3;
  repeatBtn.textContent =
    repeatMode === 0 ? "🔁" : repeatMode === 1 ? "🔁 All" : "🔂 One";
};

/*************************************************
 * PLAYLISTS
 *************************************************/
createPlaylistBtn.onclick = () => {
  const name = playlistInput.value.trim();
  if (!name || playlists[name]) return;

  playlists[name] = [];
  save();
  playlistInput.value = "";
  renderPlaylists();
  renderDropdown();
};

function addToPlaylist(song) {
  const name = playlistSelect.value;
  if (!name) return alert("Select playlist");
  playlists[name].push(song);
  save();
}

function removeSong(index) {
  playlists[activePlaylist].splice(index, 1);
  save();
  filteredSongs = playlists[activePlaylist];
  visibleCount = filteredSongs.length;
  renderSongs();
}

function renderPlaylists() {
  playlistsList.innerHTML = "";

  Object.keys(playlists).forEach(name => {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = name;
    span.onclick = () => {
      activePlaylist = name;
      filteredSongs = playlists[name];
      visibleCount = filteredSongs.length;
      renderSongs();
    };

    const del = document.createElement("button");
    del.textContent = "🗑";
    del.onclick = () => {
      if (confirm("Delete playlist?")) {
        delete playlists[name];
        activePlaylist = null;
        filteredSongs = allSongs;
        save();
        renderPlaylists();
        renderDropdown();
        renderSongs();
      }
    };

    li.append(span, del);
    playlistsList.appendChild(li);
  });
}

function renderDropdown() {
  playlistSelect.innerHTML = `<option value="">Select playlist</option>`;
  Object.keys(playlists).forEach(p => {
    const o = document.createElement("option");
    o.value = p;
    o.textContent = p;
    playlistSelect.appendChild(o);
  });
}

function save() {
  localStorage.setItem("playlists", JSON.stringify(playlists));
}

/*************************************************
 * YOUTUBE SEARCH (LEGAL)
 *************************************************/
async function searchYouTube(query) {
  if (!query || !youtubeResults) {
    if (youtubeResults) youtubeResults.innerHTML = "";
    return;
  }

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(
    query
  )}&key=${YT_API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    youtubeResults.innerHTML = "";

    data.items?.forEach(item => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${item.snippet.title}</strong><br>
        <small>${item.snippet.channelTitle}</small>
      `;
      li.onclick = () =>
        window.open(
          "https://www.youtube.com/watch?v=" + item.id.videoId,
          "_blank"
        );
      youtubeResults.appendChild(li);
    });
  } catch (e) {
    console.error("YouTube error", e);
  }
}
/*************************************************
 * INTERNET ARCHIVE (NO API KEY REQUIRED)
 *************************************************/
const archiveSearchInput = document.getElementById("archiveSearch");
const archiveSongs = document.getElementById("archiveSongs");

if (archiveSearchInput) {
  archiveSearchInput.addEventListener("input", () => {
    const q = archiveSearchInput.value.trim();
    if (q.length > 2) searchArchive(q);
  });
}

async function searchArchive(query) {
  archiveSongs.innerHTML = "<li>Searching...</li>";

  const searchUrl =
    "https://archive.org/advancedsearch.php" +
    "?q=" + encodeURIComponent(query + " AND mediatype:audio") +
    "&fl[]=identifier&fl[]=title&fl[]=creator" +
    "&rows=20&output=json";

  try {
    const res = await fetch(searchUrl);
    const data = await res.json();

    archiveSongs.innerHTML = "";

    for (const doc of data.response.docs) {
      loadArchiveItem(doc);
    }
  } catch (err) {
    archiveSongs.innerHTML = "<li>Error loading results</li>";
  }
}

async function loadArchiveItem(item) {
  const metaUrl = `https://archive.org/metadata/${item.identifier}`;
  const res = await fetch(metaUrl);
  const meta = await res.json();

  if (!meta.files) return;

  const audioFile = meta.files.find(f =>
    f.format && f.format.toLowerCase().includes("mp3")
  );

  if (!audioFile) return;

  const li = document.createElement("li");
  li.innerHTML = `
    ▶ <strong>${item.title || "Unknown title"}</strong><br>
    <small>${item.creator || "Unknown artist"} • Internet Archive</small>
  `;

 li.onclick = () => {
  const url = `https://archive.org/download/${item.identifier}/${audioFile.name}`;
  audio.src = url;
  audio.play();

  if (miniTitle) miniTitle.textContent = item.title || "Internet Archive";

  addToRecent({
    id: "archive-" + item.identifier,
    title: item.title || "Internet Archive",
    url,
    source: "Internet Archive"
  });
};


  archiveSongs.appendChild(li);
}
/*************************************************
 * LOAD DEFAULT ARCHIVE SONGS
 *************************************************/
window.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("archiveSongs")) {
    loadDefaultArchive();
  }
});

async function loadDefaultArchive() {
  const archiveSongs = document.getElementById("archiveSongs");
  archiveSongs.innerHTML = "<li>Loading free music…</li>";

  const url =
    "https://archive.org/advancedsearch.php" +
    "?q=collection:(opensource_audio OR netlabels)" +
    "&fl[]=identifier&fl[]=title&fl[]=creator" +
    "&rows=50&output=json";

  try {
    const res = await fetch(url);
    const data = await res.json();

    archiveSongs.innerHTML = "";
    data.response.docs.forEach(loadArchiveItem);
  } catch {
    archiveSongs.innerHTML = "<li>Unable to load archive music</li>";
  }
}

/*************************************************
 * ===== SAFE ADDITIONS (NO REMOVALS) =====
 * Purpose:
 * 1. Keep Home songs visible after Archive usage
 * 2. Make Archive songs use SAME player state
 *************************************************/

/* ---------- RESTORE HOME SONGS WHEN TAB CHANGES ---------- */
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    if (tab.dataset.tab === "home") {
      // restore local songs safely
      filteredSongs = allSongs;
      visibleCount = 20;
      currentIndex = -1;
      renderSongs();
    }
  });
});

/* ---------- ARCHIVE PLAY SHOULD INTEGRATE WITH PLAYER ---------- */
/* override ONLY behavior on click, not existing logic */
function playArchiveSongSafe(url, title) {
  // reset local state safely
  currentSongFile = url;
  currentLi = null;
  currentIndex = -1;

  audio.src = url;
  audio.currentTime = 0;
  audio.play();

  if (miniTitle) miniTitle.textContent = title || "Internet Archive";
}

/* ---------- PATCH ARCHIVE ITEM CLICK (NON-DESTRUCTIVE) ---------- */
const __oldLoadArchiveItem = loadArchiveItem;

loadArchiveItem = async function (item) {
  const metaUrl = `https://archive.org/metadata/${item.identifier}`;
  const res = await fetch(metaUrl);
  const meta = await res.json();

  if (!meta.files) return;

  const audioFile = meta.files.find(f =>
    f.format && f.format.toLowerCase().includes("mp3")
  );

  if (!audioFile) return;

  const li = document.createElement("li");
  li.innerHTML = `
    ▶ <strong>${item.title || "Unknown title"}</strong><br>
    <small>${item.creator || "Unknown artist"} • Internet Archive</small>
  `;

  li.onclick = () => {
    playArchiveSongSafe(
      `https://archive.org/download/${item.identifier}/${audioFile.name}`,
      item.title || "Internet Archive"
    );
  };

  archiveSongs.appendChild(li);
};
/*************************************************
 * ===== ARCHIVE PLAYBACK FIX (SAFE ADDITION) =====
 * Fixes: Archive songs not playing due to browser restrictions
 *************************************************/

function safePlayAudio(url, title) {
  // stop anything currently playing
  audio.pause();

  // reset source
  audio.src = url;
  audio.load();

  // update UI
  if (miniTitle) miniTitle.textContent = title || "Internet Archive";

  // force user‑gesture‑safe play
  const playPromise = audio.play();

  if (playPromise !== undefined) {
    playPromise.catch(err => {
      console.warn("Autoplay blocked, retrying on user gesture");

      // retry on next click anywhere
      const retry = () => {
        audio.play();
        document.removeEventListener("click", retry);
      };

      document.addEventListener("click", retry);
    });
  }
}

/* ---------- PATCH ARCHIVE CLICK (NON‑DESTRUCTIVE) ---------- */
const __originalLoadArchiveItem = loadArchiveItem;

loadArchiveItem = async function (item) {
  const metaUrl = `https://archive.org/metadata/${item.identifier}`;
  const res = await fetch(metaUrl);
  const meta = await res.json();

  if (!meta.files) return;

  const audioFile = meta.files.find(f =>
    f.format && f.format.toLowerCase().includes("mp3")
  );

  if (!audioFile) return;

  const li = document.createElement("li");
  li.innerHTML = `
    ▶ <strong>${item.title || "Unknown title"}</strong><br>
    <small>${item.creator || "Unknown artist"} • Internet Archive</small>
  `;

  li.addEventListener("click", () => {
    safePlayAudio(
      `https://archive.org/download/${item.identifier}/${audioFile.name}`,
      item.title || "Internet Archive"
    );
  });

  archiveSongs.appendChild(li);
};
function addToRecent(songObj) {
  // remove duplicates
  recentSongs = recentSongs.filter(s => s.id !== songObj.id);

  // add to top
  recentSongs.unshift(songObj);

  // limit to 20
  if (recentSongs.length > 20) recentSongs.pop();

  localStorage.setItem("recentSongs", JSON.stringify(recentSongs));
  renderRecent();
}

function renderRecent() {
  if (!recentSongsList) return;

  recentSongsList.innerHTML = "";

  if (recentSongs.length === 0) {
    recentSongsList.innerHTML = "<li>No songs played yet</li>";
    return;
  }

  recentSongs.forEach(song => {
    const li = document.createElement("li");
    li.innerHTML = `▶ <strong>${song.title}</strong><br>
      <small>${song.source}</small>`;

   li.onclick = () => {
  currentSongFile = song.url;
  currentLi = null;
  currentIndex = -1;

  audio.src = song.url;
  audio.currentTime = 0;
  audio.play();

  if (miniTitle) miniTitle.textContent = song.title;
};


    recentSongsList.appendChild(li);
  });
}
/*************************************************
 * AUTO‑RENDER RECENTLY PLAYED ON LOAD
 *************************************************/
window.addEventListener("DOMContentLoaded", () => {
  if (recentSongs && recentSongs.length > 0) {
    renderRecent();
  }
});
window.loadArchiveItem = loadArchiveItem;

/*************************************************
 * KEYBOARD SHORTCUTS (PLAYER CONTROLS)
 *************************************************/
document.addEventListener("keydown", (e) => {

  // Ignore typing inside inputs
  if (
    e.target.tagName === "INPUT" ||
    e.target.tagName === "TEXTAREA"
  ) {
    return;
  }

  switch (e.code) {

    // ▶ Play / Pause
    case "Space":
      e.preventDefault(); // ⛔ stop page scroll
      if (!audio.src) return;
      audio.paused ? audio.play() : audio.pause();
      break;

    // ⏭ Next track
    case "KeyN":
      playNext();
      break;

    // ⏮ Previous track
    case "KeyP":
      playPrev();
      break;

    // ⏪ Seek backward 5s
    case "ArrowLeft":
      e.preventDefault();
      audio.currentTime = Math.max(0, audio.currentTime - 5);
      break;

    // ⏩ Seek forward 5s
    case "ArrowRight":
      e.preventDefault();
      audio.currentTime = Math.min(
        audio.duration || 0,
        audio.currentTime + 5
      );
      break;

    // 🔊 Volume up
    case "ArrowUp":
      e.preventDefault();
      audio.volume = Math.min(1, audio.volume + 0.05);
      if (volumeSlider) volumeSlider.value = audio.volume * 100;
      break;

    // 🔉 Volume down
    case "ArrowDown":
      e.preventDefault();
      audio.volume = Math.max(0, audio.volume - 0.05);
      if (volumeSlider) volumeSlider.value = audio.volume * 100;
      break;
  }
});
