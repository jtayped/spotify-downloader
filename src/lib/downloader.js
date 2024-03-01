const ytsr = require("ytsr");
const ytdl = require("ytdl-core");
const JSZip = require("jszip");
const sharp = require("sharp");
import NodeID3, { TagConstants } from "node-id3";
import filenamify from "filenamify";
import { serverTimestamp } from "./util";
import axios from "axios";
import { promises } from "fs";

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    stream.on("data", (chunk) => {
      chunks.push(chunk);
    });

    stream.on("end", () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer);
    });

    stream.on("error", (error) => {
      reject(error);
    });
  });
}

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
    const buffer = await streamToBuffer(audioStream);
    return buffer;
  } catch (error) {
    console.error(error);
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

async function fetchCover(url) {
  try {
    // Fetch the image
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const cover = await sharp(response.data).jpeg().toBuffer();

    // Return the image data as a buffer
    return cover;
  } catch (error) {
    console.error(error);
  }
}

async function id3Tags(buffer, track) {
  try {
    const cover = await fetchCover(track.album.images[0].url);

    const tags = {
      title: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      image: {
        mime: "image/jpeg",
        type: {
          id: TagConstants.AttachedPicture.PictureType.FRONT_COVER,
        },
        description: `${track.name} cover`,
        imageBuffer: cover,
      },
    };

    const taggedBuffer = NodeID3.write(tags, buffer);

    return taggedBuffer;
  } catch (error) {
    console.error("Error adding ID3 tags:", error);
  }
}

export async function downloadTrack(track, silent = true) {
  if (!silent) {
    console.log(`[${serverTimestamp()}]: Downloading ${track?.name}...`);
  }

  try {
    const ytUrl = await findTrackYt(track);
    if (!ytUrl) return;

    let buffer = await downloadYt(ytUrl);
    // buffer = await id3Tags(buffer, track);

    return buffer;
  } catch (error) {
    console.error("Error downloading track:", error);
  }
}

export async function downloadPlaylist(playlist, progressCallback) {
  const errors = {
    notFound: [],
  };
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

    let tracksDownloaded = 0;
    // Process each chunk in parallel
    const downloadPromises = chunks.map(async (chunk) => {
      // Download each track in the chunk
      const trackData = await Promise.all(
        chunk.map(async (item) => {
          const track = item.track;
          const buffer = await downloadTrack(track);

          // Check if track downloaded
          if (!buffer) {
            errors.notFound.push(track);
            return;
          }

          tracksDownloaded = tracksDownloaded + 1;
          const progress = (tracksDownloaded / playlist.tracks.total) * 100;
          progressCallback(Math.round(progress));

          const name = `${track.name} by ${track.artists[0].name}`;
          return { name, buffer }; // Return object with track name and buffer
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
        const { name, buffer } = data;
        zip.file(
          `${filenamify(name).replace(
            /[^\p{L}\p{N}\p{P}\p{Z}^$\n]/gu,
            ""
          )}.mp3`,
          buffer
        );
      });
    });

    // Generate the zip blob
    const zipBlob = await zip.generateAsync({ type: "blob" });
    return { blob: zipBlob, errors };
  } catch (error) {
    console.error("Error downloading playlist:", error);
  }
}
