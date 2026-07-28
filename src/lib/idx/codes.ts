// Generated from the official homegate IDX 3.01 spec workbook (idx-format-v3.01_v015.xls,
// sheet "object category and type"). Labels are the spec's own portal wording per language.
// Regenerate rather than hand-editing if the spec ever changes.
import type { ObjectCategory } from './types';

export interface ObjectTypeCode {
  code: number;
  de: string;
  fr: string;
  it: string;
  en: string;
}

export const OBJECT_CATEGORY_LABELS: Record<ObjectCategory, { de: string; fr: string; it: string; en: string }> = {
  APPT: { de: 'Wohnung', fr: 'Appartement', it: 'Appartamento', en: 'Apartment' },
  HOUSE: { de: 'Haus', fr: 'Maison', it: 'Casa', en: 'House' },
  PROP: { de: 'Grundstück', fr: 'Terrain', it: 'Terreno', en: 'Plot' },
  PARK: { de: 'Parkplatz', fr: 'Place de parc', it: 'Posteggio', en: 'Parking space' },
  INDUS: { de: 'Gewerbe/Industrie', fr: 'Commerce/Industrie', it: 'Industria/Commercio', en: 'Industrial Objects' },
  GASTRO: { de: 'Gastronomie', fr: 'Gastronomie', it: 'Gastronomia', en: 'Gastronomy' },
  AGRI: { de: 'Landwirtschaft', fr: 'Agriculture', it: 'Agricoltura', en: 'Agriculture' },
  GARDEN: { de: 'Garten', fr: 'Jardin', it: 'Giardino', en: 'Garden' },
  SECONDARY: { de: 'Wohnnebenräume', fr: 'Pièces annexes', it: 'Locale di servizio', en: 'Secondary rooms' },
};

