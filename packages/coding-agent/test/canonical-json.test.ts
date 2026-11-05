import { describe, expect, it } from "vitest";
import { canonicalJson } from "../src/core/canonical-json.ts";

describe("canonicalJson", () => {
	it("sorts keys recursively, including objects inside arrays", () => {
		expect(canonicalJson({ b: 1, a: { d: [2, { z: 1, y: null }] } })).toBe('{"a":{"d":[2,{"y":null,"z":1}]},"b":1}');
	});

	it("produces the same bytes regardless of object insertion order", () => {
		const first = { z: { b: 2, a: 1 }, a: 0 };
		const second = { a: 0, z: { a: 1, b: 2 } };

		expect(canonicalJson(first)).toBe('{"a":0,"z":{"a":1,"b":2}}');
		expect(canonicalJson(second)).toBe(canonicalJson(first));
	});

	it("sorts numeric-looking object keys lexically", () => {
		expect(canonicalJson({ "2": "two", "10": "ten" })).toBe('{"10":"ten","2":"two"}');
	});

	it("omits undefined object fields at every depth while retaining null", () => {
		const value = {
			z: undefined,
			b: { missing: undefined, present: null },
			a: [{ missing: undefined, present: false }],
		};

		expect(canonicalJson(value)).toBe('{"a":[{"present":false}],"b":{"present":null}}');
	});

	it("preserves array order and repeated values without mutating the input", () => {
		const value = [3, 1, 3, [2, 0], { z: 1, a: 0 }];

		expect(canonicalJson(value)).toBe('[3,1,3,[2,0],{"a":0,"z":1}]');
		expect(value).toEqual([3, 1, 3, [2, 0], { z: 1, a: 0 }]);
	});

	it("escapes object keys and string values as JSON", () => {
		expect(canonicalJson({ 'quote"': "line\n\t\\" })).toBe('{"quote\\"":"line\\n\\t\\\\"}');
	});

	it.each([
		{ name: "null", value: null },
		{ name: "true", value: true },
		{ name: "false", value: false },
		{ name: "zero", value: 0 },
		{ name: "negative zero", value: -0 },
		{ name: "negative integer", value: -4 },
		{ name: "fraction", value: 1.25 },
		{ name: "empty string", value: "" },
		{ name: "escaped string", value: 'quote" and newline\n' },
	])("serializes $name like JSON.stringify", ({ value }) => {
		expect(canonicalJson(value)).toBe(JSON.stringify(value));
	});

	it.each([
		{ value: {}, expected: "{}" },
		{ value: [], expected: "[]" },
	])("serializes empty container $expected", ({ value, expected }) => {
		expect(canonicalJson(value)).toBe(expected);
	});
});
