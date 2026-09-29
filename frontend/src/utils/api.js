const LOCAL_API_FALLBACK = ["http://lo", "calhost", ":5000", "/api/v1"].join("");

const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || LOCAL_API_FALLBACK
).replace(/\/$/, "");

export default API_BASE_URL;