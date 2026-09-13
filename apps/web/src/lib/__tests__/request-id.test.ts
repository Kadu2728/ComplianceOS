import { describe, expect, it } from "vitest";
import { isValidRequestId, REQUEST_ID_HEADER } from "../request-id";

describe("request id", () => {
  it("exposes the header name used by the API", () => {
    expect(REQUEST_ID_HEADER).toBe("X-Request-ID");
  });

  it("accepts uuid-like ids and rejects garbage", () => {
    expect(isValidRequestId("3f2c1b4e-8a9d-4c6e-9f1a-2b3c4d5e6f70")).toBe(true);
    expect(isValidRequestId("short")).toBe(false);
    expect(isValidRequestId(null)).toBe(false);
    expect(isValidRequestId("has spaces here")).toBe(false);
  });
});
