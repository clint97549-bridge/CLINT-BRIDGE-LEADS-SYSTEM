/**
 * Pakistan High-Intent Target Industries & Client Bridge Agency Service Mapping
 * (Sections 2, 4, 6, 7 & 8)
 *
 * Provides dedicated definitions, subcategories, opportunity signals,
 * tailored Client Bridge service recommendations, and 5-point explainability.
 */

import { ContactAccuracyStatus, OpportunityType, WebsiteStatus } from '../types';

export interface TargetIndustryDefinition {
  id: string;
  name: string;
  shortLabel: string;
  iconName: string;
  subcategories: string[];
  recommendedServices: string[];
  opportunitySignals: string[];
  localDiscoveryKeywords: string[];
  exampleRecommendation: string;
}

export const PAKISTAN_TARGET_INDUSTRIES: TargetIndustryDefinition[] = [
  {
    id: 'dental-clinics',
    name: 'Dental Clinics',
    shortLabel: 'Dental',
    iconName: 'Smile',
    subcategories: [
      'General Dentistry',
      'Cosmetic Dentistry',
      'Orthodontics & Braces',
      'Pediatric Dentistry',
      'Dental Surgery & Implantology',
      'Teeth Whitening & Aesthetics',
    ],
    recommendedServices: [
      'Professional dental clinic website',
      'Online appointment booking system',
      'Doctor and dentist profile pages',
      'Treatment and procedure pages',
      'WhatsApp enquiry & chat integration',
      'Patient enquiry management CRM',
      'Local SEO & Google Business Profile optimisation',
      'Brand identity & patient collateral',
    ],
    opportunitySignals: [
      'No official website found after reasonable research',
      'Website exists but has no appointment or enquiry system',
      'No clear treatment or service pages',
      'No dentist profile or credential information',
      'Poor mobile usability & non-responsive design',
      'Broken contact or booking journey',
      'Weak local search visibility with active patient demand',
      'New clinic, new branch, or recently announced expansion',
      'Active social media marketing with a weak landing page',
    ],
    localDiscoveryKeywords: [
      'dental clinic',
      'dentist',
      'dental surgery',
      'aesthetic dental centre',
      'implant center',
      'orthodontist',
      'teeth clinic',
    ],
    exampleRecommendation:
      'The clinic has an active public business presence, but no online appointment workflow was identified. An appointment-enabled clinic website and WhatsApp lead capture may improve patient inquiries.',
  },
  {
    id: 'aesthetic-skin-beauty',
    name: 'Aesthetic, Skin and Beauty Clinics',
    shortLabel: 'Aesthetic & Skin',
    iconName: 'Sparkles',
    subcategories: [
      'Dermatology & Skin Care',
      'Laser & Aesthetic Medicine',
      'Anti-Aging & Cosmetic Surgery',
      'Hair Restoration & PRP Clinics',
      'Cosmetology Clinics',
      'Medical Aesthetics & Skin Rejuvenation',
    ],
    recommendedServices: [
      'Premium aesthetic clinic website',
      'Online consultation & appointment booking',
      'Mobile application (where commercially justified)',
      'Detailed treatment & procedure pages',
      'Doctor and specialist medical profiles',
      'Before-and-after showcase (authorized public content)',
      'Brand identity and luxury clinic styling',
      'Social media management & meta ads landing pages',
      'Local SEO & patient lead-management CRM',
    ],
    opportunitySignals: [
      'No official website found',
      'Weak or outdated website',
      'No online appointment or consultation process',
      'Missing treatment procedure or pricing information',
      'Poor mobile experience on smartphone screens',
      'Weak inquiry process or friction-filled contact journey',
      'New clinic or new treatment launch',
      'Active social media presence but poor website conversion journey',
    ],
    localDiscoveryKeywords: [
      'skin clinic',
      'dermatologist',
      'aesthetic clinic',
      'laser skin center',
      'cosmetology',
      'hair transplant clinic',
      'beauty clinic',
    ],
    exampleRecommendation:
      'The clinic maintains active public treatment promotions, but lacks a high-converting website with an automated consultation booking workflow. A premium clinic website and consultation CRM may significantly enhance patient acquisition.',
  },
  {
    id: 'real-estate-companies',
    name: 'Real Estate Companies and Agencies',
    shortLabel: 'Real Estate',
    iconName: 'Building2',
    subcategories: [
      'Real Estate Agencies & Realtors',
      'Property Developers & Builders',
      'Commercial Property Brokers',
      'Housing Society Marketers',
      'Rental & Letting Agents',
      'Plot & Land Dealers',
    ],
    recommendedServices: [
      'Professional real estate agency website',
      'Searchable property listing portal',
      'Property search and filter system (price, area, bedrooms)',
      'Agent and property management CRM',
      'Mobile application (for inventory & client tours)',
      'Property enquiry & investor lead capture',
      'SEO for city-wide property keywords',
      'Brand identity & project marketing collateral',
      'Digital advertising & lead-generation funnels',
    ],
    opportunitySignals: [
      'Agencies with active property listings but no official website',
      'Agencies relying solely on Facebook/WhatsApp or third-party portals (Zameen/Graana)',
      'Websites with outdated, non-searchable or incomplete listings',
      'No property search or filter functionality',
      'No effective enquiry forms or lead capture mechanisms',
      'No agent profile or verification pages',
      'New projects, developments, branches, or expansion announcements',
      'Businesses with visible property inventory but weak online presentation',
    ],
    localDiscoveryKeywords: [
      'real estate agency',
      'property dealers',
      'builders and developers',
      'estate marketing',
      'property consultants',
      'housing society marketers',
      'commercial property',
    ],
    exampleRecommendation:
      'The agency publicly advertises property listings, but lacks a dedicated searchable property portal. A modern property listing website with search filters and a lead-management CRM may streamline property inquiries.',
  },
  {
    id: 'ecommerce-clothing',
    name: 'E-Commerce and Clothing Brands',
    shortLabel: 'E-Commerce & Apparel',
    iconName: 'ShoppingBag',
    subcategories: [
      'Clothing Brands & Pret',
      'Fashion Labels & Couturiers',
      'Apparel & Eastern Wear',
      'Online Clothing Stores',
      'Shoes and Footwear Brands',
      'Watch Brands and Watch Retailers',
      'Accessories & Jewelry Brands',
      'Consumer-Product D2C Brands',
    ],
    recommendedServices: [
      'Professional e-commerce website',
      'Shopify or custom online store',
      'Mobile shopping application (where scale justifies)',
      'Structured product catalogue organization',
      'Automated shopping cart and checkout',
      'Cash on Delivery (COD) & online payment integration',
      'Branding and packaging design',
      'SEO for product and brand discovery',
      'Social media marketing & performance ads',
      'Conversion rate optimisation (CRO)',
    ],
    opportunitySignals: [
      'Brands selling solely through Instagram, Facebook, or WhatsApp without an official store',
      'Businesses with an outdated or broken online store',
      'Poor product catalogue organization',
      'Weak product pages lacking high-res images or size charts',
      'Difficult or manual ordering process (DM for price)',
      'Missing or unclear delivery, COD, and return policy information',
      'Weak mobile shopping experience',
      'New product collections or brand launches',
      'Active promotions with weak landing pages',
    ],
    localDiscoveryKeywords: [
      'clothing brand',
      'pret wear',
      'fashion label',
      'eastern wear',
      'apparel store',
      'online boutique',
      'd2c brand',
    ],
    exampleRecommendation:
      'The brand promotes apparel on public social channels, but no official online store was identified. A dedicated Shopify or custom e-commerce store with automated checkout and COD tracking may convert social followers into direct sales.',
  },
  {
    id: 'education-schools',
    name: 'Education Institutes and Schools',
    shortLabel: 'Education & Schools',
    iconName: 'GraduationCap',
    subcategories: [
      'Private Schools & Networks',
      'School Networks & Branches',
      'Colleges & Higher Education',
      'Academies & Coaching Centres',
      'Tuition & Test Prep Centres (MDCAT/ECAT/CSS)',
      'Vocational & Training Institutes',
      'Educational Organisations',
    ],
    recommendedServices: [
      'Professional educational institution website',
      'Online admission & registration system',
      'Student portal',
      'Parent portal',
      'Learning management system (LMS)',
      'Attendance and fee-management integrations',
      'Mobile application (where scale justifies)',
      'Online enquiry and prospect registration',
      'Brand identity and campus collateral',
      'SEO & admission digital marketing campaigns',
    ],
    opportunitySignals: [
      'Schools or institutes operating without official websites',
      'Outdated or incomplete websites lacking admission portals',
      'No online admission or student enquiry form',
      'No programme, course, syllabus, or faculty information',
      'No parent/student portal where demonstrated institutional need exists',
      'Multiple campuses with limited centralised digital information',
      'New campus openings or new academic courses',
      'Active admission campaigns with weak online application journeys',
    ],
    localDiscoveryKeywords: [
      'school',
      'grammar school',
      'college',
      'coaching centre',
      'academy',
      'training institute',
      'tuition centre',
      'cadet college',
    ],
    exampleRecommendation:
      'The institute advertises student admissions, but no online admission enquiry form was identified. A modern school website and automated online admission portal may improve enrollment conversion.',
  },
  {
    id: 'travel-agencies',
    name: 'Travel Agencies and Tour Operators',
    shortLabel: 'Travel & Tours',
    iconName: 'Plane',
    subcategories: [
      'Travel Agencies',
      'Tour Operators',
      'Umrah and Hajj Travel Operators',
      'Domestic Tour Companies (Northern Pakistan)',
      'International Travel Companies',
      'Ticketing & Visa Assistance Agencies',
      'Holiday and Travel Package Businesses',
    ],
    recommendedServices: [
      'Travel agency website',
      'Tour and package booking system',
      'Online enquiry and custom itinerary forms',
      'Customer management CRM',
      'Mobile application (where scale justifies)',
      'Package catalogue with day-by-day itineraries and transparent pricing',
      'Brand identity and travel collateral',
      'SEO for destination and package keywords',
      'Social media marketing and seasonal advertising landing pages',
    ],
    opportunitySignals: [
      'Agencies with public social media activity but no official website',
      'No online package catalogue or downloadable itineraries',
      'No enquiry or booking workflow',
      'Outdated package information or non-mobile layouts',
      'Poor mobile experience on smartphones',
      'New destinations, Umrah groups, or seasonal tours announced',
      'Expansion announcements or new branch openings',
      'Weak online conversion paths from social posts to booking',
    ],
    localDiscoveryKeywords: [
      'travel agency',
      'tour operator',
      'umrah services',
      'hajj travel',
      'tours and travels',
      'ticketing agency',
      'northern areas tours',
    ],
    exampleRecommendation:
      'The agency promotes travel packages, but no clear online enquiry or package-booking journey was identified. A structured travel website with package itineraries and booking forms may streamline customer conversions.',
  },
  {
    id: 'watch-shops',
    name: 'Watch Shops and Watch Retailers',
    shortLabel: 'Watch Retailers',
    iconName: 'Watch',
    subcategories: [
      'Independent Watch Shops',
      'Luxury Watch Retailers',
      'Watch Brands & Importers',
      'Premium Watch Stores',
      'Online Watch Sellers',
      'Watch Distributors & Wholesalers',
    ],
    recommendedServices: [
      'E-commerce website with brand & model filters',
      'High-resolution product catalogue with specs (movement, case, warranty)',
      'Online ordering and secure checkout (COD / Bank transfer)',
      'Product photography and luxury branding',
      'Inventory integration (where appropriate)',
      'SEO for watch brands and model searches',
      'Social media marketing & performance advertising',
    ],
    opportunitySignals: [
      'Active sellers using only social media (Instagram/Facebook) or WhatsApp',
      'No official online store or branded digital presence',
      'Weak product presentation lacking specifications and authentic warranty info',
      'Missing product categories, brand filters, or price sorting',
      'No clear enquiry or order process',
      'New brand or physical store launch',
      'Multiple branches without a centralized website',
    ],
    localDiscoveryKeywords: [
      'watch shop',
      'watches store',
      'luxury watches',
      'watch retailer',
      'watch dealer',
      'chronometer',
    ],
    exampleRecommendation:
      'The retailer displays timepieces publicly, but a structured online product catalogue was not identified. A dedicated e-commerce catalog with brand filters and online ordering may expand reach beyond physical footfall.',
  },
  {
    id: 'soda-beverage',
    name: 'Soda Shops and Beverage Businesses',
    shortLabel: 'Soda & Beverage',
    iconName: 'CupSoda',
    subcategories: [
      'Soft-Drink Shops & Juice Bars',
      'Beverage Retailers & Chains',
      'Beverage Brands & Bottlers',
      'Juice and Gourmet Soda Businesses',
      'Local Beverage Manufacturers',
      'Beverage Distributors & Wholesalers',
      'Bottling & Mineral Water Businesses',
    ],
    recommendedServices: [
      'Business website and brand showcase',
      'Product catalogue with nutritional and flavor profiles',
      'Brand identity, packaging, and label design',
      'Distributor and dealer enquiry portal',
      'Wholesale and franchise enquiry system',
      'E-commerce store (where direct-to-consumer is commercially viable)',
      'SEO for regional distribution and retail presence',
      'Social media marketing and retail influencer campaigns',
    ],
    opportunitySignals: [
      'Beverage brands or bottling companies with no official website',
      'Businesses with weak, incomplete, or unbranded product catalogues',
      'Manufacturers without a clear distributor or dealer enquiry channel',
      'New beverage launches, flavor rollouts, or packaging updates',
      'Retail chains or distributors expanding into new cities',
      'Weak online brand presentation despite established physical retail distribution',
    ],
    localDiscoveryKeywords: [
      'beverage manufacturer',
      'soda shop',
      'juice bar',
      'bottling company',
      'mineral water plant',
      'drink distributor',
      'syrup manufacturer',
    ],
    exampleRecommendation:
      'The manufacturer publicly lists products, but lacks a dedicated distributor and dealer enquiry channel. A branded website with a distributor onboarding portal may accelerate wholesale growth.',
  },
  {
    id: 'shoe-shops',
    name: 'Shoe Shops and Footwear Brands',
    shortLabel: 'Footwear & Shoes',
    iconName: 'Footprints',
    subcategories: [
      'Footwear Brands',
      'Shoe Retailers & Outlets',
      'Online Shoe Stores',
      'Sports Footwear Sellers',
      'Leather Footwear Brands (Peshawari Chappal / Khussa / Formal)',
      'Shoe Manufacturers selling directly to consumers',
    ],
    recommendedServices: [
      'E-commerce store with shoe size and style filters',
      'Product catalogue with multi-angle photography',
      'Size guides and fit recommendations',
      'Online ordering, cart checkout, and COD courier tracking',
      'Mobile-optimized shopping experience',
      'Brand identity and packaging design',
      'SEO for footwear styles and brand terms',
      'Social media marketing and dynamic product ads',
    ],
    opportunitySignals: [
      'Footwear businesses selling through social media without their own website',
      'Poor product presentation lacking size options or clear sole/material details',
      'No product filters or structured size availability',
      'Difficult manual ordering experience via direct message',
      'No clear return, size exchange, or delivery information',
      'New collections, seasonal footwear, or brand launches',
      'Multi-branch shoe retailers without a centralized online store',
    ],
    localDiscoveryKeywords: [
      'shoe shop',
      'footwear brand',
      'leather shoes',
      'peshawari chappal',
      'sneakers store',
      'shoe manufacturer',
      'sandals outlet',
    ],
    exampleRecommendation:
      'The retailer promotes footwear, but an organized online catalogue with size and product filters was not identified. A responsive footwear e-commerce store with size guides may boost direct online orders.',
  },
];

