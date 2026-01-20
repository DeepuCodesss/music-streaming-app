const audio = document.getElementById("audio");
const songsList = document.getElementById("songs");
const searchInput = document.getElementById("search");

let allSongs = [];


songsList.innerHTML = "<li>Loading songs...</li>";


fetch("/songs-list")
  .then(res => {
    if (!res.ok) throw new Error("Backend not reachable");
    return res.json();
  })
  .then(songs => {
    allSongs = songs;
    renderSongs(allSongs);
  })
  .catch(err => {
    songsList.innerHTML =
      "<li style='color:red'>Backend not running</li>";
    console.error(err);
  });


function renderSongs(songs) {
  songsList.innerHTML = "";

  songs.forEach(song => {
    const li = document.createElement("li");
    li.textContent = song.title;
    li.style.cursor = "pointer";
    li.style.margin = "8px 0";

    li.onclick = () => {
      audio.src = `/songs/${song.file}`;
      audio.play();
    };

    songsList.appendChild(li);
  });
}


searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();

  const filteredSongs = allSongs.filter(song =>
    song.title.toLowerCase().includes(query)
  );

  renderSongs(filteredSongs);
});
