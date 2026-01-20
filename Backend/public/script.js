const audio = document.getElementById("audio");
const songsList = document.getElementById("songs");

songsList.innerHTML = "<li>Loading songs...</li>";

fetch("/songs-list")
  .then(res => {
    if (!res.ok) throw new Error("Backend not reachable");
    return res.json();
  })
  .then(songs => {
    songsList.innerHTML = "";

    songs.forEach(song => {
      const li = document.createElement("li");
      li.textContent = song.title;
      li.style.cursor = "pointer";

      li.onclick = () => {
        audio.src = `http://localhost:3000/songs/${song.file}`;
        audio.play();
      };

      songsList.appendChild(li);
    });
  })
  .catch(err => {
    songsList.innerHTML = "<li style='color:red'>Backend not running</li>";
    console.error(err);
  });