/**
 * Permitted Pakistani Business Discovery Directories (Section 4)
 */
export const PAKISTAN_DISCOVERY_DIRECTORIES = [
  'pakbd.com',
  'businesslist.pk',
  'businessonline.pk',
  'pakistanbusinessjournal.com',
  'directory.pk',
] as const;

/**
 * Maps a niche string to a Pakistan Target Industry if applicable.
 */
export function findTargetIndustry(niche: string): TargetIndustryDefinition | undefined {
  if (!niche) return undefined;
  const n = niche.toLowerCase().trim();

  // 1. Dental
  if (n.includes('dental') || n.includes('dentist') || n.includes('orthodont')) {
    return PAKISTAN_TARGET_INDUSTRIES.find((i) => i.id === 'dental-clinics');
  }

  // 2. Aesthetic & Skin
  if (
    n.includes('aesthetic') ||
    n.includes('skin') ||
    n.includes('dermatolog') ||
    n.includes('laser') ||
    n.includes('hair transplant') ||
    n.includes('cosmetic clinic')
  ) {
    return PAKISTAN_TARGET_INDUSTRIES.find((i) => i.id === 'aesthetic-skin-beauty');
  }

  // 3. Real Estate
  if (
    n.includes('real estate') ||
    n.includes('property') ||
    n.includes('estate agent') ||
    n.includes('builder') ||
    n.includes('developer') ||
    n.includes('housing')
  ) {
    return PAKISTAN_TARGET_INDUSTRIES.find((i) => i.id === 'real-estate-companies');
  }

  // 4. E-Commerce & Clothing
  if (
    n.includes('clothing') ||
    n.includes('apparel') ||
    n.includes('fashion') ||
    n.includes('pret') ||
    n.includes('e-commerce') ||
    n.includes('ecommerce') ||
    n.includes('d2c') ||
    n.includes('online store')
  ) {
    return PAKISTAN_TARGET_INDUSTRIES.find((i) => i.id === 'ecommerce-clothing');
  }

  // 5. Education & Schools
  if (
    n.includes('school') ||
    n.includes('college') ||
    n.includes('academy') ||
    n.includes('coaching') ||
    n.includes('tuition') ||
    n.includes('education') ||
    n.includes('institute')
  ) {
    return PAKISTAN_TARGET_INDUSTRIES.find((i) => i.id === 'education-schools');
  }

  // 6. Travel & Tours
  if (
    n.includes('travel') ||
    n.includes('tour') ||
    n.includes('umrah') ||
    n.includes('hajj') ||
    n.includes('trip') ||
    n.includes('holiday')
  ) {
    return PAKISTAN_TARGET_INDUSTRIES.find((i) => i.id === 'travel-agencies');
  }

  // 7. Watch Shops
  if (n.includes('watch') || n.includes('timepiece') || n.includes('chronometer')) {
    return PAKISTAN_TARGET_INDUSTRIES.find((i) => i.id === 'watch-shops');
  }

  // 8. Soda & Beverage
  if (
    n.includes('soda') ||
    n.includes('beverage') ||
    n.includes('juice') ||
    n.includes('drink') ||
    n.includes('bottling') ||
    n.includes('water plant')
  ) {
    return PAKISTAN_TARGET_INDUSTRIES.find((i) => i.id === 'soda-beverage');
  }

  // 9. Shoe Shops & Footwear
  if (
    n.includes('shoe') ||
    n.includes('footwear') ||
    n.includes('chappal') ||
    n.includes('khussa') ||
    n.includes('sneaker')
  ) {
    return PAKISTAN_TARGET_INDUSTRIES.find((i) => i.id === 'shoe-shops');
  }

  return undefined;
}

