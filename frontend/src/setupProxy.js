const { createProxyMiddleware } = require("http-proxy-middleware");

/**CRA dev server: forward API + uploaded files to Spring Boot so {@code <img src="/uploads/...">} works on :3000.
 */
module.exports = function setupProxy(app) {
  const target =
    process.env.REACT_APP_PROXY_TARGET?.trim() || "http://127.0.0.1:8080";
  app.use(
    ["/api", "/uploads"],
    createProxyMiddleware({
      target,
      changeOrigin: true
    })
  );
};
