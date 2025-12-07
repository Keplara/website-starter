const proxyConfig = {
  "/api/*": {
    target: process.env.API_BASE_URL ? process.env.API_BASE_URL : "http://localhost:8080",
    secure: false,
    logLevel: "debug",
    changeOrigin: true
  }
};

module.exports = proxyConfig;