import axios from "axios";

export const getToken = async () => {
  // return "BQCHK5-_mpYaeBOUqN1_5CgW9ChSHKXkLuMPqounOiADbN3yZ6xL7Bhau9M8V14zn8dkg4N-mUzSn7Aiz4Pe6asTg1zD4Z3VyZXklW8juaQ_TTfdtNA";

  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    "grant_type=client_credentials",
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      auth: {
        username: process.env.CLIENT_ID,
        password: process.env.CLIENT_SECRET,
      },
    }
  );

  // console.log(response.data.access_token);
  return response.data.access_token;
};

export const getRequest = async (url) => {
  const token = await getToken();
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
};

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

async function downloadBlob(blob, name) {
  // Create a blob URL and initiate download
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", name);
  document.body.appendChild(link);
  link.click();
}

export const handleDownload = async (id, type) => {
  try {
    if (id && type && (type === "playlist" || type === "track")) {
      const response = await axios.get(`/spotify-downloader/api/${type}/${id}`);
      const data = response.data;

      if (!response.error) {
        // Download playlist
        const downloadRes = await axios.post(
          `/spotify-downloader/api/download/${type}`,
          { data },
          { responseType: "blob" }
        );

        downloadBlob(downloadRes.data, `${data.name}.mp3`);
      }
    }
  } catch (error) {
    console.error(error);
  }
};
