// Minimal JSON Schema validator covering the keywords used in schemas/component.schema.json:
// type, required, properties, additionalProperties:false, items, enum, pattern.
export function validateSchema(schema, value, path = '$') {
  const errors = [];
  const typeOf = (v) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v === 'number' ? 'number' : typeof v);

  if (schema.type && typeOf(value) !== schema.type && !(schema.type === 'integer' && Number.isInteger(value))) {
    return [`${path}: expected ${schema.type}, got ${typeOf(value)}`];
  }
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${path}: must be one of ${schema.enum.join(', ')}`);
  if (schema.pattern && typeof value === 'string' && !new RegExp(schema.pattern).test(value)) {
    errors.push(`${path}: "${value}" does not match ${schema.pattern}`);
  }
  if (schema.type === 'object') {
    for (const key of schema.required ?? []) if (!(key in value)) errors.push(`${path}: missing required "${key}"`);
    for (const [key, v] of Object.entries(value)) {
      const sub = schema.properties?.[key];
      if (sub) errors.push(...validateSchema(sub, v, `${path}.${key}`));
      else if (schema.additionalProperties === false) errors.push(`${path}: unknown property "${key}"`);
    }
  }
  if (schema.type === 'array' && schema.items) {
    value.forEach((v, i) => errors.push(...validateSchema(schema.items, v, `${path}[${i}]`)));
  }
  return errors;
}
