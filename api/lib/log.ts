const PREFIX = "[FoodMarket API]";

export function logApi(scope: string, message: string, detail?: unknown) {
  if (detail !== undefined) {
    console.log(`${PREFIX} [${scope}] ${message}`, detail);
  } else {
    console.log(`${PREFIX} [${scope}] ${message}`);
  }
}

export function logApiError(scope: string, message: string, detail?: unknown) {
  if (detail !== undefined) {
    console.error(`${PREFIX} [${scope}] ${message}`, detail);
  } else {
    console.error(`${PREFIX} [${scope}] ${message}`);
  }
}
