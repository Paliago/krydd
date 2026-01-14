import { getHintUtils } from "@epic-web/client-hints";
import { clientHint as colorSchemeHint } from "@epic-web/client-hints/color-scheme";

const hintsUtils = getHintUtils({
  theme: colorSchemeHint,
});

export const { getHints } = hintsUtils;

export function getClientHintCheckScript() {
  return hintsUtils.getClientHintCheckScript();
}