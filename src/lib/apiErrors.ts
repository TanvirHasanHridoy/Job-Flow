/**
 * User-facing error messages. Internal details (provider responses, stack traces,
 * database hosts, parser internals) belong in server logs only — never in API
 * responses, where they leak infrastructure details and confuse users.
 */

export const AI_UNAVAILABLE_MESSAGE =
  'The AI service is temporarily unavailable. Any tokens for this request were refunded — please try again in a moment.';

export const PDF_UNREADABLE_MESSAGE =
  "We couldn't read this PDF. Please make sure it isn't password-protected, damaged, or a scanned image without selectable text.";
