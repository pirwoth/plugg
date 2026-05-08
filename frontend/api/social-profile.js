export default async function handler(req, res) {
  const { id } = req.query;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  let title = "Plugg - Artist Profile";
  let description = "Check out this artist on Plugg.";
  let imageUrl = "https://www.plugg.site/default-cover.jpg";

  if (supabaseUrl && supabaseKey && id) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/artists?id=eq.${id}&select=name,image_url,bio`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      const data = await response.json();
      if (data && data.length > 0) {
        const artist = data[0];
        if (artist.name) title = `${artist.name} on Plugg`;
        if (artist.bio) description = artist.bio;
        if (artist.image_url) imageUrl = artist.image_url;
      }
    } catch (err) {
      console.error("Failed to fetch artist for OG tags", err);
    }
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${description}" />
      <meta property="og:image" content="${imageUrl}" />
      <meta property="og:url" content="https://www.plugg.site/profile/${id}" />
      <meta property="og:type" content="profile" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${title}" />
      <meta name="twitter:description" content="${description}" />
      <meta name="twitter:image" content="${imageUrl}" />
    </head>
    <body>
      <h1>${title}</h1>
      <p>${description}</p>
      <img src="${imageUrl}" alt="${title}" />
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
