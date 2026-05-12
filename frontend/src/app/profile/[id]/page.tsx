import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import ArtistProfileClient from "./ArtistProfileClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data: artist } = await supabase
    .from('artists')
    .select('name, image_url, bio')
    .eq('id', id)
    .single();

  if (!artist) {
    return {
      title: 'Artist Not Found | Plugg',
      description: 'The requested artist profile could not be found.',
    };
  }

  return {
    title: `${artist.name} | Plugg`,
    description: artist.bio || `Listen to ${artist.name} on Plugg`,
    openGraph: {
      title: `${artist.name} | Plugg`,
      description: artist.bio || `Listen to ${artist.name} on Plugg`,
      images: artist.image_url ? [
        {
          url: artist.image_url,
          width: 800,
          height: 800,
          alt: artist.name,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${artist.name} | Plugg`,
      description: artist.bio || `Listen to ${artist.name} on Plugg`,
      images: artist.image_url ? [artist.image_url] : [],
    },
  };
}

export default async function ArtistProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArtistProfileClient id={id} />;
}
