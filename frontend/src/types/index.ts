// ── Brand ──
export interface BrandStory {
  origin: string;
  values: string;
  customerMessage: string;
}

export interface BrandTarget {
  audience: string;
  profiles: string[];
  keywords: string[];
}

export interface Brand {
  name: string;
  nameEn: string;
  tagline: string;
  industry: string;
  businessType: string;
  colors: string[];
  tone: string[];
  logo: string;
  story: BrandStory;
  target: BrandTarget;
}

// ── Product ──
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  channels: string[];
  imageUrl: string;
  createdAt: string;
}

// ── Service ──
export interface Service {
  id: string;
  name: string;
  type: string;
  price: number;
  description: string;
  schedule: string;
  createdAt: string;
}

// ── Store ──
export interface StoreHours {
  [day: string]: string;
}

export interface StoreSns {
  instagram: string;
  blog: string;
  kakao: string;
}

export interface StorePlatforms {
  naverPlace: string;
  googleBusiness: string;
  smartStore: string;
}

export interface Store {
  address: string;
  phone: string;
  hours: StoreHours;
  sns: StoreSns;
  platforms: StorePlatforms;
}

// ── Site ──
export interface HeadSnippets {
  ga4Id?: string;
  gscMeta?: string;
  googleAdsId?: string;
  naverMeta?: string;
  customHead?: string;
  // OG tags
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  metaKeywords?: string;
  // Twitter card overrides
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  // Marketing pixels
  gtmId?: string;
  metaPixelId?: string;
  kakaoPixelId?: string;
  kakaoChannelId?: string;
}

export interface SiteData {
  siteId: string;
  ownerSub: string;
  headSnippets: HeadSnippets;
  brand: Brand;
  products: Product[];
  services: Service[];
  store: Store;
  brandCompleteness: number;
  aiReadiness: number;
  createdAt: string;
  updatedAt: string;
}

// ── User ──
export interface UserProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  username: string;
}

// ── SEO Validation ──
export interface CheckItem {
  key?: string;
  reason: string;
  passed: boolean;
}

export interface ValidateResult {
  summary: { total: number; passed: number; failed: number };
  checks: CheckItem[];
}

export interface DeployResult {
  deployedUrl: string;
  uploadedCount: number;
  invalidationId?: string;
}

// ── Navigation ──
export type BadgeStatus = 'done' | 'in-progress' | 'empty' | 'needs-education' | 'coming-soon' | 'locked';

export interface NavItem {
  path: string;
  label: string;
  badge?: BadgeStatus;
  badgeText?: string;
  count?: number;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

// ── Education ──
export interface EducationItem {
  id: string;
  title: string;
  duration: string;
  progress: number;
  locked: boolean;
  unlockRequirement?: string;
}

// ── Roadmap ──
export interface RoadmapStage {
  stage: number;
  title: string;
  status: 'done' | 'current' | 'next';
  businessTrack: string[];
  marketingTrack: string[];
  metrics?: { label: string; value: string }[];
}

export interface RoadmapExample {
  id: string;
  title: string;
  currentStage: number;
  stages: RoadmapStage[];
}
