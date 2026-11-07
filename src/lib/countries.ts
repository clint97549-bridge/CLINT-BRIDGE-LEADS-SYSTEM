/**
 * Worldwide country dataset with ISO codes, dial codes, major regions,
 * and localized business terminology.
 * Default and primary priority market: Pakistan (PK).
 */

export interface CountryInfo {
  name: string;
  code: string;       // ISO alpha-2
  code3: string;      // ISO alpha-3
  dialCode: string;   // without '+'
  region: string;
  majorCities: string[];
  localTerms: Record<string, string>;
}

export interface PakistanProvince {
  name: string;
  code: string;
  cities: string[];
  keyCommercialZones: string[];
}

export const PAKISTAN_PROVINCES: PakistanProvince[] = [
  {
    name: 'Sindh',
    code: 'SD',
    cities: ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpurkhas', 'Kotri', 'Thatta'],
    keyCommercialZones: [
      'Karachi - DHA & Clifton',
      'Karachi - Saddar & I.I. Chundrigar',
      'Karachi - Gulshan-e-Iqbal & Johar',
      'Karachi - North Nazimabad & Federal B Area',
      'Karachi - Korangi & SITE Industrial Area',
      'Karachi - PECHS & Tariq Road',
      'Hyderabad - Auto Bhan & Latifabad',
      'Sukkur - Military Road',
    ],
  },
  {
    name: 'Punjab',
    code: 'PB',
    cities: ['Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Sialkot', 'Gujrat', 'Bahawalpur', 'Sargodha', 'Sahiwal', 'Sheikhupura', 'Rahim Yar Khan', 'Jhelum', 'Kasur'],
    keyCommercialZones: [
      'Lahore - Gulberg (MM Alam & Main Boulevard)',
      'Lahore - DHA Phase 1-8 & Raya',
      'Lahore - Johar Town & Model Town',
      'Lahore - Mall Road & Jail Road',
      'Lahore - Badami Bagh & Circular Road',
      'Faisalabad - D-Ground & Kohinoor City',
      'Rawalpindi - Saddar & Commercial Market Satellite Town',
      'Rawalpindi - Bahria Town (Phase 1-8)',
      'Multan - Bosan Road & Gulgasht Colony',
      'Gujranwala - Model Town & GT Road',
      'Sialkot - Paris Road & Small Industrial Estate',
      'Gujrat - Court Road & GT Road',
    ],
  },
  {
    name: 'Islamabad Capital Territory',
    code: 'ICT',
    cities: ['Islamabad'],
    keyCommercialZones: [
      'Islamabad - Blue Area & Jinnah Avenue',
      'Islamabad - F-6 & Super Market',
      'Islamabad - F-7 & Jinnah Super',
      'Islamabad - F-10 & F-11 Markaz',
      'Islamabad - G-9 & G-11 Markaz',
      'Islamabad - I-8 Markaz',
      'Islamabad - DHA Phase 2 & Bahria Town Islamabad',
      'Islamabad - E-11 & Golra Road',
    ],
  },
  {
    name: 'Khyber Pakhtunkhwa',
    code: 'KP',
    cities: ['Peshawar', 'Abbottabad', 'Mardan', 'Swat / Mingora', 'Kohat', 'Dera Ismail Khan', 'Mansehra', 'Nowshera'],
    keyCommercialZones: [
      'Peshawar - University Road & Hayatabad',
      'Peshawar - Saddar & Cantonment',
      'Abbottabad - Karakoram Highway & Mansehra Road',
      'Mardan - Bank Road',
    ],
  },
  {
    name: 'Balochistan',
    code: 'BA',
    cities: ['Quetta', 'Gwadar', 'Turbat', 'Khuzdar', 'Chaman', 'Hub'],
    keyCommercialZones: [
      'Quetta - Jinnah Road & Zarghoon Road',
      'Quetta - Cantonment & Shahrah-e-Iqbal',
      'Gwadar - Marine Drive & Free Zone',
      'Hub - Industrial Trading Estate',
    ],
  },
  {
    name: 'Azad Jammu & Kashmir',
    code: 'AJK',
    cities: ['Muzaffarabad', 'Mirpur', 'Rawalakot', 'Kotli'],
    keyCommercialZones: [
      'Mirpur - Allama Iqbal Road & Sector F-1',
      'Muzaffarabad - Domel & Secretariat Road',
    ],
  },
  {
    name: 'Gilgit-Baltistan',
    code: 'GB',
    cities: ['Gilgit', 'Skardu', 'Hunza (Aliabad / Karimabad)'],
    keyCommercialZones: [
      'Gilgit - Airport Road & City Park Road',
      'Skardu - Main Bazaar',
    ],
  },
];

