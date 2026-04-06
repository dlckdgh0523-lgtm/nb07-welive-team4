import swaggerUi from "swagger-ui-express";
import type { Express } from "express";
import { apartmentDocs } from "./apartment.docs";

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "위리브 API",
    version: "1.0.0",
    description: "위리브 API 명세서",
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  paths: {
    ...apartmentDocs,
  },
};

export const setupSwagger = (app: Express): void => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log("Swagger 문서: http://localhost:3000/api-docs");
};