export const OBJECT_TYPE_CODES: Record<ObjectCategory, ObjectTypeCode[]> = {
  APPT: [
    { code: 1, de: 'Wohnung', fr: 'Appartement', it: 'Appartamento', en: 'Apartment' },
    { code: 2, de: 'Maisonette / Duplex', fr: 'Duplex', it: 'Duplex', en: 'Duplex' },
    { code: 3, de: 'Attikawohnung', fr: 'Attique', it: 'Attico', en: 'Attic flat' },
    { code: 4, de: 'Dachwohnung', fr: 'Dernier étage', it: 'Appartamento ultimo piano', en: 'Roof flat' },
    { code: 5, de: 'Studio', fr: 'Studio', it: 'Monolocale', en: 'Studio' },
    { code: 6, de: 'Einzelzimmer', fr: 'Chambre', it: 'Camera', en: 'Single Room' },
    { code: 7, de: 'Möbl. Wohnobj.', fr: 'Appartement meublé', it: 'Appartamento ammobiliato', en: 'Furnished flat' },
    { code: 8, de: 'Terrassenwohnung', fr: 'Appartement terrasse', it: 'Appart. a terrazza', en: 'Terrace flat' },
    { code: 9, de: 'Einliegerwohnung', fr: 'Appt en annexe', it: 'Appart. attiguo', en: 'Bachelor flat' },
    { code: 10, de: 'Loft', fr: 'Loft', it: 'Loft', en: 'Loft' },
    { code: 11, de: 'Mansarde', fr: 'Mansarde', it: 'Mansarda', en: 'Attic' },
  ],
  HOUSE: [
    { code: 1, de: 'Einfamilienhaus', fr: 'Maison', it: 'Casa unifamiliare', en: 'Single house' },
    { code: 2, de: 'Reihenfamilienhaus', fr: 'Maison jumelle', it: 'Casa a schiera', en: 'Row house' },
    { code: 3, de: 'Doppeleinfamilienhaus', fr: 'Maison double', it: 'Casa bifamiliare', en: 'Bifamiliar house' },
    { code: 4, de: 'Terrassenhaus', fr: 'Maison terrasse', it: 'Casa a terrazza', en: 'Terrace house' },
    { code: 5, de: 'Villa', fr: 'Villa', it: 'Villa', en: 'Villa' },
    { code: 6, de: 'Bauernhaus', fr: 'Ferme', it: 'Fattoria', en: 'Farm house' },
    { code: 7, de: 'Mehrfamilienhaus', fr: 'Maison plurifamiliale', it: 'Casa plurifamiliare', en: 'Multiple dwelling' },
    { code: 9, de: 'Höhlen- / Erdhaus', fr: 'Habitation dans la terre', it: 'Casa interrata', en: 'Cave house / earthen house' },
    { code: 10, de: 'Schloss', fr: 'Château', it: 'Castello', en: 'Castle' },
    { code: 11, de: 'Stöckli', fr: 'Dépendance', it: 'Dépendance', en: 'Granny flat' },
    { code: 12, de: 'Chalet', fr: 'Chalet', it: 'Chalet', en: 'Chalet' },
    { code: 13, de: 'Rustico', fr: 'Rustico', it: 'Rustico', en: 'Rustic house' },
  ],
  PROP: [
    { code: 1, de: 'Bauland', fr: 'Terrain à bâtir', it: 'Terreno da costruire', en: 'Building land' },
    { code: 2, de: 'Agrarland', fr: 'Terrain agricole', it: 'Terreno agricolo', en: 'Agricultural land' },
    { code: 3, de: 'Gewerbeland', fr: 'Terrain commercial', it: 'Terreno commerciale', en: 'Commercial land' },
    { code: 4, de: 'Industriebauland', fr: 'Terrain industriel', it: 'Terreno industriale', en: 'Industrial land' },
  ],
  PARK: [
    { code: 1, de: 'offener Parkplatz', fr: 'Place ouverte', it: 'Parcheggio all\'aperto', en: 'Open slot' },
    { code: 2, de: 'Unterstand', fr: 'Place couverte', it: 'Parcheggio coperto', en: 'Covered slot' },
    { code: 3, de: 'Einzelgarage', fr: 'Garage individuel', it: 'Garage singolo', en: 'Single garage' },
    { code: 4, de: 'Doppelgarage', fr: 'Garage double', it: 'Garage doppio', en: 'Double garage' },
    { code: 5, de: 'Tiefgarage', fr: 'Place souterraine', it: 'Parcheggio sotterraneo', en: 'Underground slot' },
    { code: 7, de: 'Boot Hallenplatz', fr: 'Halle à bâteaux', it: 'Posteggio barca interno', en: 'Boat dry dock' },
    { code: 8, de: 'Boot Stegplatz', fr: 'Place extérieure à bâteaux', it: 'Attracco barca esterno', en: 'Boat landing stage' },
    { code: 9, de: 'Moto Hallenplatz', fr: 'Halle à motos', it: 'Posteggio moto in garage', en: 'Covered parking place bike' },
    { code: 10, de: 'Moto Aussenplatz', fr: 'Place extérieure à motos', it: 'Posteggio moto esterno', en: 'Outdoor parking place bike' },
    { code: 11, de: 'Stallboxe', fr: 'Boxe d\'écuire', it: 'Box in stalla', en: 'Horse box' },
    { code: 12, de: 'Boot Bojenplatz', fr: 'Place à bâteau balisée', it: 'Attracco barca (boa)', en: 'Boat mooring' },
  ],
  INDUS: [
    { code: 1, de: 'Büro', fr: 'Bureau', it: 'Ufficio', en: 'Office' },
    { code: 2, de: 'Ladenfläche', fr: 'Commerce', it: 'Commercio / negozio', en: 'Shop' },
    { code: 3, de: 'Werbefläche', fr: 'Exposition', it: 'Esposizioni', en: 'Advertising area' },
    { code: 4, de: 'Gewerbe', fr: 'Industrie', it: 'Industrie', en: 'Commercial' },
    { code: 5, de: 'Lager', fr: 'Dépôt', it: 'Magazzino', en: 'Storage room' },
    { code: 6, de: 'Praxis', fr: 'Cabinet médical', it: 'Studio medico', en: 'Practice' },
    { code: 7, de: 'Kiosk', fr: 'Kiosque', it: 'Chiosco', en: 'Kiosk' },
    { code: 8, de: 'Gärtnerei', fr: 'Jardinerie', it: 'Azienda di giardinaggio', en: 'Gardening' },
    { code: 9, de: 'Tankstelle', fr: 'Station-service', it: 'Stazione di benzina', en: 'Fuel station' },
    { code: 10, de: 'Autogarage', fr: 'Garage', it: 'Autorimessa', en: 'Garage' },
    { code: 11, de: 'Käserei', fr: 'Fromagerie', it: 'Caseificio', en: 'Cheese factory' },
    { code: 12, de: 'Metzgerei', fr: 'Boucherie', it: 'Macelleria', en: 'Butcher' },
    { code: 13, de: 'Bäckerei', fr: 'Boulangerie', it: 'Panetteria', en: 'Bakery' },
    { code: 14, de: 'Coiffeursalon', fr: 'Salon de coiffure', it: 'Salone da parrucchiere', en: 'Hairdresser' },
    { code: 15, de: 'Shoppingcenter', fr: 'Centre commercial', it: 'Centro commerciale', en: 'Shopping centre' },
    { code: 16, de: 'Fabrik', fr: 'Fabrique', it: 'Fabbrica', en: 'Factory' },
    { code: 17, de: 'Industrieobjekt', fr: 'Objet industriel', it: 'Oggetto industriale', en: 'Industrial object' },
    { code: 18, de: 'Arcade', fr: 'Arcade', it: 'Arcade', en: 'Arcade' },
    { code: 19, de: 'Atelier', fr: 'Atelier', it: 'Atelier', en: 'Atelier' },
    { code: 20, de: 'Wohn- / Geschäftshaus', fr: 'Imm.com.& hab.', it: 'Immob.com. e abitativo', en: 'Living / commercial building' },
    { code: 21, de: 'Bücherei', fr: 'Bibliothèque', it: 'Biblioteca', en: 'Library' },
    { code: 22, de: 'Krankenhaus', fr: 'Etablissement hospitalier', it: 'Ospedale', en: 'Hospital' },
    { code: 23, de: 'Labor', fr: 'Laboratoire', it: 'Laboratorio', en: 'Laboratory' },
    { code: 24, de: 'Minigolfplatz', fr: 'Place de minigolf', it: 'Campo da minigolf', en: 'Mini-golf course' },
    { code: 25, de: 'Pflegeheim', fr: 'Home de soins', it: 'Casa di cura', en: 'nursing home' },
    { code: 26, de: 'Reithalle', fr: 'Halle d\'équitation', it: 'Maneggio', en: 'Riding hall' },
    { code: 27, de: 'Sanatorium', fr: 'Sanatorium', it: 'Sanatorio', en: 'Sanatorium' },
    { code: 28, de: 'Werkstatt', fr: 'Atelier', it: 'Officina', en: 'Workshop' },
    { code: 29, de: 'Partyraum', fr: 'Salle des fêtes', it: 'Locale per feste', en: 'Party room' },
    { code: 30, de: 'Sauna', fr: 'Sauna', it: 'Sauna', en: 'Sauna' },
    { code: 31, de: 'Solarium', fr: 'Solarium', it: 'Solarium', en: 'Solarium' },
    { code: 32, de: 'Schreinerei', fr: 'Menuiserie', it: 'Falegnameria', en: 'Carpentry shop' },
    { code: 33, de: 'Altersheim', fr: 'Home pour personnes âgées', it: 'Casa di riposo', en: 'Old-age home' },
    { code: 34, de: 'Geschäftshaus', fr: 'Commerce', it: 'Edificio per uffici o negozi', en: 'Department store' },
    { code: 35, de: 'Heim', fr: 'Home', it: 'Istituto', en: 'Home' },
    { code: 36, de: 'Schaufenster', fr: 'Vitrine', it: 'Vetrina', en: 'Display window' },
    { code: 37, de: 'Parkhaus', fr: 'Parking à étages', it: 'Autosilo', en: 'Parking garage' },
    { code: 38, de: 'Parkfläche', fr: 'Surface de parking', it: 'Superficie per posteggi', en: 'Parking surface' },
  ],
  GASTRO: [
    { code: 1, de: 'Hotel', fr: 'Hôtel', it: 'Hotel', en: 'Hotel' },
    { code: 2, de: 'Restaurant', fr: 'Restaurant', it: 'Ristorante', en: 'Restaurant' },
    { code: 3, de: 'Café', fr: 'Café', it: 'Caffé', en: 'Coffeehouse' },
    { code: 4, de: 'Bar', fr: 'Bar', it: 'Bar', en: 'Bar' },
    { code: 5, de: 'Club / Disco', fr: 'Club / Disco', it: 'Club / Disco', en: 'Club / Disco' },
    { code: 6, de: 'Casino', fr: 'Casino', it: 'Casinò', en: 'Casino' },
    { code: 7, de: 'Kino / Theater', fr: 'Cinéma / théâtre', it: 'Cinema / teatro', en: 'Movie / theater' },
    { code: 8, de: 'Squash / Badminton', fr: 'Squash / Badminton', it: 'Squash / Badminton', en: 'Squash / Badminton' },
    { code: 9, de: 'Tennishalle', fr: 'Halle de tennis', it: 'Campo da tennis interno', en: 'Indoor tennis courts' },
    { code: 10, de: 'Tennisplatz', fr: 'Place de tennis', it: 'Campo da tennis esterno', en: 'Tennis court' },
    { code: 11, de: 'Sportanlage', fr: 'Installation sportive', it: 'Impianto sportivo', en: 'Sports hall' },
    { code: 12, de: 'Camping- / Zeltplatz', fr: 'Camping / Terrain campement', it: 'Campeggio', en: 'Campground / Tent camping' },
    { code: 13, de: 'Freibad', fr: 'Piscine ouverte', it: 'Piscina esterna', en: 'Outdoor swimming pool' },
    { code: 14, de: 'Hallenbad', fr: 'Piscine couverte', it: 'Piscina coperta', en: 'Indoor swimmingpool' },
    { code: 15, de: 'Golfplatz', fr: 'Terrain de golf', it: 'Campo da golf', en: 'Golf course' },
    { code: 16, de: 'Motel', fr: 'Motel', it: 'Motel', en: 'Motel' },
    { code: 17, de: 'Pub', fr: 'Pub', it: 'Pub', en: 'Pub' },
  ],
  AGRI: [
    { code: 1, de: 'Landwirtschaftsbetrieb', fr: 'Exploitation agricole', it: 'Sfruttamento agricolo', en: 'Agricultural installation' },
    { code: 2, de: 'Alpwirtschaft', fr: 'Exploitation montagne', it: 'Sfruttamento montagna', en: 'Mountain farm' },
    { code: 3, de: 'Farm', fr: 'Farm', it: 'Fattoria', en: 'Farm' },
  ],
  GARDEN: [
    { code: 0, de: 'Schrebergarten', fr: 'Jardin familial', it: 'Orto', en: 'Alottment garden' },
  ],
  SECONDARY: [
    { code: 0, de: 'Hobbyraum', fr: 'Pièce pour les hobbys', it: 'Locale per hobby', en: 'Hobby room' },
    { code: 1, de: 'Kellerabteil', fr: 'Cave', it: 'Scomparto cantina', en: 'Cellar compartment' },
    { code: 2, de: 'Estrichabteil', fr: 'Galetas', it: 'Scomparto soffitta', en: 'Attic compartment' },
  ],
};

/** Label for a type code in the given locale, falling back to English, then the raw code. */
export function objectTypeLabel(category: ObjectCategory, code: number, locale: string): string {
  const entry = OBJECT_TYPE_CODES[category].find((t) => t.code === code);
  if (!entry) return String(code);
  if (locale === 'de' || locale === 'fr' || locale === 'it' || locale === 'en') return entry[locale];
  return entry.en;
}
