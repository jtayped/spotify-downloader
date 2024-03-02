import { IoLogoGithub } from "react-icons/io";
import Search from "@/components/Search";
import Link from "next/link";

const Home = async () => {
  return (
    <main className="w-full h-full flex items-center justify-center">
      <div className="px-5 w-full md:w-[700px] space-y-5">
        <div className="text-text md:w-4/5">
          <span className="text-xs tracking-widest">
            by <Link href="https://joeltaylor.business">Joel Taylor</Link>
          </span>
          <h1 className="text-4xl font-bold">Spotify Downloader</h1>
          <p className="mt-2">
            Easily download spotify <b>playlists or tracks</b> by simply pasting
            the URL in the input dialog. Visit my{" "}
            <Link href="https://joeltaylor.business" className="underline">
              porfoltio
            </Link>
            .
          </p>
          <Link
            href="https://github.com/jtayped/spotify-downloader"
            className="flex items-center gap-2 px-5 py-2 border w-fit rounded-lg mt-2 hover:bg-white/5 transition-colors"
          >
            <IoLogoGithub />
            Repository
          </Link>
        </div>
        <Search />
      </div>
    </main>
  );
};

export default Home;
