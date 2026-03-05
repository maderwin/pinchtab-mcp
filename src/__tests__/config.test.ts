import { describe, expect, it } from "vitest";

describe("config", () => {
  it("has default PINCHTAB_URL", async () => {
    const { PINCHTAB_URL } = await import("../config.js");
    expect(PINCHTAB_URL).toContain("127.0.0.1");
  });

  it("has empty default token", async () => {
    const { PINCHTAB_TOKEN } = await import("../config.js");
    expect(PINCHTAB_TOKEN).toBe("");
  });
});
