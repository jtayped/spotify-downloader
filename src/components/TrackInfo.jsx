import Image from "next/image";
import Link from "next/link";
import DownloadTrack from "./buttons/DownloadTrack";
import PlayTrack from "./buttons/PlayTrack";

const TrackInfo = ({ track }) => {
  if (!track) return;

  const artistLinks = track.artists.map((artist) => (
    <Link
      key={artist.id}
      href={artist.external_urls.spotify}
      className="hover:underline"
    >
      {artist.name}
    </Link>
  ));

  const durationString = `${Math.floor(track.duration_ms / 60000)}:${(
    (track.duration_ms % 60000) /
    1000
  )
    .toFixed(0)
    .padStart(2, "0")}`;

  return (
    <div className="flex justify-between items-center text-text">
      <div className="w-full flex items-center justify-between text-text">
        <div className="flex items-center gap-3">
          <Link href={track.external_urls.spotify}>
            <Image
              src={track.album.images[0].url}
              width={50}
              height={50}
              className="rounded w-8 h-8 sm:w-10 sm:h-10"
              alt="Track Cover"
              unoptimized
            />
          </Link>

          <div className="flex flex-col max-w-[125px] md:max-w-[300px] overflow-hidden whitespace-nowrap">
            <Link
              href={track.external_urls.spotify}
              className="font-semibold text-sm md:text-md truncate"
            >
              {track.name}
            </Link>
            <ol className="flex items-center gap-1 text-xs md:text-sm">
              {artistLinks.reduce((prev, curr) => [prev, "·", curr])}
            </ol>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs md:text-sm text-white/50 mr-1 md:mr-2">
            {durationString}
          </span>
          <PlayTrack audioUrl={track.preview_url} />
          <DownloadTrack track={track} />
        </div>
      </div>
    </div>
  );
};

export default TrackInfo;
