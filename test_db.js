const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), 'frontend', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function check() {
  const { data: artists } = await supabase.from('artists').select('*, songs(id, title)');
  if (!artists) return;
  const sorted = artists.sort((a,b) => (b.songs ? b.songs.length : 0) - (a.songs ? a.songs.length : 0));
  console.log("Top artists by song count:");
  for (let i=0; i<3; i++) {
     console.log(sorted[i].name, sorted[i].songs.length);
  }
}

check();
