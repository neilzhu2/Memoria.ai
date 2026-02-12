/**
 * UUID Validation Utility
 * Validates UUID format before database operations to prevent errors
 */

// Standard UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID
 * @param value - The string to validate
 * @returns true if valid UUID, false otherwise
 */
export function isValidUUID(value: string | null | undefined): boolean {
  if (!value) return false;
  return UUID_REGEX.test(value);
}

/**
 * Validates and returns UUID or null
 * Use this before database operations to prevent UUID format errors
 * @param value - The string to validate
 * @returns The UUID if valid, null otherwise
 */
export function validateUUID(value: string | null | undefined): string | null {
  if (!value) return null;
  return isValidUUID(value) ? value : null;
}
