import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface AuthJwtPayload extends JwtPayload {
      userId: number;
    }

    interface Request {
      user?: AuthJwtPayload;
    }
  }
}

export {};
