export const CONSTRUCTION_COOKIE = "shotshq_construction_access";
export const CONSTRUCTION_COOKIE_VALUE = "open-v1";
export const CONSTRUCTION_PASS = process.env.SHOTSHQ_CONSTRUCTION_PASS ?? "kumanovo";

export function isConstructionMode() {
  return process.env.SHOTSHQ_CONSTRUCTION_MODE !== "0";
}

export function hasConstructionAccess(value: string | undefined) {
  return value === CONSTRUCTION_COOKIE_VALUE;
}
