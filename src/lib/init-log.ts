const PREFIX = "[FoodMarket]";

export function logInit(scope: string, message: string, detail?: unknown) {
  if (detail !== undefined) {
    console.log(`${PREFIX} [${scope}] ${message}`, detail);
  } else {
    console.log(`${PREFIX} [${scope}] ${message}`);
  }
}

export function warnInit(scope: string, message: string, detail?: unknown) {
  if (detail !== undefined) {
    console.warn(`${PREFIX} [${scope}] ${message}`, detail);
  } else {
    console.warn(`${PREFIX} [${scope}] ${message}`);
  }
}
