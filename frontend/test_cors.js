fetch("https://www.westnilebiz.com/songs/Chobo%20-%20Andona256ftTinoBeliz.mp3", { method: "GET" })
  .then(res => console.log("CORS success", res.status))
  .catch(err => console.log("CORS failed", err));