export const ALL_PAKISTAN_SYSTEMATIC_CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Gujranwala',
  'Sialkot',
  'Hyderabad',
];

export const COUNTRIES: CountryInfo[] = [
  {
    name: 'Pakistan',
    code: 'PK',
    code3: 'PAK',
    dialCode: '92',
    region: 'Asia',
    majorCities: [
      'Karachi',
      'Lahore',
      'Islamabad',
      'Rawalpindi',
      'Faisalabad',
      'Multan',
      'Peshawar',
      'Quetta',
      'Gujranwala',
      'Sialkot',
      'Hyderabad',
      'Sukkur',
      'Gujrat',
      'Abbottabad',
      'Bahawalpur',
      'All Pakistan (Multi-City Matrix)',
    ],
    localTerms: {
      builders: 'builders and developers construction companies contractors PEC registered',
      roofing: 'roof waterproofing roof leakage repair heat proofing',
      dental: 'dental clinics dental surgery aesthetic dental centers',
      plumbing: 'plumbers sanitary works plumbing contractors commercial plumbing emergency plumbers',
      electricians: 'electrical contractors electrical engineering works',
      solicitors: 'advocates High Court law associates legal consultants',
      estate_agents: 'real estate builders and marketing property dealers estate agency',
      hvac: 'HVAC contractors air conditioning engineering central AC',
      rent_a_car: 'rent a car car rental service rent a car with driver self drive luxury car hire monthly car rental',
      english_language: 'English language centers spoken English academy IELTS preparation English coaching institute',
      graphic_design: 'graphic design training center IT institute design academy computer college short courses vocational training',
      vape_retail: 'vape shop vape store e-cigarette pod mod liquid flavours smoke shop retail',
      ecommerce: 'online store D2C brand clothing apparel cosmetics shopping cart cash on delivery COD delivery across Pakistan',
      property_managers: 'property management real estate consultants estate marketing property advisors',
    },
  },
  {
    name: 'United Kingdom',
    code: 'GB',
    code3: 'GBR',
    dialCode: '44',
    region: 'Europe',
    majorCities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Bristol', 'Sheffield', 'Edinburgh', 'Newcastle', 'Cardiff', 'Belfast'],
    localTerms: {
      builders: 'builders construction firms trades',
      roofing: 'roofers roofing contractors roof repair',
      dental: 'dental practices dental clinics private dentists',
      plumbing: 'plumbers heating engineers Gas Safe',
      electricians: 'electricians NICEIC electrical contractors',
      solicitors: 'solicitors law firms legal practices',
      estate_agents: 'estate agents letting agents property management',
      hvac: 'air conditioning heating engineers HVAC contractors',
    },
  },
  {
    name: 'United States',
    code: 'US',
    code3: 'USA',
    dialCode: '1',
    region: 'North America',
    majorCities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Austin', 'Miami', 'Atlanta', 'Denver', 'Seattle'],
    localTerms: {
      builders: 'general contractors home builders construction companies',
      roofing: 'roofing contractors roof replacement commercial roofing',
      dental: 'dentists dental clinics cosmetic dentistry',
      plumbing: 'plumbing contractors commercial plumbers licensed plumbers',
      electricians: 'electrical contractors licensed electricians commercial electric',
      solicitors: 'attorneys law offices legal group trial lawyers',
      estate_agents: 'real estate brokers realtors property management agencies',
      hvac: 'HVAC contractors air conditioning repair heating and cooling',
    },
  },
  {
    name: 'Canada',
    code: 'CA',
    code3: 'CAN',
    dialCode: '1',
    region: 'North America',
    majorCities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Halifax'],
    localTerms: {
      builders: 'general contractors custom home builders construction firms',
      roofing: 'roofing companies roofing contractors roof repair services',
      dental: 'dentists dental clinics family dental centers',
      plumbing: 'plumbing and heating licensed plumbers drain services',
      electricians: 'electrical contractors certified electricians',
      solicitors: 'lawyers barristers and solicitors legal counsel',
      estate_agents: 'realtors real estate brokerages property managers',
      hvac: 'HVAC contractors heating and air conditioning ventilation specialists',
    },
  },
  {
    name: 'Australia',
    code: 'AU',
    code3: 'AUS',
    dialCode: '61',
    region: 'Oceania',
    majorCities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Newcastle', 'Sunshine Coast', 'Hobart'],
    localTerms: {
      builders: 'registered builders building contractors commercial construction',
      roofing: 'roof restoration roof plumbing roofing contractors',
      dental: 'dental clinics dental surgeries general dentists',
      plumbing: 'licensed plumbers gas fitters drainers',
      electricians: 'licensed electricians electrical services',
      solicitors: 'solicitors legal practitioners law practices',
      estate_agents: 'real estate agents buyers agents property managers',
      hvac: 'air conditioning specialists refrigeration and HVAC',
    },
  },
  {
    name: 'New Zealand',
    code: 'NZ',
    code3: 'NZL',
    dialCode: '64',
    region: 'Oceania',
    majorCities: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Dunedin', 'Palmerston North', 'Napier'],
    localTerms: {
      builders: 'licensed building practitioners master builders residential construction',
      roofing: 'roofing specialists longrun roofing re-roofing',
      dental: 'dental centers dental clinics orthodontic practices',
      plumbing: 'certifying plumbers gasfitters drainlayers',
      electricians: 'registered electricians master electricians',
      solicitors: 'barristers and solicitors law firms',
      estate_agents: 'real estate consultants licensed property agents',
      hvac: 'heat pump specialists ventilation heating engineers',
    },
  },
  {
    name: 'United Arab Emirates',
    code: 'AE',
    code3: 'ARE',
    dialCode: '971',
    region: 'Middle East',
    majorCities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Al Ain'],
    localTerms: {
      builders: 'general contracting construction contracting civil contractors fitout',
      roofing: 'waterproofing roof insulation roofing services',
      dental: 'dental clinics medical centers specialized dental clinics',
      plumbing: 'sanitary maintenance MEP contractors plumbing services',
      electricians: 'electrical maintenance MEP engineering contractors',
      solicitors: 'advocates legal consultants law firms legal attorneys',
      estate_agents: 'real estate brokerage property consultants luxury real estate',
      hvac: 'AC maintenance HVAC contractors chiller maintenance',
    },
  },
  {
    name: 'Saudi Arabia',
    code: 'SA',
    code3: 'SAU',
    dialCode: '966',
    region: 'Middle East',
    majorCities: ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Mecca', 'Medina', 'Tabuk'],
    localTerms: {
      builders: 'general contracting companies construction firms contracting',
      roofing: 'thermal insulation waterproofing roofing contracting',
      dental: 'dental centers specialized dental clinics dental care',
      plumbing: 'sanitary plumbing maintenance contracting MEP',
      electricians: 'electrical contracting electrical installations',
      solicitors: 'legal consultancy law offices attorneys',
      estate_agents: 'real estate marketing real estate offices property brokerage',
      hvac: 'air conditioning HVAC installations central AC contracting',
    },
  },
  {
    name: 'Germany',
    code: 'DE',
    code3: 'DEU',
    dialCode: '49',
    region: 'Europe',
    majorCities: ['Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Leipzig'],
    localTerms: {
      builders: 'Bauunternehmen Baugesellschaft Hochbau Handwerksbetrieb',
      roofing: 'Dachdecker Dachdeckermeister Bedachungen',
      dental: 'Zahnarztpraxis Zahnklinik Zahnärzte',
      plumbing: 'Sanitär Heizung Klempnerei Haustechnik',
      electricians: 'Elektroinstallateur Elektrotechnik Meisterbetrieb',
      solicitors: 'Rechtsanwälte Anwaltskanzlei Fachanwalt',
      estate_agents: 'Immobilienmakler Immobilienbüro Hausverwaltung',
      hvac: 'Klima und Lüftungstechnik Kältetechnik Klimatechnik',
    },
  },
  {
    name: 'France',
    code: 'FR',
    code3: 'FRA',
    dialCode: '33',
    region: 'Europe',
    majorCities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Bordeaux', 'Lille'],
    localTerms: {
      builders: 'entreprise du bâtiment entreprise générale de construction maçonnerie',
      roofing: 'couvreur zingueur rénovation de toiture',
      dental: 'cabinet dentaire chirurgien dentiste centre dentaire',
      plumbing: 'plomberie chauffage artisan plombier',
      electricians: 'électricien entreprise électricité générale',
      solicitors: 'cabinet d’avocats avocat au barreau',
      estate_agents: 'agence immobilière gestion locative transactions',
      hvac: 'climatisation pompe à chaleur génie climatique',
    },
  },
  {
    name: 'Spain',
    code: 'ES',
    code3: 'ESP',
    dialCode: '34',
    region: 'Europe',
    majorCities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Bilbao'],
    localTerms: {
      builders: 'empresas constructoras reformas integrales empresa de construcción',
      roofing: 'reparación de tejados cubiertas impermeabilizaciones',
      dental: 'clínica dental odontología centro odontológico',
      plumbing: 'fontanería fontaneros autorizados instalaciones',
      electricians: 'instalaciones eléctricas electricistas autorizados',
      solicitors: 'despacho de abogados bufete asesoría jurídica',
      estate_agents: 'agencia inmobiliaria gestión inmobiliaria bienes raíces',
      hvac: 'aire acondicionado climatización calefacción',
    },
  },
  {
    name: 'Italy',
    code: 'IT',
    code3: 'ITA',
    dialCode: '39',
    region: 'Europe',
    majorCities: ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Bologna', 'Florence', 'Bari', 'Catania', 'Venice'],
    localTerms: {
      builders: 'impresa edile costruzioni ristrutturazioni edili',
      roofing: 'rifacimento tetti coperture impermeabilizzazioni',
      dental: 'studio dentistico clinica odontoiatrica dentista',
      plumbing: 'termoidraulica impianti idraulici idraulico',
      electricians: 'impianti elettrici elettricista installatore',
      solicitors: 'studio legale avvocati consulenza legale',
      estate_agents: 'agenzia immobiliare intermediazione immobiliare',
      hvac: 'condizionamento climatizzazione impianti termici',
    },
  },
  {
    name: 'Ireland',
    code: 'IE',
    code3: 'IRL',
    dialCode: '353',
    region: 'Europe',
    majorCities: ['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Drogheda', 'Dundalk', 'Kilkenny'],
    localTerms: {
      builders: 'building contractors registered builders construction companies',
      roofing: 'roofing contractors roof repair emergency roofers',
      dental: 'dental clinics dental surgeries family dentists',
      plumbing: 'plumbers heating engineers RGII registered gas installers',
      electricians: 'safe electric registered electricians electrical contractors',
      solicitors: 'solicitors legal practitioners legal firms',
      estate_agents: 'estate agents auctioneers property managers',
      hvac: 'air conditioning refrigeration heat pumps ventilation',
    },
  },
  {
    name: 'Netherlands',
    code: 'NL',
    code3: 'NLD',
    dialCode: '31',
    region: 'Europe',
    majorCities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen', 'Tilburg', 'Almere', 'Breda'],
    localTerms: {
      builders: 'bouwbedrijf aannemer bouwbedrijven aannemersbedrijf',
      roofing: 'dakdekkersbedrijf dakdekker dakrenovatie',
      dental: 'tandartspraktijk tandartsen mondzorg',
      plumbing: 'loodgieter installatiebedrijf sanitair en verwarming',
      electricians: 'elektricien elektrotechniek elektrotechnisch installatiebedrijf',
      solicitors: 'advocatenkantoor advocaten juristen',
      estate_agents: 'makelaar makelaardij vastgoedbeheer',
      hvac: 'klimaatbeheersing airconditioning ventilatiesystemen',
    },
  },
  {
    name: 'Singapore',
    code: 'SG',
    code3: 'SGP',
    dialCode: '65',
    region: 'Asia',
    majorCities: ['Singapore', 'Jurong', 'Tampines', 'Woodlands', 'Ang Mo Kio', 'Bedok'],
    localTerms: {
      builders: 'general building contractors BCA registered renovation contractors',
      roofing: 'roof waterproofing roof leakage specialists',
      dental: 'dental clinics orthodontic centers dental surgery',
      plumbing: 'PUB licensed plumbers plumbing contractors emergency plumbers',
      electricians: 'EMA licensed electrical workers electrical engineering',
      solicitors: 'advocates and solicitors law practices legal counsel',
      estate_agents: 'CEA licensed real estate agencies property consultants',
      hvac: 'aircon servicing air conditioning installation commercial HVAC',
    },
  },
  {
    name: 'India',
    code: 'IN',
    code3: 'IND',
    dialCode: '91',
    region: 'Asia',
    majorCities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Chandigarh', 'Kochi'],
    localTerms: {
      builders: 'builders developers construction companies civil contractors',
      roofing: 'roofing contractors industrial roofing shed fabrication waterproofing',
      dental: 'dental clinics multispeciality dental hospital cosmetic dentist',
      plumbing: 'plumbing contractors sanitary consultants MEP contractors',
      electricians: 'licensed electrical contractors electrical engineering',
      solicitors: 'advocates law firms legal associates corporate lawyers',
      estate_agents: 'real estate consultants property advisors realtors brokerage',
      hvac: 'HVAC contractors central air conditioning ventilation systems',
    },
  },
  {
    name: 'South Africa',
    code: 'ZA',
    code3: 'ZAF',
    dialCode: '27',
    region: 'Africa',
    majorCities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London'],
    localTerms: {
      builders: 'registered NHBRC builders building contractors construction',
      roofing: 'roofing contractors roof repairs waterproofing',
      dental: 'dental practices dental studios dental surgeons',
      plumbing: 'PIRB registered plumbers plumbing contractors',
      electricians: 'ECASA registered electrical contractors certified electricians',
      solicitors: 'attorneys at law legal firm legal practitioners',
      estate_agents: 'estate agencies property specialists realtors',
      hvac: 'refrigeration and air conditioning HVAC contractors',
    },
  },
];

