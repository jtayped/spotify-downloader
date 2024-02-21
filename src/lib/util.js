export async function downloadBlob(blob, name) {
  // Create a blob URL and initiate download
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", name);
  document.body.appendChild(link);
  link.click();
}

export function getElementId(url) {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?open\.spotify\.com\/(?:track|playlist)\/(\w{22})/;
  const match = url.match(regex);
  if (match && match.length > 1) {
    return match[1];
  } else {
    return null; // Return null if URL doesn't match expected format
  }
}

export function getElementType(url) {
  if (url.includes("/track/")) {
    return "track";
  } else if (url.includes("/playlist/")) {
    return "playlist";
  }
}

export const getFilenameFromHeaders = (headers) => {
  // Extract filename from Content-Disposition header
  const contentDisposition = headers["content-disposition"];
  const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
  const matches = filenameRegex.exec(contentDisposition);
  let filename = "download.mp3"; // Default filename if not found in header
  if (matches != null && matches[1]) {
    filename = matches[1].replace(/['"]/g, "");
  }
  return filename;
};
