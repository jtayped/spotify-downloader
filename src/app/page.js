import DownloadInput from "@/components/DownloadInput";

const Home = async () => {
  return (
    <main className="w-full h-full flex items-center justify-center z-10">
      <div className="px-5 w-full md:w-[700px]">
        <DownloadInput />
      </div>
    </main>
  );
};

export default Home;
