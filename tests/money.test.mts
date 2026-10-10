import { test } from "node:test";
import assert from "node:assert/strict";
import {
  centsToInput,
  formatCents,
  formatCentsOrConsultar,
  parsePriceToCents,
} from "../src/lib/money.ts";

test("parsePriceToCents: integer pesos", () => {
  assert.equal(parsePriceToCents("100"), 10000);
});

test("parsePriceToCents: thousand separator with dot", () => {
  assert.equal(parsePriceToCents("$ 1.250"), 125000);
});

test("parsePriceToCents: comma decimals", () => {
  assert.equal(parsePriceToCents("1.250,50"), 125050);
});

test("parsePriceToCents: dot decimals", () => {
  assert.equal(parsePriceToCents("1,250.50"), 125050);
});

test("parsePriceToCents: no separators with decimals", () => {
  assert.equal(parsePriceToCents("10,5"), 1050);
});

test("parsePriceToCents: round thousands with dot", () => {
  assert.equal(parsePriceToCents("1.000"), 100000);
});

test("parsePriceToCents: dot decimal two digits", () => {
  assert.equal(parsePriceToCents("2.50"), 250);
});

test("parsePriceToCents: negative rejected", () => {
  assert.equal(parsePriceToCents("-50"), null);
});

test("parsePriceToCents: garbage rejected", () => {
  assert.equal(parsePriceToCents("abc"), null);
  assert.equal(parsePriceToCents(""), null);
  assert.equal(parsePriceToCents("   "), null);
});

test("formatCents: null/undefined -> null", () => {
  assert.equal(formatCents(null), null);
  assert.equal(formatCents(undefined), null);
});

test("formatCents: formats with thousands separator", () => {
  const out = formatCents(125000);
  assert.ok(out !== null);
  assert.ok(out.includes("1.250"));
});

test("formatCents: whole pesos no decimals", () => {
  const out = formatCents(500);
  assert.ok(out !== null);
  assert.equal(out.includes(","), false);
});

test("formatCentsOrConsultar fallback", () => {
  assert.equal(formatCentsOrConsultar(null), "Consultar precio");
  assert.equal(formatCentsOrConsultar(undefined), "Consultar precio");
  assert.ok(formatCentsOrConsultar(500) !== null);
});

test("centsToInput: cents to decimal string", () => {
  assert.equal(centsToInput(12345), "123.45");
  assert.equal(centsToInput(0), "0.00");
  assert.equal(centsToInput(null), "");
});