import { safeParse } from "../util/prompt-builder";

describe("safeParse JSON repair", () => {
  it("should parse valid JSON", async () => {
    const input = '{"a": 1}';
    const result = await safeParse(input);

    expect(result).toEqual({ a: 1 });
  });

  it("should extract JSON from markdown code block", async () => {
    const input = `
    \`\`\`json
    {"a": 1}
    \`\`\`
    `;

    const result = await safeParse(input);

    expect(result).toEqual({ a: 1 });
  });

  it("should extract JSON with extra text before and after", async () => {
    const input = `
      Here is your result:
      {"a": 1}
      Thank you!
    `;

    const result = await safeParse(input);

    expect(result).toEqual({ a: 1 });
  });

  it("should extract outermost JSON object", async () => {
    const input = `
      random text
      {"a": 1, "b": {"c": 2}}
      trailing text
    `;

    const result = await safeParse(input);

    expect(result).toEqual({
      a: 1,
      b: { c: 2 },
    });
  });

  it("should throw error for invalid JSON", async () => {
    const input = `not json at all`;

    await expect(safeParse(input)).rejects.toThrow("PARSE_FAILED");
  });

  it("should handle broken JSON and fail gracefully", async () => {
    const input = `{"a": 1,}`;

    await expect(safeParse(input)).rejects.toThrow("PARSE_FAILED");
  });
});
