const baseUrl =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:3000"
    : "https://minisocialmedia-biglol.herokuapp.com";

// export default baseUrl;

// because we are going to use this in node environment as well
module.exports = baseUrl;
