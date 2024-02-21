import Image from "next/image";
import Link from "next/link";
import DownloadPlaylist from "./buttons/DownloadPlaylist";

const PlaylistInfo = ({ playlist }) => {
  return (
    <header className="bg-white/5 border border-white/10 w-full backdrop-blur-md p-5 rounded-xl flex gap-5 max-h-[305px]">
      <Link href={playlist.external_urls.spotify} aria-label="Spotify Playlist">
        <div className="flex-shrink-0 w-52 h-52 relative rounded-lg overflow-hidden">
          <Image
            src={playlist.images[0].url}
            width={208}
            height={208}
            priority={1}
            alt="Playlist Cover"
          />
        </div>
      </Link>
      <div className="flex flex-col justify-between">
        <div className="text-white">
          <h1 className="font-bold text-2xl line-clamp-1">{playlist.name}</h1>
          <p className="line-clamp-5">{playlist.description}</p>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-white/80">
          <DownloadPlaylist playlist={playlist} />
          <div className="flex flex-col text-xs">
            <p>by {playlist.owner.display_name}</p>
            <p>{playlist.followers.total} likes</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PlaylistInfo;
