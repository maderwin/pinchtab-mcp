import { describe, expect, it } from "vitest";
import { isRecord, toJson, toolError, toolResult } from "../utils.js";

describe("isRecord", () => {
  it("returns true for plain objects", () => {
    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord({})).toBe(true);
  });

  it("returns false for null", () => {
    expect(isRecord(null)).toBe(false);
  });

  it("returns false for primitives", () => {
    expect(isRecord("string")).toBe(false);
    expect(isRecord(42)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
    expect(isRecord(true)).toBe(false);
  });

  it("returns true for arrays", () => {
    expect(isRecord([1, 2])).toBe(true);
  });
});

describe("toJson", () => {
  it("serializes objects with 2-space indent", () => {
    const result = toJson({ a: 1 });
    expect(result).toBe('{\n  "a": 1\n}');
  });

  it("serializes arrays", () => {
    const result = toJson([1, 2]);
    expect(result).toBe("[\n  1,\n  2\n]");
  });

  it("serializes primitives", () => {
    expect(toJson("hello")).toBe('"hello"');
    expect(toJson(42)).toBe("42");
    expect(toJson(true)).toBe("true");
  });
});

describe("toolResult", () => {
  it("wraps data as text content", () => {
    const result = toolResult({ ok: true });
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toBe('{\n  "ok": true\n}');
  });

  it("does not set isError", () => {
    const result = toolResult("data");
    expect(result.isError).toBeUndefined();
  });
});

describe("toolError", () => {
  it("extracts message from Error instances", () => {
    const result = toolError(new Error("something broke"));
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("something broke");
  });

  it("converts non-Error values to string", () => {
    const result = toolError("raw string error");
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("raw string error");
  });

  it("converts numeric errors to string", () => {
    const result = toolError(404);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("404");
  });
});
