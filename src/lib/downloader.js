import filenamify from "filenamify";
import { serverTimestamp } from "./utils";
import axios from "axios";
import sharp from "sharp";
const JSZip = require("jszip");
const ytSearch = require("youtube-sr").default;
const ytdl = require("ytdl-core");
// const ffmpeg = require("fluent-ffmpeg");
const NodeID3 = require("node-id3");
const { PassThrough } = require("stream");

// MAIN FUNCTIONS
export async function downloadPlaylist(playlist, silent = true) {
  try {
    if (!silent) {
      console.log(
        `[${serverTimestamp()}]: Downloading ${
          playlist?.tracks.total
        } tracks from ${playlist?.name}...`
      );
    }
    const items = playlist.tracks.items;

    // Create zip file
    const zip = new JSZip();

    // Download tracks by chunks of n size
    const chunkSize = 25;
    const totalChunks = Math.ceil(items.length / chunkSize);

    // Iterate over chunks
    for (let i = 0; i < totalChunks; i++) {
      const chunkStart = i * chunkSize;
      const chunkEnd = Math.min(chunkStart + chunkSize, items.length);
      const chunkItems = items.slice(chunkStart, chunkEnd);

      // Push download promises to the array
      const downloadPromises = [];
      for (const item of chunkItems) {
        downloadPromises.push(downloadTrack(item.track));
      }

      // Wait for all downloads in the current chunk to complete
      const downloads = await Promise.all(downloadPromises);

      // Add downloaded tracks to the zip
      downloads.forEach((download) => {
        if (download) {
          const { filename, buffer } = download;
          zip.file(filename, buffer);
        }
      });
    }

    // Get zip blob
    const blob = await zip.generateAsync({ type: "blob" });
    const filename = pathNamify(playlist.name) + ".zip";
    return { blob, filename };
  } catch (error) {
    console.error(error);
  }
}

export async function downloadTrack(track, silent = true) {
  try {
    if (!silent && track) {
      console.log(
        `[${serverTimestamp()}]: Downloading ${track.name} by ${
          track.artists[0].name
        }...`
      );
    }
    // Find YouTube URL
    const id = await findYtId(track);

    // Download YouTube URL
    let buffer = await downloadYT(id);

    // Add metadata
    // buffer = await addMetadata(buffer, track);

    // Create filename
    const filename =
      pathNamify(`${track.name} by ${track.artists[0].name}`) + ".mp3";

    return { buffer, filename };
  } catch (error) {
    console.error(error);
  }
}

// SUB FUNCTIONS
async function findYtId(track) {
  try {
    const query = `${track.name} by ${track.artists[0].name} official`;

    // Get search data
    const videos = await ytSearch.search(query, { limit: 5, type: "video" });

    // Find closest to the track's duration
    let closestDuration = null;
    let closestVideoUrl = null;

    for (const video of videos) {
      // Check if duration is exact
      if (video.duration === track.duration_ms) {
        return video.id;
      }

      // Check if closest duration
      if (
        !closestDuration ||
        Math.abs(video.duration - track.duration_ms) <
          Math.abs(closestDuration - track.duration_ms)
      ) {
        closestDuration = video.duration;
        closestVideoUrl = video.id;
      }
    }

    return closestVideoUrl;
  } catch (error) {
    console.error(error);
  }
}

async function downloadYT(id) {
  try {
    // Get info
    const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${id}`);

    // Choose the highest quality audio format
    const audioFormat = ytdl.chooseFormat(info.formats, {
      quality: "highestaudio",
    });

    // Get audio stream
    const audioStream = ytdl.downloadFromInfo(info, { format: audioFormat });

    // Convert to mp3
    // const buffer = convertToMp3(audioStream);
    const buffer = streamToBuffer(audioStream);
    return buffer;
  } catch (error) {
    console.error(error);
  }
}

async function streamToBuffer(stream) {
  try {
    return new Promise((resolve, reject) => {
      const mp3Buffer = [];
      const outputStream = new PassThrough();
      outputStream.on("error", (err) => {
        reject(err);
      });
      outputStream.on("end", () => {
        const finalBuffer = Buffer.concat(mp3Buffer);
        resolve(finalBuffer);
      });

      stream.pipe(outputStream);
      outputStream.on("data", (chunk) => {
        mp3Buffer.push(chunk);
      });

      outputStream.on("error", (err) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error(error);
  }
}

async function convertToMp3(stream) {
  try {
    return new Promise((resolve, reject) => {
      const mp3Buffer = [];

      const outputStream = new PassThrough();

      // Convert MP4 stream to MP3
      ffmpeg(stream)
        .format("mp3")
        .audioCodec("libmp3lame")
        .on("error", (err) => {
          reject(err);
        })
        .on("end", () => {
          const finalBuffer = Buffer.concat(mp3Buffer);
          resolve(finalBuffer);
        })
        .pipe(outputStream);

      outputStream.on("data", (chunk) => {
        mp3Buffer.push(chunk);
      });

      outputStream.on("error", (err) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error(error);
  }
}

async function addMetadata(buffer, track) {
  try {
    // Fetch cover
    const cover = await fetchCover(track.album.images[0].url);

    // Extrack tags from the track data
    const tags = {
      title: track.name,
      artist: track.artists.map((artist) => artist.name).join("; "),
      album: track.album.name,
      trackNumber: track.track_number,
      releaseTime: track.album.release_date,
      image: {
        mime: "image/jpeg",
        type: {
          id: 3,
        },
        imageBuffer: cover,
      },
    };

    // Add it to the buffer
    const taggedBuffer = NodeID3.write(tags, buffer);
    return taggedBuffer;
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

// UTIL FUNCTIONS
function pathNamify(path) {
  return filenamify(path).replace(/[^\p{L}\p{N}\p{P}\p{Z}^$\n]/gu, "");
}
