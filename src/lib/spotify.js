import axios from "axios";

export const getToken = async () => {
  return "BQATL9CzH_yNOkA7VkM8V85lUO1FVpZbk2mu6rwVEU0jQbcooTfzYw7_f5sPlb8hOhkA-PQQpohvk7wgz1a06wWD5A20CATUDkITrMuIwPMgI-Z5XQ4";

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

  console.log(response.data.access_token);
  return response.data.access_token;
};

export const getRequest = async (url) => {
  const token = await getToken();
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
};

export async function getPlaylist(id) {
  try {
    const playlist = await getRequest(
      `https://api.spotify.com/v1/playlists/${id}`
    );
    return playlist;
  } catch (error) {
    console.error(`Error finding playlist: ${id}`);
  }
}

export async function getTrack(id) {
  try {
    const track = await getRequest(`https://api.spotify.com/v1/tracks/${id}`);
    return track;
  } catch (error) {
    console.error("Error downloading playlist:", error);
  }
}
