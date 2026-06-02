import axios from "axios";

const baseURL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5001/api"
    : "https://fundacion-divino-nino.vercel.app/api";

const axiosInstance = axios.create({ baseURL });

export default axiosInstance;
