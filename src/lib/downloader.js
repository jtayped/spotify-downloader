const ytsr = require("ytsr");
const ytdl = require("ytdl-core");
const fs = require("fs");
const archiver = require("archiver");
const { getRequest } = require("./spotify");

async function downloadYt(ytUrl) {
  try {
    // Get video info
    const info = await ytdl.getInfo(ytUrl);

    // Choose the highest quality audio format
    const audioFormat = ytdl.chooseFormat(info.formats, {
      quality: "highestaudio",
    });

    // Download the audio
    const audioStream = ytdl.downloadFromInfo(info, { format: audioFormat });
    return audioStream;
  } catch (error) {
    console.error("Error downloading audio:", error);
    throw error;
  }
}

function parseDuration(durationString) {
  // Split the string by ":" to separate hours, minutes, and seconds
  const durationArray = durationString.split(":").map(Number);

  // If the array has only one element, it represents seconds
  if (durationArray.length === 1) {
    return durationArray[0];
  }

  // If the array has two elements, they represent minutes and seconds
  if (durationArray.length === 2) {
    return durationArray[0] * 60 + durationArray[1];
  }

  // If the array has three elements, they represent hours, minutes, and seconds
  if (durationArray.length === 3) {
    return durationArray[0] * 3600 + durationArray[1] * 60 + durationArray[2];
  }

  // Return -1 if the duration format is not recognized
  return -1;
}

async function findTrackYt(track) {
  const query = `${track.name} by ${track.artists[0].name}`;
  const trackDuration = track.duration_ms / 1000;

  try {
    // Filter the search results to include only videos
    const filter = await ytsr.getFilters(query);
    const videoFilter = filter.get("Type").get("Video");

    const options = {
      pages: 1,
    };
    const result = await ytsr(videoFilter.url, options);
    const searchResults = result.items;

    let closestDuration = null;
    let closestVideoUrl = null;
    for (const result of searchResults) {
      if (result.type === "shelf") continue;
      let { duration, url } = result;

      const durationInSeconds = parseDuration(duration);
      if (
        !closestDuration ||
        Math.abs(durationInSeconds - trackDuration) <
          Math.abs(closestDuration - trackDuration)
      ) {
        closestDuration = durationInSeconds;
        closestVideoUrl = url;
      }
    }

    return closestVideoUrl;
  } catch (error) {
    console.error(error);
  }
}

async function downloadTrack(track, archive) {
  try {
    const ytUrl = await findTrackYt(track);
    const stream = await downloadYt(ytUrl);

    const name = `${track.name} by ${track.artists[0].name}`;
    archive.append(stream, { name: `${name}.mp3` });
  } catch (error) {
    console.error("Error downloading track:", error);
  }
}

async function downloadSingularTrack(track) {
  try {
    const ytUrl = await findTrackYt(track);
    const stream = await downloadYt(ytUrl);

    return stream;
  } catch (error) {
    console.error("Error downloading track:", error);
  }
}

async function saveStreamToFile(stream, filePath) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(filePath);
    stream.pipe(fileStream);
    stream.on("end", () => {
      fileStream.end();
      resolve(filePath);
    });
    fileStream.on("error", (error) => {
      reject(error);
    });
  });
}

async function downloadPlaylist(playlist) {
  try {
    // TODO: avoid limit (100 tracks max )
    const items = playlist.tracks.items;

    // Create an output stream
    const outputPath = `${playlist.name}.zip`;
    const outputZipStream = fs.createWriteStream(outputPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(outputZipStream);

    // Download each track
    const downloadPromises = items.map((item) =>
      downloadTrack(item.track, archive)
    );
    await Promise.all(downloadPromises);

    // Finalize the zip archive
    await new Promise((resolve, reject) => {
      outputZipStream.on("close", () => {
        resolve();
      });
      archive.finalize();
    });

    return outputPath;
  } catch (error) {
    console.error("Error downloading playlist:", error);
  }
}

async function getPlaylist(id) {
  try {
    const playlist = await getRequest(
      `https://api.spotify.com/v1/playlists/${id}`
    );
    return playlist;
  } catch (error) {
    console.error("Error downloading playlist:", error);
  }
}

async function getTrack(id) {
  try {
    const track = await getRequest(`https://api.spotify.com/v1/tracks/${id}`);
    return track;
  } catch (error) {
    console.error("Error downloading playlist:", error);
  }
}

module.exports = {
  getPlaylist,
  getTrack,
  downloadPlaylist,
  downloadTrack,
  downloadSingularTrack,
};
