import axios from "axios";

export const getToken = async () => {
  // return "BQDnwa5gvB_bDKe59mC-AYronzaXP7YhgGEE-9UEh82-Z4K7sBmaTNKdfScZ1gnrK5RqMDvvMsDd-SLiTBnOL63fTW95e4rCDbHU-bxvI5eP5ec7Qwg";

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

export const getPlaylistId = (url) => {
  // Regular expression to match the playlist ID from the URL
  const regex = /playlist\/(\w+)/;
  const match = url.match(regex);

  // If a match is found, return the playlist ID, otherwise return null
  if (match && match[1]) {
    return match[1];
  } else {
    return null;
  }
};
