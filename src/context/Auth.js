"use client";

import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext(null);
function AuthContextProvider({ children }) {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      // const response = await axios.get("/api/token");
      // const { token } = response.data;

      setToken(
        "BQCR3mpjKv5gf51MjKuXUMYYGIMzwyzv2Q8XcZIC5stkygIIwtj5sr-lyfK5-TlB4EpJXVDTv6NZrA7ZI_WGAqGVDUl6e9mFyE5MrLsVL8K4lu1k2kM"
      );
    };

    fetchToken();
  }, []);

  return (
    <AuthContext.Provider value={{ token }}>{children}</AuthContext.Provider>
  );
}

export default AuthContextProvider;
