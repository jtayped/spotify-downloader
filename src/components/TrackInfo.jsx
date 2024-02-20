import Image from "next/image";
import Link from "next/link";
import DownloadTrack from "./buttons/DownloadTrack";

const TrackInfo = ({ track }) => {
  const artistLinks = track.artists.map((artist) => (
    <Link key={artist.id} href={artist.external_urls.spotify}>
      {artist.name}
    </Link>
  ));

  return (
    <div className="flex justify-between items-center text-text">
      <div className="w-full flex items-center justify-between text-text">
        <div className="flex items-center gap-3">
          <Image
            src={track.album.images[0].url}
            width={50}
            height={50}
            className="rounded"
            alt="Track Cover"
          />
          <div className="flex flex-col max-w-[300px] overflow-hidden whitespace-nowrap">
            <p className="font-semibold">{track.name}</p>
            <ol className="flex items-center gap-1 text-sm">
              {artistLinks.reduce((prev, curr) => [prev, "·", curr])}
            </ol>
          </div>
        </div>
        <div>
          <DownloadTrack track={track} />
        </div>
      </div>
    </div>
  );
};

export default TrackInfo;
