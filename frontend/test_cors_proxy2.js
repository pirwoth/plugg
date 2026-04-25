fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent("https://www.westnilebiz.com/songs/Chobo%20-%20Andona256ftTinoBeliz.mp3"))
  .then(res => {
     console.log("CORS proxy success", res.status, res.headers.get("content-type"));
     return res.blob();
  })
  .then(blob => console.log("Blob size:", blob.size))
  .catch(err => console.log("CORS proxy failed", err));