export interface UKRegion {
  name: string;
  code: string;
  nation: 'England' | 'Scotland' | 'Wales' | 'Northern Ireland';
  majorCities: string[];
  keyPostcodeAreas: string[];
}

export const UK_NATIONS = [
  'England',
  'Scotland',
  'Wales',
  'Northern Ireland',
] as const;

export const UK_REGIONS: UKRegion[] = [
  {
    name: 'Greater London',
    code: 'GL',
    nation: 'England',
    majorCities: ['London', 'Croydon', 'Bromley', 'Enfield', 'Harrow', 'Kingston upon Thames'],
    keyPostcodeAreas: ['EC', 'WC', 'W', 'SW', 'SE', 'E', 'N', 'NW'],
  },
  {
    name: 'North West England',
    code: 'NW',
    nation: 'England',
    majorCities: ['Manchester', 'Liverpool', 'Preston', 'Bolton', 'Chester', 'Blackpool', 'Stockport'],
    keyPostcodeAreas: ['M', 'L', 'PR', 'BL', 'CH', 'FY', 'SK'],
  },
  {
    name: 'West Midlands',
    code: 'WM',
    nation: 'England',
    majorCities: ['Birmingham', 'Coventry', 'Wolverhampton', 'Solihull', 'Dudley', 'Walsall'],
    keyPostcodeAreas: ['B', 'CV', 'WV', 'DY', 'WS'],
  },
  {
    name: 'Yorkshire and the Humber',
    code: 'YH',
    nation: 'England',
    majorCities: ['Leeds', 'Sheffield', 'Bradford', 'York', 'Hull', 'Doncaster', 'Huddersfield'],
    keyPostcodeAreas: ['LS', 'S', 'BD', 'YO', 'HU', 'DN', 'HD'],
  },
  {
    name: 'South East England',
    code: 'SE',
    nation: 'England',
    majorCities: ['Brighton', 'Southampton', 'Portsmouth', 'Reading', 'Milton Keynes', 'Oxford'],
    keyPostcodeAreas: ['BN', 'SO', 'PO', 'RG', 'MK', 'OX'],
  },
  {
    name: 'South West England',
    code: 'SW',
    nation: 'England',
    majorCities: ['Bristol', 'Plymouth', 'Exeter', 'Bath', 'Bournemouth', 'Gloucester', 'Swindon'],
    keyPostcodeAreas: ['BS', 'PL', 'EX', 'BA', 'BH', 'GL', 'SN'],
  },
  {
    name: 'East of England',
    code: 'EE',
    nation: 'England',
    majorCities: ['Norwich', 'Cambridge', 'Ipswich', 'Peterborough', 'Luton', 'Chelmsford', 'Colchester'],
    keyPostcodeAreas: ['NR', 'CB', 'IP', 'PE', 'LU', 'CM', 'CO'],
  },
  {
    name: 'East Midlands',
    code: 'EM',
    nation: 'England',
    majorCities: ['Nottingham', 'Leicester', 'Derby', 'Northampton', 'Lincoln', 'Mansfield'],
    keyPostcodeAreas: ['NG', 'LE', 'DE', 'NN', 'LN'],
  },
  {
    name: 'North East England',
    code: 'NE',
    nation: 'England',
    majorCities: ['Newcastle upon Tyne', 'Sunderland', 'Middlesbrough', 'Durham', 'Darlington'],
    keyPostcodeAreas: ['NE', 'SR', 'TS', 'DH', 'DL'],
  },
  {
    name: 'Scotland',
    code: 'SCT',
    nation: 'Scotland',
    majorCities: ['Glasgow', 'Edinburgh', 'Aberdeen', 'Dundee', 'Inverness', 'Stirling', 'Perth'],
    keyPostcodeAreas: ['G', 'EH', 'AB', 'DD', 'IV', 'FK', 'PH'],
  },
  {
    name: 'Wales',
    code: 'WLS',
    nation: 'Wales',
    majorCities: ['Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Bangor', 'Barry'],
    keyPostcodeAreas: ['CF', 'SA', 'NP', 'LL'],
  },
  {
    name: 'Northern Ireland',
    code: 'NIR',
    nation: 'Northern Ireland',
    majorCities: ['Belfast', 'Derry / Londonderry', 'Lisburn', 'Newry', 'Bangor'],
    keyPostcodeAreas: ['BT'],
  },
];

