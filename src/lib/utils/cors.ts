import Cors, { CorsOptions } from "cors";
import type { NextApiRequest, NextApiResponse } from "next";

type MiddlewareFn = (
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
) => Promise<void>;

// Initializing the cors middleware with options
const corsOptions: CorsOptions = {
  methods: ["GET", "POST", "PUT", "DELETE"], // Specify the allowed HTTP methods
  origin: "*", // Specify allowed origins, '*' means all origins
  allowedHeaders: ["Content-Type", "Authorization"], // Add more headers as needed
};

const cors = Cors(corsOptions);

// Helper method to wait for a middleware to execute before continuing
const runMiddleware: MiddlewareFn = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

// Initialize and run the middleware
export default function initMiddleware(middleware: typeof cors) {
  return (req: NextApiRequest, res: NextApiResponse) =>
    runMiddleware(req, res, middleware);
}

export const corsMiddleware = initMiddleware(cors);

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-auth0-id-token",
};
