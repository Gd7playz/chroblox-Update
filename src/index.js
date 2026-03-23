import { createServer } from "node:http";
import { fileURLToPath } from "url";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

const publicPath = fileURLToPath(new URL("../public/", import.meta.url));

logging.set_level(logging.NONE);

const fastify = Fastify({
	serverFactory: (handler) => {
		return createServer()
			.on("request", (req, res) => {
				res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
				res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
				handler(req, res);
			})
			.on("upgrade", (req, socket, head) => {
				if (req.url.endsWith("/wisp/")) wisp.routeRequest(req, socket, head);
				else socket.end();
			});
	},
});

fastify.register(fastifyStatic, { root: publicPath, decorateReply: true });
fastify.register(fastifyStatic, { root: scramjetPath, prefix: "/scram/", decorateReply: false });
fastify.register(fastifyStatic, { root: libcurlPath, prefix: "/libcurl/", decorateReply: false });
fastify.register(fastifyStatic, { root: baremuxPath, prefix: "/baremux/", decorateReply: false });

// ============================================================
// AD FRAME ROUTE
// Serves a self-contained HTML page that runs the Adsterra
// script directly from our own origin — no X-Frame-Options
// issues since the iframe src is same-origin.
// GET /ad-frame
// ============================================================
fastify.get("/ad-frame", (req, reply) => {
	const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a0c10;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <script>
    atOptions = {
      'key' : 'e5329f54bea294b733b7ba46c03c2250',
      'format' : 'iframe',
      'height' : 90,
      'width' : 300,
      'params' : {}
    };
  </script>
  <script src="https://hospitalforgery.com/e5329f54bea294b733b7ba46c03c2250/invoke.js"></script>
</body>
</html>`;

	reply.header("Content-Type", "text/html");
	return reply.send(html);
});

fastify.setNotFoundHandler((req, reply) => {
	return reply.code(404).type("text/html").sendFile("404.html");
});

let port = parseInt(process.env.PORT || "8080");
fastify.listen({ port: port, host: "0.0.0.0" }, () => {
	console.log(`Chroblox v1.1.2 is running on port ${port}`);
});