/**
 * Automatically determines the optimal OpportunityType for Client Bridge
 */
export function determineOpportunityType(
  industry: string,
  websiteStatus: WebsiteStatus,
  siteAudit?: any,
  candidate?: any
): OpportunityType {
  const targetIndustry = findTargetIndustry(industry);
  const indId = targetIndustry?.id;

  // Case 1: Missing website -> Opportunity type tailored to industry
  if (websiteStatus === 'No Website Found') {
    if (indId === 'ecommerce-clothing' || indId === 'watch-shops' || indId === 'shoe-shops') {
      return 'ecommerce';
    }
    if (indId === 'real-estate-companies') {
      return 'property_portal';
    }
    if (indId === 'dental-clinics' || indId === 'aesthetic-skin-beauty' || indId === 'travel-agencies') {
      return 'booking_system';
    }
    if (indId === 'education-schools') {
      return 'student_portal';
    }
    return 'new_website';
  }

  // Case 2: Broken or unreachable site
  if (websiteStatus === 'Broken' || websiteStatus === 'Unreachable') {
    return 'website_redesign';
  }

  // Case 3: Reachable website with specific gaps
  if (siteAudit) {
    if (
      (indId === 'ecommerce-clothing' || indId === 'watch-shops' || indId === 'shoe-shops') &&
      !siteAudit.ecommerceStorefrontDetected
    ) {
      return 'ecommerce';
    }
    if (
      (indId === 'dental-clinics' || indId === 'aesthetic-skin-beauty' || indId === 'travel-agencies') &&
      !siteAudit.bookingWorkflowDetected
    ) {
      return 'booking_system';
    }
    if (indId === 'education-schools' && !siteAudit.hasContactForm) {
      return 'student_portal';
    }
    if (indId === 'real-estate-companies') {
      return 'property_portal';
    }
    if (siteAudit.websiteStatus === 'Outdated Indicators' || !siteAudit.hasViewportMeta) {
      return 'website_redesign';
    }
    if (!siteAudit.title || siteAudit.title.length < 10) {
      return 'seo';
    }
    if (siteAudit.socialLinks?.facebook || siteAudit.socialLinks?.instagram) {
      return 'digital_marketing';
    }
  }

  return 'multiple_services';
}

