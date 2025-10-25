const proxyConfig = {
  "/api/*": {
    target: process.env.API_URL ? process.env.API_URL : "http://localhost:3000",
    secure: false,
    logLevel: "debug",
    changeOrigin: true
  }
};

module.exports = proxyConfig;