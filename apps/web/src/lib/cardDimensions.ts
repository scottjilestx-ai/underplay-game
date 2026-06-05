/** PlayingCard default size (matches PlayingCard.tsx and cardFly.ts). */
export const CARD_WIDTH_REM = 4.5;
export const CARD_HEIGHT_REM = 6.5;

/** Stack fan layout (must match StackPile offsets). */
export const STACK_FAN_STEP_X_PX = 14;
export const STACK_FAN_STEP_Y_PX = 4;
export const STACK_FAN_MAX_VISIBLE = 6;
/** Inner padding so fanned cards + rotation stay inside the dashed outline. */
export const STACK_ZONE_PAD_REM = 1.25;

const fanSpreadXRem = ((STACK_FAN_MAX_VISIBLE - 1) * STACK_FAN_STEP_X_PX) / 16;
const fanSpreadYRem = ((STACK_FAN_MAX_VISIBLE - 1) * STACK_FAN_STEP_Y_PX) / 16;

/** Dashed drop zone — sized for a full 6-card fan, not just 1.5× one card. */
export const stackZoneWidthRem =
  CARD_WIDTH_REM + fanSpreadXRem + STACK_ZONE_PAD_REM * 2;

export const stackZoneHeightRem =
  CARD_HEIGHT_REM + fanSpreadYRem + STACK_ZONE_PAD_REM * 2;

/** @deprecated use stackZoneWidthRem */
export const stackOutlineWidthRem = stackZoneWidthRem;
/** @deprecated use stackZoneHeightRem */
export const stackOutlineHeightRem = stackZoneHeightRem;