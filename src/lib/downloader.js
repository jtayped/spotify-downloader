const ytsr = require("ytsr");
const ytdl = require("ytdl-core");
const { getRequest } = require("./spotify");
const streamToBlob = require("stream-to-blob");
const JSZip = require("jszip");
import filenamify from "filenamify";
import { serverTimestamp } from "./util";

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

    // Create a promise that resolves when the stream finishes downloading
    const downloadFinished = new Promise((resolve, reject) => {
      audioStream.on("end", resolve());
      audioStream.on("error", reject());
    });

    // Wait for the download to finish
    await downloadFinished;

    // Convert the stream to a Blob
    const blob = await streamToBlob(audioStream, "audio/mpeg");
    return blob;
  } catch (error) {
    console.error(`Error downloading ${ytUrl}`);
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

export async function findTrackYt(track) {
  const query = `${track.name} by ${track.artists[0].name}`;
  const trackDuration = track.duration_ms / 1000;

  try {
    // Filter the search results to include only videos
    const filter = await ytsr.getFilters(query);
    const videoFilter = filter.get("Type").get("Video");

    const options = {
      pages: 2,
    };
    const result = await ytsr(videoFilter.url, options);
    const searchResults = result.items;

    // Skip if no results were found
    if (searchResults.length === 0) return;

    let closestDuration = null;
    let closestVideoUrl = null;
    for (const result of searchResults) {
      if (result.type === "shelf") continue;
      let { duration, url } = result;

      // Check if required fields are present
      if (!duration || !url) continue;

      // Calculate the closest duration
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

export async function downloadTrack(track, silent = true) {
  if (!silent) {
    console.log(`[${serverTimestamp()}]: Downloading ${track?.name}...`);
  }

  try {
    const ytUrl = await findTrackYt(track);
    if (!ytUrl) return;

    const blob = await downloadYt(ytUrl);

    return blob;
  } catch (error) {
    console.error("Error downloading track:", error);
  }
}

export async function downloadPlaylist(playlist) {
  console.log(
    `[${serverTimestamp()}]: Downloading ${
      playlist?.tracks.total
    } tracks from ${playlist?.name}...`
  );

  try {
    const { items } = playlist.tracks;

    // Split the items array into chunks of 50 tracks each
    const chunkSize = 25;
    const chunks = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }

    // Process each chunk in parallel
    const downloadPromises = chunks.map(async (chunk) => {
      // Download each track in the chunk
      const trackData = await Promise.all(
        chunk.map(async (item) => {
          const track = item.track;
          const blob = await downloadTrack(track);
          if (!blob) return; // Check if track downloaded

          const name = `${track.name} by ${track.artists[0].name}`;
          return { name, blob }; // Return object with track name and blob
        })
      );
      return trackData.filter(Boolean); // Remove undefined values
    });

    // Wait for all chunks to be processed
    const allTrackData = await Promise.all(downloadPromises);

    // Create a zip file and add blobs
    const zip = new JSZip();
    allTrackData.forEach((chunkTrackData) => {
      chunkTrackData.forEach((data) => {
        const { name, blob } = data;
        zip.file(
          `${filenamify(name).replace(
            /[^\p{L}\p{N}\p{P}\p{Z}^$\n]/gu,
            ""
          )}.mp3`,
          blob.arrayBuffer()
        );
      });
    });

    // Generate the zip blob
    const zipBlob = await zip.generateAsync({ type: "blob" });
    return zipBlob;
  } catch (error) {
    console.error("Error downloading playlist:", error);
  }
}
