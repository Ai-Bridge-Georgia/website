// @aibg/platform-adapters — Universal Platform Adapter System

// Interface
export type { PlatformAdapter, BusinessTokens } from './interface';

// Router
export { getAdapter, getAvailablePlatforms } from './router';

// Adapters
export { webAdapter } from './web/adapter';
export { androidAdapter } from './android/adapter';
export { iosAdapter } from './ios/adapter';

// Common Review
export { commonReviewFunctions } from './common/review';