/**
 * Generates the Client Bridge tailored opportunity recommendation
 */
export function generateClientBridgeRecommendation(
  industry: string,
  companyName: string,
  websiteStatus: WebsiteStatus,
  city: string = 'Pakistan',
  siteAudit?: any
): {
  problem: string;
  recommendedService: string;
  evidence: string;
  whyQualifies: string;
  manualVerificationNeeded: string;
} {
  const targetIndustry = findTargetIndustry(industry);
  const indId = targetIndustry?.id;
  const isNoSite = websiteStatus === 'No Website Found';
  const isBroken = websiteStatus === 'Broken' || websiteStatus === 'Unreachable';

  let problem = '';
  let recommendedService = '';
  let evidence = '';
  let whyQualifies = '';
  let manualVerificationNeeded = '';

  if (indId === 'dental-clinics') {
    if (isNoSite) {
      problem = 'Absence of official clinic website & online patient booking workflow';
      recommendedService = 'Turnkey Dental Clinic Website with Online Appointment Booking & WhatsApp Integration';
      evidence = `Verified dental clinic operating in ${city} without an official indexed website or online appointment scheduling channel.`;
      whyQualifies = 'Established clinic with public patient presence lacking a digital front door for direct appointments.';
      manualVerificationNeeded = 'Confirm clinic branch operating hours and primary consulting dentist availability.';
    } else if (isBroken) {
      problem = 'Clinic website server unreachable / technical connection failure';
      recommendedService = 'Website Recovery, Mobile Optimization & Patient Appointment Booking';
      evidence = `Direct HTTP connection to clinic web server failed (${websiteStatus}).`;
      whyQualifies = 'Patients attempting to access clinic details encounter server downtime, losing potential consultations.';
      manualVerificationNeeded = 'Verify whether clinic has ongoing web hosting migration.';
    } else {
      problem = 'Website lacks structured online appointment system and doctor profile showcase';
      recommendedService = 'Online Patient Booking System, Doctor Profiles & Local SEO';
      evidence = 'Clinic website does not offer an automated appointment form or interactive patient inquiry workflow.';
      whyQualifies = 'Active practice with existing web traffic that fails to convert visitors into booked appointments.';
      manualVerificationNeeded = 'Verify whether phone/WhatsApp is currently their only manual booking method.';
    }
  } else if (indId === 'aesthetic-skin-beauty') {
    if (isNoSite) {
      problem = 'Absence of official clinic website to convert social audience into consultations';
      recommendedService = 'Premium Aesthetic Clinic Website, Consultation Booking & Patient CRM';
      evidence = `Clinic maintains public profile in ${city} but has no dedicated web consultation portal.`;
      whyQualifies = 'High-ticket cosmetic and skin treatments require credibility and structured consultation booking.';
      manualVerificationNeeded = 'Review doctor registration and clinic aesthetic equipment licensing.';
    } else {
      problem = 'Website lacks high-converting consultation booking and treatment procedure guides';
      recommendedService = 'Aesthetic Consultation Booking Funnel, Treatment Pages & Lead CRM';
      evidence = 'Existing website lacks automated consultation booking or mobile-optimized treatment inquiry pages.';
      whyQualifies = 'Existing digital presence with measurable conversion friction for high-value treatment inquiries.';
      manualVerificationNeeded = 'Review existing lead intake workflow with clinic reception.';
    }
  } else if (indId === 'real-estate-companies') {
    if (isNoSite) {
      problem = 'Agency relies on third-party portals without a dedicated searchable property portal';
      recommendedService = 'Searchable Real Estate Portal, Property Filters & Lead Management CRM';
      evidence = `Active real estate business in ${city} advertising inventory without an independent company website.`;
      whyQualifies = 'Agency spends on advertising properties on third-party portals without building branded equity.';
      manualVerificationNeeded = 'Verify active property inventory count and agency license.';
    } else {
      problem = 'Website lacks interactive property search filters (price, area, bedrooms) and CRM integration';
      recommendedService = 'Property Search & Filter Portal Modernization with Lead Tracking CRM';
      evidence = 'Website displays static listings without dynamic filtering or instant agent lead routing.';
      whyQualifies = 'High-value property buyers face poor search UX, reducing direct buyer inquiries.';
      manualVerificationNeeded = 'Assess existing property listing database and MLS/portal synchronization.';
    }
  } else if (indId === 'ecommerce-clothing') {
    if (isNoSite) {
      problem = 'Brand sells through social channels (Instagram/Facebook) without an automated online store';
      recommendedService = 'Shopify / Custom E-Commerce Store with Automated Checkout & COD Courier Integration';
      evidence = `Active clothing brand in ${city} with social presence but no dedicated e-commerce storefront.`;
      whyQualifies = 'Brand loses sales from manual "DM to order" friction; automated store provides 24/7 purchasing.';
      manualVerificationNeeded = 'Review product SKU volume and active payment/courier partnerships (TCS/Leopards/Trax).';
    } else {
      problem = 'Online store has checkout friction, unoptimized mobile UX, or missing product filters';
      recommendedService = 'E-Commerce Store Redesign, Mobile CRO & Automated COD Tracking';
      evidence = 'Store exhibits usability gaps in mobile checkout, product categorization, or page performance.';
      whyQualifies = 'Direct-to-consumer store with visible conversion bottlenecks limiting customer lifetime value.';
      manualVerificationNeeded = 'Audit current mobile cart abandonment rate.';
    }
  } else if (indId === 'education-schools') {
    if (isNoSite) {
      problem = 'Educational institute operates without an official website or online admission portal';
      recommendedService = 'Professional Educational Website with Online Admission System & Student Portal';
      evidence = `Active school/institute in ${city} lacking an official indexed website for parent/student information.`;
      whyQualifies = 'Parents seeking admission information cannot access curriculum, faculty, or online registration.';
      manualVerificationNeeded = 'Verify campus network count and current academic enrollment intake season.';
    } else {
      problem = 'Website lacks automated admission application system and structured academic portal';
      recommendedService = 'Online Admission System, Parent Portal & Admission SEO Campaigns';
      evidence = 'Website does not provide online registration or downloadable prospectus forms.';
      whyQualifies = 'Active admission campaigns direct prospective families to an informational page with no capture.';
      manualVerificationNeeded = 'Confirm whether manual paper registration is currently enforced.';
    }
  } else if (indId === 'travel-agencies') {
    if (isNoSite) {
      problem = 'Agency promotes tours & Umrah packages without an official online booking or itinerary portal';
      recommendedService = 'Travel Agency Website with Tour & Package Booking System & WhatsApp CRM';
      evidence = `Active travel business in ${city} promoting packages without an independent booking website.`;
      whyQualifies = 'Travelers demand transparent itineraries, pricing, and fast visa/package inquiry workflows.';
      manualVerificationNeeded = 'Verify DTS / IATA registration and current Umrah/tour licensing.';
    } else {
      problem = 'Website lacks structured package booking, day-by-day itineraries, or online quote forms';
      recommendedService = 'Tour Package Catalog Modernization, Online Quote Engine & Travel CRM';
      evidence = 'Website lists packages without interactive booking dates, itinerary breakdowns, or quote forms.';
      whyQualifies = 'Travelers encounter friction when requesting quotes, resulting in high inquiry drop-off.';
      manualVerificationNeeded = 'Confirm seasonal package availability.';
    }
  } else if (indId === 'watch-shops') {
    if (isNoSite) {
      problem = 'Watch retailer displays timepieces on social/physical channels without an official online store';
      recommendedService = 'Luxury Watch E-Commerce Store with Brand Filters & Secure Checkout';
      evidence = `Operating watch seller in ${city} with active catalog but no dedicated e-commerce website.`;
      whyQualifies = 'High-value timepiece buyers seek authentic specification details, brand filters, and warranty.';
      manualVerificationNeeded = 'Verify authorized dealer status or authentic pre-owned certification.';
    } else {
      problem = 'Online catalog lacks technical watch specifications (movement, case, glass) and filtering';
      recommendedService = 'Structured Watch Catalogue Redesign & E-Commerce Conversion Optimization';
      evidence = 'Website displays products without structured specification attributes or brand filter facets.';
      whyQualifies = 'Enthusiasts and luxury buyers require detailed horological specifications to make purchasing decisions.';
      manualVerificationNeeded = 'Confirm brand inventory stock feed.';
    }
  } else if (indId === 'soda-beverage') {
    if (isNoSite) {
      problem = 'Beverage manufacturer / brand lacks official website and B2B distributor onboarding channel';
      recommendedService = 'Branded Beverage Website, Product Showcase & Distributor Onboarding Portal';
      evidence = `Operating beverage business in ${city} with retail distribution but no official digital headquarters.`;
      whyQualifies = 'Wholesale distributors and retail outlets cannot easily verify brand credentials or request supply.';
      manualVerificationNeeded = 'Verify manufacturing facility location and distribution radius.';
    } else {
      problem = 'Website lacks dedicated wholesale/distributor inquiry system and product flavor showcase';
      recommendedService = 'B2B Distributor Enquiry Portal & Product Catalogue Modernization';
      evidence = 'Website does not provide distributor application forms or wholesale catalog downloads.';
      whyQualifies = 'Commercial buyers seeking regional distribution rights lack a streamlined application pathway.';
      manualVerificationNeeded = 'Confirm current distributor territory availability.';
    }
  } else if (indId === 'shoe-shops') {
    if (isNoSite) {
      problem = 'Footwear retailer sells on social media without an organized e-commerce store and size filters';
      recommendedService = 'Footwear E-Commerce Store with Size/Fit Filters & COD Courier Integration';
      evidence = `Operating footwear seller in ${city} with catalog but no dedicated shopping website.`;
      whyQualifies = 'Shoe sizing questions create friction in chat; an e-commerce store automates size selection.';
      manualVerificationNeeded = 'Confirm standard Pakistani/European shoe size chart availability.';
    } else {
      problem = 'Website lacks interactive shoe size availability filters and clear exchange policy';
      recommendedService = 'Footwear E-Commerce Redesign with Size Availability Filter & Fit Guide';
      evidence = 'Online store lacks dynamic size filtering or size exchange instructions.';
      whyQualifies = 'Size uncertainty is the #1 cause of footwear cart abandonment; filter fixes directly lift revenue.';
      manualVerificationNeeded = 'Review return/exchange logistics policy.';
    }
  } else {
    // General fallback for other niches
    if (isNoSite) {
      problem = 'Absence of official business website (Digital Void)';
      recommendedService = 'Turnkey Professional Website Development & Brand Presence';
      evidence = `Verified operating commercial entity in ${city} without an official indexed domain.`;
      whyQualifies = 'Operating business with verified commercial activity lacking a digital front door.';
      manualVerificationNeeded = 'Confirm physical commercial operating address.';
    } else if (isBroken) {
      problem = 'Website server unreachable or broken connection';
      recommendedService = 'Website Server Recovery, Modernization & Hosting Migration';
      evidence = `Direct server connection failed (${websiteStatus}).`;
      whyQualifies = 'Customers attempting to access business online encounter server downtime.';
      manualVerificationNeeded = 'Verify domain DNS and web hosting status.';
    } else {
      problem = 'Digital presence lacks modern conversion architecture and direct lead generation';
      recommendedService = 'Website Modernization, Lead Capture Optimization & Digital Marketing';
      evidence = 'Website displays standard information without automated lead capture or mobile optimization.';
      whyQualifies = 'Active business with existing online presence that can increase conversion throughput.';
      manualVerificationNeeded = 'Confirm business growth objectives and target customer segments.';
    }
  }

  return {
    problem,
    recommendedService,
    evidence,
    whyQualifies,
    manualVerificationNeeded,
  };
}

/**
 * Maps raw email or phone verification data to strict ContactAccuracyStatus (Section 7)
 */
export function evaluateContactAccuracyStatus(
  contactValue: string,
  isTechnicallyVerified: boolean,
  sourceUrl?: string
): ContactAccuracyStatus {
  if (!contactValue || contactValue === 'Not Found' || contactValue === 'Unknown' || contactValue === 'None') {
    return 'not_found';
  }

  if (isTechnicallyVerified) {
    return 'technically_verified';
  }

  if (sourceUrl && sourceUrl.startsWith('http')) {
    return 'publicly_listed';
  }

  return 'unverified';
}
