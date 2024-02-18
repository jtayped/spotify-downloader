import axios from "axios";

export const getToken = async () => {
  return "BQBZ2EmhRVKUIcZni2qROFCQaqmEQaysR6OpmBOxlFUBWRfE-Quuqr2_GL2OymEMF87eSepQs0ldZkKAgv1aDgHAqXaxT9ikxD9WORxoPKnc-kJZM4M";

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
