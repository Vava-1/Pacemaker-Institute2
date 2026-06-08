import { beforeAll, afterAll } from "vitest";

beforeAll(() => {
  process.env.NODE_ENV = "test";
  process.env.JWT_ACCESS_SECRET = "test_access_secret_minimum_32_chars_long";
  process.env.JWT_REFRESH_SECRET = "test_refresh_secret_minimum_32_chars_long";
  process.env.DATABASE_URL = "mysql://root:testpass@127.0.0.1:3306/pacemaker_test";
  process.env.FRONTEND_URL = "http://localhost:5173";
});
