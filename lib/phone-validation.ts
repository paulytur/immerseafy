const PH_MOBILE_HINT = "0917 123 4567 or +63 917 123 4567";

export function philippinePhoneHint(): string {
  return PH_MOBILE_HINT;
}

export function normalizePhilippinePhone(input: string): string {
  return input.trim().replace(/[\s().-]/g, "");
}

export function isValidPhilippineMobilePhone(input: string): boolean {
  const cleaned = normalizePhilippinePhone(input);

  return (
    /^09\d{9}$/.test(cleaned) ||
    /^\+639\d{9}$/.test(cleaned) ||
    /^639\d{9}$/.test(cleaned) ||
    /^9\d{9}$/.test(cleaned)
  );
}

export function validatePhilippineMobilePhone(input: string): string | null {
  if (!input.trim()) {
    return "Phone number is required.";
  }

  if (!isValidPhilippineMobilePhone(input)) {
    return `Enter a valid Philippine mobile number (e.g. ${PH_MOBILE_HINT}).`;
  }

  return null;
}

/** Store as +639XXXXXXXXX */
export function formatPhilippinePhoneE164(input: string): string {
  const cleaned = normalizePhilippinePhone(input);

  if (/^09\d{9}$/.test(cleaned)) {
    return `+63${cleaned.slice(1)}`;
  }

  if (/^9\d{9}$/.test(cleaned)) {
    return `+63${cleaned}`;
  }

  if (/^639\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  if (/^\+639\d{9}$/.test(cleaned)) {
    return cleaned;
  }

  return cleaned;
}
