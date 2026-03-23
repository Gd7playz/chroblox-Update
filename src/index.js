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
// AD PROXY ROUTE
// Fetches a URL server-side and strips X-Frame-Options /
// CSP headers so the response loads in the mini-browser iframe.
// Only allows http/https to prevent SSRF abuse.
// GET /ad-proxy?url=https://example.com
// ============================================================
fastify.get("/ad-proxy", async (req, reply) => {
	const target = req.query.url;

	if (!target) {
		return reply.code(400).send("Missing url parameter");
	}

	let parsedUrl;
	try {
		parsedUrl = new URL(target);
	} catch {
		return reply.code(400).send("Invalid URL");
	}

	if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
		return reply.code(403).send("Protocol not allowed");
	}

	try {
		const upstream = await fetch(target, {
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
				"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				"Accept-Language": "en-US,en;q=0.5",
			},
			redirect: "follow",
		});

		const contentType = upstream.headers.get("content-type") || "text/html";
		reply.header("Content-Type", contentType);

		// Strip frame-blocking headers
		reply.header("X-Frame-Options", "ALLOWALL");
		reply.header("Content-Security-Policy", "");
		reply.header("Access-Control-Allow-Origin", "*");

		const body = await upstream.text();
		return reply.code(upstream.status).send(body);

	} catch (err) {
		return reply.code(502).send("Failed to fetch: " + err.message);
	}
});

fastify.setNotFoundHandler((req, reply) => {
	return reply.code(404).type("text/html").sendFile("404.html");
});

let port = parseInt(process.env.PORT || "8080");
fastify.listen({ port: port, host: "0.0.0.0" }, () => {
	console.log(`Chroblox v1.1.2 is running on port ${port}`);
});
