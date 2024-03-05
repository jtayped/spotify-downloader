import Search from "@/components/Search";

const Home = async () => {
  return (
    <main className="w-full h-full flex items-center justify-center">
      <div className="px-5 w-full md:w-[700px] space-y-5">
        <div className="text-text md:w-4/5">
          <h1 className="text-4xl font-bold">Spotify Downloader</h1>
          <p className="mt-2">
            Easily download spotify <b>playlists or tracks</b> by simply pasting
            the URL in the input dialog.
          </p>
        </div>
        <Search />
      </div>
    </main>
  );
};

export default Home;
