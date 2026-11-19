import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

async function corsPlugin(app: FastifyInstance): Promise<void> {
  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || origin === app.config.WEB_ORIGIN) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
}

export default fp(corsPlugin, {
  name: "sesh-cors",
});