export interface USState {
  name: string;
  code: string; // 2-letter postal abbreviation
  region: 'Northeast' | 'Midwest' | 'South' | 'West';
  majorCities: string[];
}

export const US_STATES: USState[] = [
  { name: 'Alabama', code: 'AL', region: 'South', majorCities: ['Birmingham', 'Montgomery', 'Huntsville', 'Mobile'] },
  { name: 'Alaska', code: 'AK', region: 'West', majorCities: ['Anchorage', 'Fairbanks', 'Juneau'] },
  { name: 'Arizona', code: 'AZ', region: 'West', majorCities: ['Phoenix', 'Tucson', 'Mesa', 'Scottsdale', 'Chandler'] },
  { name: 'Arkansas', code: 'AR', region: 'South', majorCities: ['Little Rock', 'Fort Smith', 'Fayetteville'] },
  { name: 'California', code: 'CA', region: 'West', majorCities: ['Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Fresno', 'Sacramento', 'Long Beach', 'Oakland'] },
  { name: 'Colorado', code: 'CO', region: 'West', majorCities: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Boulder'] },
  { name: 'Connecticut', code: 'CT', region: 'Northeast', majorCities: ['Bridgeport', 'New Haven', 'Stamford', 'Hartford', 'Waterbury'] },
  { name: 'Delaware', code: 'DE', region: 'South', majorCities: ['Wilmington', 'Dover', 'Newark'] },
  { name: 'District of Columbia', code: 'DC', region: 'South', majorCities: ['Washington DC'] },
  { name: 'Florida', code: 'FL', region: 'South', majorCities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale', 'St. Petersburg', 'Tallahassee'] },
  { name: 'Georgia', code: 'GA', region: 'South', majorCities: ['Atlanta', 'Augusta', 'Columbus', 'Savannah', 'Athens'] },
  { name: 'Hawaii', code: 'HI', region: 'West', majorCities: ['Honolulu', 'Hilo', 'Kailua'] },
  { name: 'Idaho', code: 'ID', region: 'West', majorCities: ['Boise', 'Meridian', 'Nampa', 'Idaho Falls'] },
  { name: 'Illinois', code: 'IL', region: 'Midwest', majorCities: ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford', 'Springfield'] },
  { name: 'Indiana', code: 'IN', region: 'Midwest', majorCities: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel'] },
  { name: 'Iowa', code: 'IA', region: 'Midwest', majorCities: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City'] },
  { name: 'Kansas', code: 'KS', region: 'Midwest', majorCities: ['Wichita', 'Overland Park', 'Kansas City', 'Topeka', 'Olathe'] },
  { name: 'Kentucky', code: 'KY', region: 'South', majorCities: ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro'] },
  { name: 'Louisiana', code: 'LA', region: 'South', majorCities: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette'] },
  { name: 'Maine', code: 'ME', region: 'Northeast', majorCities: ['Portland', 'Lewiston', 'Bangor'] },
  { name: 'Maryland', code: 'MD', region: 'South', majorCities: ['Baltimore', 'Frederick', 'Rockville', 'Gaithersburg', 'Annapolis'] },
  { name: 'Massachusetts', code: 'MA', region: 'Northeast', majorCities: ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell'] },
  { name: 'Michigan', code: 'MI', region: 'Midwest', majorCities: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor'] },
  { name: 'Minnesota', code: 'MN', region: 'Midwest', majorCities: ['Minneapolis', 'Saint Paul', 'Rochester', 'Duluth', 'Bloomington'] },
  { name: 'Mississippi', code: 'MS', region: 'South', majorCities: ['Jackson', 'Gulfport', 'Southaven', 'Biloxi'] },
  { name: 'Missouri', code: 'MO', region: 'Midwest', majorCities: ['Kansas City', 'Saint Louis', 'Springfield', 'Columbia', 'Independence'] },
  { name: 'Montana', code: 'MT', region: 'West', majorCities: ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Helena'] },
  { name: 'Nebraska', code: 'NE', region: 'Midwest', majorCities: ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island'] },
  { name: 'Nevada', code: 'NV', region: 'West', majorCities: ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas'] },
  { name: 'New Hampshire', code: 'NH', region: 'Northeast', majorCities: ['Manchester', 'Nashua', 'Concord', 'Dover'] },
  { name: 'New Jersey', code: 'NJ', region: 'Northeast', majorCities: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Trenton', 'Hoboken'] },
  { name: 'New Mexico', code: 'NM', region: 'West', majorCities: ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe'] },
  { name: 'New York', code: 'NY', region: 'Northeast', majorCities: ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany'] },
  { name: 'North Carolina', code: 'NC', region: 'South', majorCities: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem'] },
  { name: 'North Dakota', code: 'ND', region: 'Midwest', majorCities: ['Fargo', 'Bismarck', 'Grand Forks', 'Minot'] },
  { name: 'Ohio', code: 'OH', region: 'Midwest', majorCities: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton'] },
  { name: 'Oklahoma', code: 'OK', region: 'South', majorCities: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Edmond'] },
  { name: 'Oregon', code: 'OR', region: 'West', majorCities: ['Portland', 'Salem', 'Eugene', 'Gresham', 'Hillsboro', 'Bend'] },
  { name: 'Pennsylvania', code: 'PA', region: 'Northeast', majorCities: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading'] },
  { name: 'Rhode Island', code: 'RI', region: 'Northeast', majorCities: ['Providence', 'Warwick', 'Cranston', 'Pawtucket'] },
  { name: 'South Carolina', code: 'SC', region: 'South', majorCities: ['Charleston', 'Columbia', 'North Charleston', 'Mount Pleasant', 'Greenville'] },
  { name: 'South Dakota', code: 'SD', region: 'Midwest', majorCities: ['Sioux Falls', 'Rapid City', 'Aberdeen'] },
  { name: 'Tennessee', code: 'TN', region: 'South', majorCities: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville'] },
  { name: 'Texas', code: 'TX', region: 'South', majorCities: ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington'] },
  { name: 'Utah', code: 'UT', region: 'West', majorCities: ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem'] },
  { name: 'Vermont', code: 'VT', region: 'Northeast', majorCities: ['Burlington', 'South Burlington', 'Rutland', 'Montpelier'] },
  { name: 'Virginia', code: 'VA', region: 'South', majorCities: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Arlington', 'Alexandria'] },
  { name: 'Washington', code: 'WA', region: 'West', majorCities: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Kent'] },
  { name: 'West Virginia', code: 'WV', region: 'South', majorCities: ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg'] },
  { name: 'Wisconsin', code: 'WI', region: 'Midwest', majorCities: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine'] },
  { name: 'Wyoming', code: 'WY', region: 'West', majorCities: ['Cheyenne', 'Casper', 'Laramie', 'Gillette'] },
];

export const MARKET_OPTIONS = [
  'Pakistan',
  'United Kingdom',
  'United States',
  'UK + USA',
  'All enabled markets',
] as const;

export type MarketOption = typeof MARKET_OPTIONS[number];

export function findCountry(countryInput: string): CountryInfo | undefined {
  if (!countryInput) return COUNTRIES[0]; // Pakistan default
  const normalized = countryInput.trim().toLowerCase();

  // Handle common aliases
  if (normalized === 'gb' || normalized === 'uk' || normalized.includes('united kingdom') || normalized === 'britain' || normalized === 'england') {
    return COUNTRIES.find((c) => c.code === 'GB');
  }
  if (normalized === 'us' || normalized === 'usa' || normalized.includes('united states') || normalized === 'america') {
    return COUNTRIES.find((c) => c.code === 'US');
  }
  if (normalized === 'pk' || normalized.includes('pakistan')) {
    return COUNTRIES.find((c) => c.code === 'PK');
  }

  return COUNTRIES.find(
    (c) =>
      c.name.toLowerCase() === normalized ||
      c.code.toLowerCase() === normalized ||
      c.code3.toLowerCase() === normalized
  );
}

export { PAKISTAN_TARGET_INDUSTRIES } from './pakistanIndustries';

export const CLIENT_BRIDGE_NICHES = [
  // Pakistan High-Intent Priority Target Industries (Section 2)
  'Dental Clinics',
  'Aesthetic, Skin and Beauty Clinics',
  'Real Estate Companies and Agencies',
  'E-Commerce and Clothing Brands',
  'Education Institutes and Schools',
  'Travel Agencies and Tour Operators',
  'Watch Shops and Watch Retailers',
  'Soda Shops and Beverage Businesses',
  'Shoe Shops and Footwear Brands',

  // Core Specialized & Service Niches
  'Rent-a-Car',
  'Spas, Aesthetics & Cosmetic Clinics',
  'Roofing & Restoration Contractors',
  'HVAC & Climate Control Contractors',
  'Dental Practices & Private Clinics',
  'Commercial Cleaning & Facility Services',
  'Plumbers, Heating & Mechanical Contractors',
  'Electrical Contractors & Engineering',
  'Solicitors, Attorneys & Law Firms',
  'Real Estate & Letting Agents',
  'Accounting & Tax Advisory Firms',
  'Construction, Builders & Shopfitters',
  'Solar & Renewable Energy Installers',
  'Architecture & Interior Design Studios',
  'English Language & Graphic Design Academies',
  'Vape Retailers & Smoke Shops',
  'E-Commerce Stores & D2C Brands',
  'Auto Repair, Bodyshops & Detailing',
  'Veterinary Hospitals & Emergency Clinics',
  'Property Managers',
] as const;

export const POPULAR_NICHES = [...CLIENT_BRIDGE_NICHES];

