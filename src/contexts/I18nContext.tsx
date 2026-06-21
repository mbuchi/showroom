import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Locale } from '@aireon/shared';

/**
 * Translation table for the showroom UI. Each key resolves to the matching
 * string in the active locale; missing keys fall back to English.
 *
 * Key prefixes by area:
 *   nav.*             — top navbar (search, locale selector, primary links)
 *   menu.*            — user menu items (saved parcels, sign out, etc.)
 *   gallery.*         — gallery page chrome (heading, counts, footer tips)
 *   gallery.filter.*  — toolbar filter pills, view-mode toggle, clear button
 *   gallery.sort.*    — sort dropdown options
 *   gallery.empty.*   — three empty states + retry/error wording
 *   card.*            — ExportCard hover actions, badges, dimensions row
 *   modal.detail.*    — lightbox + side metadata panel
 *   parcels.*         — saved-parcels side panel (header, search, filters, footer)
 *   page.reporter.*   — reporter page header, banners, address bar, regenerate
 *   page.reporter.widget.* — widget card status badges and metric labels
 *   common.*          — buttons & labels reused across components
 */
const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Navbar
    'nav.search_placeholder': 'Search exports, addresses, parcel IDs…',
    'nav.select_language': 'Select language',
    'nav.gallery': 'Gallery',
    'nav.reporter': 'Reporter',
    'nav.sign_in': 'Sign in',
    'nav.open_user_menu': 'Open user menu',
    'nav.open_with': 'Open with',

    // User menu
    'menu.my_saved_parcels': 'My saved parcels',
    'menu.view_profile': 'View profile',
    'menu.sign_out': 'Sign out',
    'menu.active_session': 'Active session',
    'menu.in_your_gallery': 'In your gallery',
    'menu.user_fallback': 'User',
    'menu.more_tools': 'More tools',
    'menu.release_notes': 'Release notes',

    // PRM — Save-to-PRM button on the parcel strip
    'prm.save': 'Track',
    'prm.saving': 'Saving…',
    'prm.saved': 'Tracked',
    'prm.open_in_proom': 'Open in proom',
    'prm.signin_required': 'Sign in to save parcels',
    'prm.save_failed': 'Could not save — try again',

    // Gallery — heading, counts, footer tips
    'gallery.heading': 'Your gallery',
    'gallery.count_filtered': '{visible} of {total} exports shown',
    'gallery.count_total': '{total} exports across the Aireon suite',
    'gallery.tip_search': 'to search',
    'gallery.tip_navigate': 'to navigate',
    'gallery.tip_favorite': 'to favorite',
    'gallery.tip_close': 'to close',
    'gallery.tips_label': 'Tips:',

    // Gallery — toolbar / filters / view modes
    'gallery.filter.favorites': 'Favorites',
    'gallery.filter.refresh': 'Refresh',
    'gallery.filter.view_grouped': 'Grouped',
    'gallery.filter.view_flat': 'Flat',
    'gallery.filter.from': 'From',
    'gallery.filter.clear': 'Clear',

    // Gallery — sort options
    'gallery.sort.recent': 'Recently added',
    'gallery.sort.oldest': 'Oldest first',
    'gallery.sort.count': 'Most exports',
    'gallery.sort.address': 'A → Z',

    // Gallery — empty / error states
    'gallery.empty.no_exports_title': 'Your gallery is waiting',
    'gallery.empty.no_exports_body':
      'Showroom collects exports you save from across the Aireon suite. Capture a screenshot or report and it will appear here automatically.',
    'gallery.empty.open_roofs': 'Open Roofs to capture',
    'gallery.empty.no_favorites_title': 'No favorites yet',
    'gallery.empty.no_favorites_body_prefix': 'Hit',
    'gallery.empty.no_favorites_body_suffix': 'in the lightbox or click the star on any export to keep it close.',
    'gallery.empty.show_all': 'Show all exports',
    'gallery.empty.no_matches_title': 'No matches',
    'gallery.empty.no_matches_body': 'Try a different search, clear your filters, or remove the favorites filter.',
    'gallery.empty.reset_filters': 'Reset filters',
    'gallery.error.title': "Couldn't load your exports",
    'gallery.error.fallback_load': 'Failed to load exports',
    'gallery.error.fallback_delete': 'Failed to delete export',
    'gallery.error.delete_confirm': 'Delete "{name}"? This cannot be undone.',

    // ParcelGroup
    'gallery.group.unassigned': 'Unassigned exports',
    'gallery.group.parcel_prefix': 'Parcel',
    'gallery.group.exports_one': '{count} export',
    'gallery.group.exports_other': '{count} exports',
    'gallery.group.show_all': 'show all',

    // ExportCard — hover actions, badges
    'card.open': 'Open {name}',
    'card.add_favorite': 'Add to favorites',
    'card.remove_favorite': 'Remove from favorites',
    'card.favorite_tooltip': 'Favorite (F)',
    'card.unfavorite_tooltip': 'Unfavorite (F)',
    'card.open_original': 'Open original',
    'card.open_original_aria': 'Open original in new tab',
    'card.delete': 'Delete',
    'card.delete_aria': 'Delete export',

    // Lightbox + metadata panel
    'modal.detail.close': 'Close (Esc)',
    'modal.detail.previous': 'Previous (←)',
    'modal.detail.next': 'Next (→)',
    'modal.detail.download': 'Download',
    'modal.detail.show_info': 'Show info (I)',
    'modal.detail.hide_info': 'Hide info',
    'modal.detail.section_location': 'Location',
    'modal.detail.section_capture': 'Capture',
    'modal.detail.section_additional': 'Additional metadata',
    'modal.detail.label_address': 'Address',
    'modal.detail.label_parcel_id': 'Parcel ID',
    'modal.detail.label_center': 'Center',
    'modal.detail.label_saved': 'Saved',
    'modal.detail.label_dimensions': 'Dimensions',
    'modal.detail.label_size': 'Size',
    'modal.detail.label_zoom': 'Zoom',
    'modal.detail.label_tilt': 'Tilt',
    'modal.detail.label_bearing': 'Bearing',
    'modal.detail.label_basemap': 'Basemap',
    'modal.detail.label_3d_mode': '3D mode',
    'modal.detail.value_on': 'On',
    'modal.detail.value_off': 'Off',

    // Saved parcels side panel
    'parcels.try_again': 'Try again',

    // Reporter page
    'page.reporter.kicker': 'Reporter',
    'page.reporter.intro':
      'Enter an address to generate a standardized showroom report — live map widgets recreating five Aireon apps at that location: valuation, building height, construction year, solar potential and noise exposure.',
    'page.reporter.search_disabled_prefix': 'Address search is disabled — the',
    'page.reporter.search_disabled_suffix': 'environment variable is not set for this deployment.',
    'page.reporter.search_placeholder': 'Search a Swiss address…',
    'page.reporter.search_error_fallback': 'Geocoding failed',
    'page.reporter.selected_location': 'Selected location',
    'page.reporter.regenerate': 'Regenerate',
    'page.reporter.no_report': 'No report yet — search for an address above to begin.',
    'page.reporter.parcel_unavailable': 'Parcel details unavailable for this location.',
    'page.reporter.flats_one': 'flat',
    'page.reporter.flats_other': 'flats',

    // Reporter — widget cards
    'page.reporter.widget.status.live': 'Live',
    'page.reporter.widget.status.loading': 'Loading',
    'page.reporter.widget.status.no_data': 'No data',
    'page.reporter.widget.status.failed': 'Failed',
    'page.reporter.widget.no_data_at_location': 'No data at this location',
    'page.reporter.widget.failed_to_load': 'Failed to load',
    'page.reporter.widget.retry': 'Retry',
    'page.reporter.widget.open_at_location': 'Open {label} at this location',
    'page.reporter.widget.mapbox_missing': 'Mapbox token not configured',
    'page.reporter.widget.solar_unavailable': 'Solar data unavailable',
    'page.reporter.widget.noise_unavailable': 'Noise data unavailable',
    'page.reporter.widget.metric.market_value': 'Market value',
    'page.reporter.widget.metric.building_height': 'Building height',
    'page.reporter.widget.metric.construction_year': 'Construction year',
    'page.reporter.widget.metric.solar_potential': 'Solar potential',
    'page.reporter.widget.metric.road_noise': 'Road noise',

    // Reporter — checkbox selection + report builder
    'page.reporter.widget.add_to_report': 'Add to report',
    'page.reporter.widget.in_report': 'In report',
    'page.reporter.widget.select_for_report': 'Add {label} to the report',
    'page.reporter.widget.deselect_for_report': 'Remove {label} from the report',
    'page.reporter.report.generate': 'Generate report',
    'page.reporter.report.generate_tooltip': 'Generate a PDF report with the {n} selected cards',
    'page.reporter.report.select_at_least_one': 'Select at least one card to include in the report',
    'page.reporter.report.waiting_for_data': 'Waiting for cards to finish loading…',

    // Report dialog (the modal that drives capture → render → download)
    'report.dialog.title': 'Build property report',
    'report.dialog.close': 'Close',
    'report.dialog.download': 'Download PDF',
    'report.dialog.try_again': 'Try again',
    'report.dialog.included_count': '{n} cards included',
    'report.dialog.ready_to_build': 'Preparing your report',
    'report.dialog.preamble':
      'Showroom is assembling a multi-page property dossier with the selected widgets, parcel facts, methodology and a Swiss-format disclaimer.',
    'report.dialog.capturing': 'Capturing live map snapshots',
    'report.dialog.capturing_body':
      'Each selected widget is being rendered to a high-resolution image so the PDF mirrors what you see on screen.',
    'report.dialog.rendering': 'Composing the PDF document',
    'report.dialog.rendering_body':
      'Laying out the cover, executive summary, parcel sheet, per-widget analyses and sources.',
    'report.dialog.ready': 'Report ready',
    'report.dialog.ready_body': 'Your branded, multi-page PDF is ready to download.',
    'report.dialog.error': 'Could not build the report',
    'report.dialog.error_body':
      'Something went wrong while building the PDF. You can retry — the live widgets above are unaffected.',

    // PDF document (rendered out-of-tree, resolved at build time)
    'report.pdf.tagline': 'PROPERTY INTELLIGENCE · SWITZERLAND',
    'report.pdf.title': 'Property Report',
    'report.pdf.subtitle': 'Showroom — multi-source location dossier',
    'report.pdf.report_id': 'Report ID',
    'report.pdf.generated_on': 'Generated on',
    'report.pdf.generated_for': 'Generated for',
    'report.pdf.executive_title': 'Executive summary',
    'report.pdf.executive_lead':
      'The headline figures below summarise the selected analyses for this location. Each section in the dossier explains the underlying method and links back to the live Aireon app that produced it.',
    'report.pdf.parcel_title': 'Parcel identification',
    'report.pdf.parcel_lead':
      'Identifiers and dimensions pulled from the Swiss Federal Register of Buildings and Dwellings (GWR / RegBL) for the parcel at the searched coordinates.',
    'report.pdf.analyses_title': 'Analyses',
    'report.pdf.methodology_title': 'Methodology',
    'report.pdf.sources_title': 'Sources & disclaimer',
    'report.pdf.disclaimer_title': 'Disclaimer',
    'report.pdf.disclaimer_body':
      'This report is an automated, indicative analysis produced by Aireon Showroom. It is not a certified property appraisal (Verkehrswertschätzung) within the meaning of Swiss banking practice (Art. 12 BankV) or RICS / SVS / SEK-SVIT standards. No physical inspection has been carried out and hidden defects, recent renovations or sub-market dynamics may not be captured. Indicative values should be read with a typical confidence band of ±10–15%.',
    'report.pdf.disclaimer_notice':
      'This document is not an investment recommendation nor a binding offer to buy or sell. Data sources are publicly available Swiss federal datasets cited above and remain subject to their respective terms of use. © Aireon.',
    'report.pdf.address': 'Address',
    'report.pdf.locality': 'Locality',
    'report.pdf.coordinates': 'Coordinates (WGS84)',
    'report.pdf.egrid': 'EGRID',
    'report.pdf.zone': 'Zone',
    'report.pdf.building_size': 'Building footprint',
    'report.pdf.building_volume': 'Building volume',
    'report.pdf.flats': 'Dwellings',
    'report.pdf.not_available': 'Not available',
    'report.pdf.metric': 'Headline metric',
    'report.pdf.assessment': 'Assessment',
    'report.pdf.method': 'Method',
    'report.pdf.source': 'Source',
    'report.pdf.live_app': 'Live app',
    'report.pdf.no_data': 'No data at this location',
    'report.pdf.failed': 'Capture failed',
    'report.pdf.page': 'Page',
    'report.pdf.of': 'of',
    'report.pdf.footer_brand': 'AIREON · Showroom',

    // Per-widget report copy
    'report.widget.valoo.blurb': 'Indicative market value derived from parcel-level hedonic modelling.',
    'report.widget.valoo.narrative':
      'The headline price expresses the modelled market value per square metre of parcel surface, fitted to the 2025 Aireon parcel snapshot. Use it as a fast triage figure — solid for ranking neighbouring parcels, indicative for a single asset.',
    'report.widget.valoo.method.1':
      'Hedonic regression over the parcel_2025_07 dataset using location, footprint, age and zoning signals.',
    'report.widget.valoo.method.2':
      'Eleven-class quantile ramp shown on the live map; the parcel under the pin is queried for its per-m² price.',
    'report.widget.valoo.method.3':
      'No physical inspection — interior fit-out, recent renovations and view premia are not captured.',
    'report.widget.valoo.detail.price_m2': 'Modelled price per m²',

    'report.widget.roofs.blurb': 'Building height above ground from federal 3D building data.',
    'report.widget.roofs.narrative':
      'Maximum and minimum building heights are taken from swissBUILDINGS3D 3.0, the federal 3D vector model derived from airborne LiDAR. The value reflects the highest roof point of the building over its lowest terrain corner.',
    'report.widget.roofs.method.1':
      'swissBUILDINGS3D 3.0 mesh joined to the parcel_2025_07 footprint via spatial overlap.',
    'report.widget.roofs.method.2':
      'Live mini-map extrudes each parcel by its bldg_height_max for instant visual context.',
    'report.widget.roofs.method.3':
      'Eaves and ridge are aggregated to a single per-building maximum; complex roofs may obscure structural detail.',
    'report.widget.roofs.detail.max': 'Maximum height',
    'report.widget.roofs.detail.min': 'Minimum height',

    'report.widget.roots.blurb': 'Construction year and parcel age from the federal building register.',
    'report.widget.roots.narrative':
      'The construction year is pulled from the Swiss Federal Register of Buildings and Dwellings (GWR / RegBL). It anchors energy expectations, maintenance horizons and likely renovation cycles for the building on this parcel.',
    'report.widget.roots.method.1':
      'GeoServer GetFeatureInfo against project_res:parcel_2025_07 returning bldg_constr_year, with cy_max / cy_avg as fallbacks.',
    'report.widget.roots.method.2':
      'Years are validated to the range 1200 – current year; impossible values are dropped.',
    'report.widget.roots.method.3':
      'Parcels with multiple buildings show the dominant construction year; recent additions may not be reflected.',
    'report.widget.roots.detail.age': 'Approximate age',

    'report.widget.soolar.blurb': 'Annual photovoltaic yield potential of the building roofs.',
    'report.widget.soolar.narrative':
      'Annual electricity yield is the sum of every suitable roof surface at the address as modelled by the federal sonnendach.ch programme (SFOE / swisstopo). It assumes a modern crystalline-silicon PV installation across all suitable surfaces.',
    'report.widget.soolar.method.1':
      'Each roof polygon is rated against orientation, tilt and shading via sonnendach.ch; suitable surfaces report a stromertrag (kWh/yr).',
    'report.widget.soolar.method.2':
      'The headline value sums stromertrag across every roof returned by the identify call around the search point.',
    'report.widget.soolar.method.3':
      'The model assumes a standard PV system; actual yield depends on inverter, soiling, snow cover and roof access.',
    'report.widget.soolar.detail.roofs': 'Suitable roof segments',
    'report.widget.soolar.detail.area': 'Total suitable area',

    'report.widget.boom.blurb': 'Day-time road-traffic noise exposure from the federal sonBASE model.',
    'report.widget.boom.narrative':
      'The dB(A) band describes the modelled daytime road-traffic noise exposure at the address, sampled from the federal sonBASE raster (FOEN / BAFU). Bands above 60 dB(A) approach the federal planning thresholds for residential zones.',
    'report.widget.boom.method.1':
      'The official sonBASE WMTS tile under the point is pixel-sampled and snapped to the legend band by nearest RGB distance.',
    'report.widget.boom.method.2':
      'A 5×5 pixel vote rejects anti-aliasing; transparent tiles indicate exposure below the 40 dB(A) mapping floor.',
    'report.widget.boom.method.3':
      'Rail and aircraft noise are modelled separately and are not included in this headline figure.',
    'report.widget.boom.detail.band': 'Sampled band',

    // About modal
    'about.menu': 'About this app',
    'about.description': 'Showroom collects and presents Aireon property exports — screenshots, reports and map captures — in a single curated gallery.',
    'about.mapData': 'Map data',
    'about.renderer': 'Rendering',
    'about.close': 'Close',

    // Common
    'common.loading': 'Loading',
  },
  fr: {
    // Navbar
    'nav.search_placeholder': 'Rechercher exports, adresses, ID parcelles…',
    'nav.select_language': 'Sélectionner la langue',
    'nav.gallery': 'Galerie',
    'nav.reporter': 'Reporter',
    'nav.sign_in': 'Se connecter',
    'nav.open_user_menu': 'Ouvrir le menu utilisateur',
    'nav.open_with': 'Ouvrir avec',

    // User menu
    'menu.my_saved_parcels': 'Mes parcelles enregistrées',
    'menu.view_profile': 'Voir le profil',
    'menu.sign_out': 'Se déconnecter',
    'menu.active_session': 'Session active',
    'menu.in_your_gallery': 'Dans votre galerie',
    'menu.user_fallback': 'Utilisateur',
    'menu.more_tools': 'Plus d’outils',
    'menu.release_notes': 'Notes de version',

    // PRM — bouton Enregistrer sur la bande parcelle
    'prm.save': 'Suivre',
    'prm.saving': 'Enregistrement…',
    'prm.saved': 'Suivie',
    'prm.open_in_proom': 'Ouvrir dans proom',
    'prm.signin_required': 'Connectez-vous pour enregistrer',
    'prm.save_failed': 'Échec — réessayez',

    // Gallery
    'gallery.heading': 'Votre galerie',
    'gallery.count_filtered': 'Affichage {visible} sur {total}',
    'gallery.count_total': '{total} exports dans la suite Aireon',
    'gallery.tip_search': 'pour rechercher',
    'gallery.tip_navigate': 'pour naviguer',
    'gallery.tip_favorite': 'pour favoris',
    'gallery.tip_close': 'pour fermer',
    'gallery.tips_label': 'Astuces :',

    // Filters
    'gallery.filter.favorites': 'Favoris',
    'gallery.filter.refresh': 'Actualiser',
    'gallery.filter.view_grouped': 'Groupé',
    'gallery.filter.view_flat': 'Liste',
    'gallery.filter.from': 'De',
    'gallery.filter.clear': 'Effacer',

    // Sort
    'gallery.sort.recent': 'Plus récents',
    'gallery.sort.oldest': 'Plus anciens',
    'gallery.sort.count': 'Plus d’exports',
    'gallery.sort.address': 'A → Z',

    // Empty / error states
    'gallery.empty.no_exports_title': 'Votre galerie vous attend',
    'gallery.empty.no_exports_body':
      'Showroom rassemble les exports enregistrés dans toute la suite Aireon. Capturez une vue ou un rapport et il apparaîtra ici automatiquement.',
    'gallery.empty.open_roofs': 'Ouvrir Roofs pour capturer',
    'gallery.empty.no_favorites_title': 'Aucun favori pour l’instant',
    'gallery.empty.no_favorites_body_prefix': 'Appuyez sur',
    'gallery.empty.no_favorites_body_suffix': 'dans la visionneuse ou cliquez sur l’étoile d’un export pour le garder sous la main.',
    'gallery.empty.show_all': 'Afficher tous les exports',
    'gallery.empty.no_matches_title': 'Aucun résultat',
    'gallery.empty.no_matches_body': 'Essayez une autre recherche, effacez vos filtres ou désactivez le filtre favoris.',
    'gallery.empty.reset_filters': 'Réinitialiser les filtres',
    'gallery.error.title': 'Impossible de charger vos exports',
    'gallery.error.fallback_load': 'Échec du chargement des exports',
    'gallery.error.fallback_delete': 'Échec de la suppression',
    'gallery.error.delete_confirm': 'Supprimer « {name} » ? Cette action est irréversible.',

    // ParcelGroup
    'gallery.group.unassigned': 'Exports non rattachés',
    'gallery.group.parcel_prefix': 'Parcelle',
    'gallery.group.exports_one': '{count} export',
    'gallery.group.exports_other': '{count} exports',
    'gallery.group.show_all': 'tout afficher',

    // ExportCard
    'card.open': 'Ouvrir {name}',
    'card.add_favorite': 'Ajouter aux favoris',
    'card.remove_favorite': 'Retirer des favoris',
    'card.favorite_tooltip': 'Favori (F)',
    'card.unfavorite_tooltip': 'Retirer favori (F)',
    'card.open_original': 'Ouvrir l’original',
    'card.open_original_aria': 'Ouvrir l’original dans un nouvel onglet',
    'card.delete': 'Supprimer',
    'card.delete_aria': 'Supprimer l’export',

    // Lightbox + metadata
    'modal.detail.close': 'Fermer (Échap)',
    'modal.detail.previous': 'Précédent (←)',
    'modal.detail.next': 'Suivant (→)',
    'modal.detail.download': 'Télécharger',
    'modal.detail.show_info': 'Afficher les infos (I)',
    'modal.detail.hide_info': 'Masquer les infos',
    'modal.detail.section_location': 'Emplacement',
    'modal.detail.section_capture': 'Capture',
    'modal.detail.section_additional': 'Métadonnées supplémentaires',
    'modal.detail.label_address': 'Adresse',
    'modal.detail.label_parcel_id': 'ID parcelle',
    'modal.detail.label_center': 'Centre',
    'modal.detail.label_saved': 'Enregistré',
    'modal.detail.label_dimensions': 'Dimensions',
    'modal.detail.label_size': 'Taille',
    'modal.detail.label_zoom': 'Zoom',
    'modal.detail.label_tilt': 'Inclinaison',
    'modal.detail.label_bearing': 'Orientation',
    'modal.detail.label_basemap': 'Fond de carte',
    'modal.detail.label_3d_mode': 'Mode 3D',
    'modal.detail.value_on': 'Activé',
    'modal.detail.value_off': 'Désactivé',

    // Saved parcels
    'parcels.try_again': 'Réessayer',

    // Reporter
    'page.reporter.kicker': 'Reporter',
    'page.reporter.intro':
      'Saisissez une adresse pour générer un rapport showroom standardisé — cinq widgets cartographiques en direct qui reconstituent les apps Aireon à cet endroit : valorisation, hauteur des bâtiments, année de construction, potentiel solaire et exposition au bruit.',
    'page.reporter.search_disabled_prefix': 'La recherche d’adresse est désactivée — la variable d’environnement',
    'page.reporter.search_disabled_suffix': 'n’est pas définie pour ce déploiement.',
    'page.reporter.search_placeholder': 'Rechercher une adresse suisse…',
    'page.reporter.search_error_fallback': 'Échec du géocodage',
    'page.reporter.selected_location': 'Emplacement sélectionné',
    'page.reporter.regenerate': 'Régénérer',
    'page.reporter.no_report': 'Aucun rapport — recherchez une adresse ci-dessus pour commencer.',
    'page.reporter.parcel_unavailable': 'Détails de la parcelle indisponibles à cet endroit.',
    'page.reporter.flats_one': 'logement',
    'page.reporter.flats_other': 'logements',

    // Widget cards
    'page.reporter.widget.status.live': 'En direct',
    'page.reporter.widget.status.loading': 'Chargement',
    'page.reporter.widget.status.no_data': 'Sans données',
    'page.reporter.widget.status.failed': 'Échec',
    'page.reporter.widget.no_data_at_location': 'Aucune donnée à cet endroit',
    'page.reporter.widget.failed_to_load': 'Échec du chargement',
    'page.reporter.widget.retry': 'Réessayer',
    'page.reporter.widget.open_at_location': 'Ouvrir {label} à cet endroit',
    'page.reporter.widget.mapbox_missing': 'Jeton Mapbox non configuré',
    'page.reporter.widget.solar_unavailable': 'Données solaires indisponibles',
    'page.reporter.widget.noise_unavailable': 'Données de bruit indisponibles',
    'page.reporter.widget.metric.market_value': 'Valeur marchande',
    'page.reporter.widget.metric.building_height': 'Hauteur du bâtiment',
    'page.reporter.widget.metric.construction_year': 'Année de construction',
    'page.reporter.widget.metric.solar_potential': 'Potentiel solaire',
    'page.reporter.widget.metric.road_noise': 'Bruit routier',

    // Reporter — sélection + générateur de rapport
    'page.reporter.widget.add_to_report': 'Ajouter au rapport',
    'page.reporter.widget.in_report': 'Dans le rapport',
    'page.reporter.widget.select_for_report': 'Ajouter {label} au rapport',
    'page.reporter.widget.deselect_for_report': 'Retirer {label} du rapport',
    'page.reporter.report.generate': 'Générer le rapport',
    'page.reporter.report.generate_tooltip': 'Générer un rapport PDF avec les {n} cartes sélectionnées',
    'page.reporter.report.select_at_least_one': 'Sélectionnez au moins une carte pour le rapport',
    'page.reporter.report.waiting_for_data': 'Attente du chargement des cartes…',

    'report.dialog.title': 'Créer un rapport immobilier',
    'report.dialog.close': 'Fermer',
    'report.dialog.download': 'Télécharger le PDF',
    'report.dialog.try_again': 'Réessayer',
    'report.dialog.included_count': '{n} cartes incluses',
    'report.dialog.ready_to_build': 'Préparation du rapport',
    'report.dialog.preamble':
      'Showroom assemble un dossier immobilier multi-pages avec les widgets sélectionnés, les faits de la parcelle, la méthodologie et un avertissement au format suisse.',
    'report.dialog.capturing': 'Capture des aperçus cartographiques',
    'report.dialog.capturing_body':
      'Chaque widget sélectionné est exporté en haute résolution afin que le PDF reflète fidèlement ce que vous voyez à l’écran.',
    'report.dialog.rendering': 'Composition du document PDF',
    'report.dialog.rendering_body':
      'Mise en page de la couverture, du résumé, de la fiche parcelle, des analyses par widget et des sources.',
    'report.dialog.ready': 'Rapport prêt',
    'report.dialog.ready_body': 'Votre PDF aux couleurs Showroom est prêt à être téléchargé.',
    'report.dialog.error': 'Impossible de construire le rapport',
    'report.dialog.error_body':
      'Une erreur est survenue lors de la création du PDF. Vous pouvez réessayer — les widgets ci-dessus restent intacts.',

    'report.pdf.tagline': 'INTELLIGENCE IMMOBILIÈRE · SUISSE',
    'report.pdf.title': 'Rapport immobilier',
    'report.pdf.subtitle': 'Showroom — dossier multi-sources par localisation',
    'report.pdf.report_id': 'Identifiant du rapport',
    'report.pdf.generated_on': 'Généré le',
    'report.pdf.generated_for': 'Généré pour',
    'report.pdf.executive_title': 'Résumé exécutif',
    'report.pdf.executive_lead':
      'Les indicateurs ci-dessous synthétisent les analyses sélectionnées pour cet emplacement. Chaque section du dossier détaille la méthode et renvoie à l’app Aireon correspondante.',
    'report.pdf.parcel_title': 'Identification de la parcelle',
    'report.pdf.parcel_lead':
      'Identifiants et dimensions issus du Registre fédéral des bâtiments et logements (RegBL / GWR) pour la parcelle aux coordonnées indiquées.',
    'report.pdf.analyses_title': 'Analyses',
    'report.pdf.methodology_title': 'Méthodologie',
    'report.pdf.sources_title': 'Sources et avertissement',
    'report.pdf.disclaimer_title': 'Avertissement',
    'report.pdf.disclaimer_body':
      'Ce rapport est une analyse automatisée et indicative produite par Aireon Showroom. Il ne constitue pas une expertise certifiée (Verkehrswertschätzung) au sens des pratiques bancaires suisses (art. 12 BankV) ni des standards RICS / SVS / SEK-SVIT. Aucune visite n’a été effectuée ; les défauts cachés, rénovations récentes ou dynamiques de micro-marché peuvent ne pas être reflétés. Les valeurs indicatives s’entendent avec une marge typique de ±10–15 %.',
    'report.pdf.disclaimer_notice':
      'Ce document ne constitue ni une recommandation d’investissement, ni une offre ferme d’achat ou de vente. Les sources sont des jeux de données fédéraux publics cités ci-dessus et restent soumises à leurs conditions d’utilisation. © Aireon.',
    'report.pdf.address': 'Adresse',
    'report.pdf.locality': 'Localité',
    'report.pdf.coordinates': 'Coordonnées (WGS84)',
    'report.pdf.egrid': 'EGRID',
    'report.pdf.zone': 'Zone',
    'report.pdf.building_size': 'Emprise au sol',
    'report.pdf.building_volume': 'Volume bâti',
    'report.pdf.flats': 'Logements',
    'report.pdf.not_available': 'Non disponible',
    'report.pdf.metric': 'Indicateur principal',
    'report.pdf.assessment': 'Évaluation',
    'report.pdf.method': 'Méthode',
    'report.pdf.source': 'Source',
    'report.pdf.live_app': 'App en direct',
    'report.pdf.no_data': 'Aucune donnée à cet endroit',
    'report.pdf.failed': 'Capture échouée',
    'report.pdf.page': 'Page',
    'report.pdf.of': 'sur',
    'report.pdf.footer_brand': 'AIREON · Showroom',

    'report.widget.valoo.blurb': 'Valeur marchande indicative issue d’un modèle hédonique au niveau de la parcelle.',
    'report.widget.valoo.narrative':
      'Le prix exprime la valeur de marché modélisée par mètre carré de surface de parcelle, ajustée à l’instantané Aireon des parcelles 2025. À utiliser comme tri rapide — fiable pour classer des parcelles voisines, indicatif pour un actif unique.',
    'report.widget.valoo.method.1':
      'Régression hédonique sur le jeu parcel_2025_07 utilisant localisation, emprise, âge et zonage.',
    'report.widget.valoo.method.2':
      'Rampe quantile à onze classes affichée sur la carte ; la parcelle sous le pin renvoie son prix au m².',
    'report.widget.valoo.method.3':
      'Aucune visite — aménagements intérieurs, rénovations récentes et primes de vue ne sont pas captés.',
    'report.widget.valoo.detail.price_m2': 'Prix modélisé par m²',

    'report.widget.roofs.blurb': 'Hauteur du bâtiment au-dessus du sol depuis le modèle 3D fédéral.',
    'report.widget.roofs.narrative':
      'Les hauteurs minimale et maximale proviennent de swissBUILDINGS3D 3.0, le modèle 3D vectoriel fédéral dérivé du LiDAR aéroporté. La valeur reflète le point de toit le plus haut au-dessus du coin de terrain le plus bas.',
    'report.widget.roofs.method.1':
      'Maillage swissBUILDINGS3D 3.0 joint à l’emprise parcel_2025_07 par superposition spatiale.',
    'report.widget.roofs.method.2':
      'La mini-carte extrude chaque parcelle par bldg_height_max pour un contexte visuel instantané.',
    'report.widget.roofs.method.3':
      'Avant-toit et faîte sont agrégés en un maximum par bâtiment ; les toits complexes peuvent masquer certains détails.',
    'report.widget.roofs.detail.max': 'Hauteur maximale',
    'report.widget.roofs.detail.min': 'Hauteur minimale',

    'report.widget.roots.blurb': 'Année de construction et âge de la parcelle, registre fédéral des bâtiments.',
    'report.widget.roots.narrative':
      'L’année de construction provient du Registre fédéral des bâtiments et logements (GWR / RegBL). Elle ancre les attentes énergétiques, les horizons d’entretien et les cycles de rénovation probables du bâtiment.',
    'report.widget.roots.method.1':
      'GetFeatureInfo GeoServer sur project_res:parcel_2025_07 renvoyant bldg_constr_year, avec cy_max / cy_avg en repli.',
    'report.widget.roots.method.2':
      'Les années sont validées entre 1200 et l’année courante ; les valeurs impossibles sont écartées.',
    'report.widget.roots.method.3':
      'Les parcelles avec plusieurs bâtiments affichent l’année dominante ; les ajouts récents peuvent ne pas apparaître.',
    'report.widget.roots.detail.age': 'Âge approximatif',

    'report.widget.soolar.blurb': 'Potentiel annuel photovoltaïque des toitures du bâtiment.',
    'report.widget.soolar.narrative':
      'La production annuelle agrège chaque toiture éligible à l’adresse, modélisée par le programme fédéral sonnendach.ch (OFEN / swisstopo). Elle suppose une installation PV cristalline moderne couvrant toutes les surfaces adaptées.',
    'report.widget.soolar.method.1':
      'Chaque polygone de toit est noté selon orientation, inclinaison et ombrage via sonnendach.ch ; les surfaces adaptées renvoient un stromertrag (kWh/an).',
    'report.widget.soolar.method.2':
      'L’indicateur somme les stromertrag de toutes les toitures retournées autour du point de recherche.',
    'report.widget.soolar.method.3':
      'Le modèle suppose une installation PV standard ; la production réelle dépend de l’onduleur, des salissures, de la neige et de l’accès au toit.',
    'report.widget.soolar.detail.roofs': 'Segments de toit adaptés',
    'report.widget.soolar.detail.area': 'Surface adaptée totale',

    'report.widget.boom.blurb': 'Exposition au bruit du trafic routier de jour, modèle fédéral sonBASE.',
    'report.widget.boom.narrative':
      'La bande dB(A) décrit l’exposition modélisée au bruit du trafic routier de jour à l’adresse, échantillonnée sur le raster fédéral sonBASE (OFEV / BAFU). Les bandes supérieures à 60 dB(A) approchent les seuils fédéraux de planification pour les zones résidentielles.',
    'report.widget.boom.method.1':
      'La tuile WMTS sonBASE sous le point est échantillonnée en pixel et alignée à la bande de la légende par distance RGB la plus proche.',
    'report.widget.boom.method.2':
      'Un vote sur 5×5 pixels rejette l’anti-aliasing ; les tuiles transparentes correspondent à une exposition sous le plancher cartographié de 40 dB(A).',
    'report.widget.boom.method.3':
      'Les bruits ferroviaire et aérien sont modélisés séparément et ne sont pas inclus dans cet indicateur principal.',
    'report.widget.boom.detail.band': 'Bande échantillonnée',

    // About modal
    'about.menu': "À propos de l'app",
    'about.description': "Showroom rassemble et présente les exports immobiliers Aireon — captures d'écran, rapports et captures de carte — dans une galerie centralisée.",
    'about.mapData': 'Données cartographiques',
    'about.renderer': 'Rendu',
    'about.close': 'Fermer',

    // Common
    'common.loading': 'Chargement',
  },
  de: {
    // Navbar
    'nav.search_placeholder': 'Exporte, Adressen, Parzellen-IDs suchen…',
    'nav.select_language': 'Sprache wählen',
    'nav.gallery': 'Galerie',
    'nav.reporter': 'Reporter',
    'nav.sign_in': 'Anmelden',
    'nav.open_user_menu': 'Benutzermenü öffnen',
    'nav.open_with': 'Öffnen mit',

    // User menu
    'menu.my_saved_parcels': 'Meine gespeicherten Parzellen',
    'menu.view_profile': 'Profil ansehen',
    'menu.sign_out': 'Abmelden',
    'menu.active_session': 'Aktive Sitzung',
    'menu.in_your_gallery': 'In deiner Galerie',
    'menu.user_fallback': 'Benutzer',
    'menu.more_tools': 'Weitere Tools',
    'menu.release_notes': 'Versionshinweise',

    // PRM — Speichern-Button auf der Parzellen-Leiste
    'prm.save': 'Verfolgen',
    'prm.saving': 'Wird gespeichert…',
    'prm.saved': 'Verfolgt',
    'prm.open_in_proom': 'In proom öffnen',
    'prm.signin_required': 'Zum Speichern anmelden',
    'prm.save_failed': 'Speichern fehlgeschlagen',

    // Gallery
    'gallery.heading': 'Deine Galerie',
    'gallery.count_filtered': '{visible} von {total}',
    'gallery.count_total': '{total} Exporte aus der Aireon-Suite',
    'gallery.tip_search': 'zum Suchen',
    'gallery.tip_navigate': 'zum Navigieren',
    'gallery.tip_favorite': 'für Favoriten',
    'gallery.tip_close': 'zum Schliessen',
    'gallery.tips_label': 'Tipps:',

    // Filters
    'gallery.filter.favorites': 'Favoriten',
    'gallery.filter.refresh': 'Aktualisieren',
    'gallery.filter.view_grouped': 'Gruppiert',
    'gallery.filter.view_flat': 'Flach',
    'gallery.filter.from': 'Aus',
    'gallery.filter.clear': 'Leeren',

    // Sort
    'gallery.sort.recent': 'Neueste zuerst',
    'gallery.sort.oldest': 'Älteste zuerst',
    'gallery.sort.count': 'Meiste Exporte',
    'gallery.sort.address': 'A → Z',

    // Empty / error
    'gallery.empty.no_exports_title': 'Deine Galerie wartet',
    'gallery.empty.no_exports_body':
      'Showroom sammelt Exporte, die du in der Aireon-Suite speicherst. Erstelle einen Screenshot oder Bericht und er erscheint hier automatisch.',
    'gallery.empty.open_roofs': 'Roofs öffnen zum Aufnehmen',
    'gallery.empty.no_favorites_title': 'Noch keine Favoriten',
    'gallery.empty.no_favorites_body_prefix': 'Drücke',
    'gallery.empty.no_favorites_body_suffix': 'in der Vorschau oder klicke den Stern an einem Export, um ihn zu merken.',
    'gallery.empty.show_all': 'Alle Exporte zeigen',
    'gallery.empty.no_matches_title': 'Keine Treffer',
    'gallery.empty.no_matches_body': 'Versuche eine andere Suche, leere die Filter oder deaktiviere den Favoriten-Filter.',
    'gallery.empty.reset_filters': 'Filter zurücksetzen',
    'gallery.error.title': 'Exporte konnten nicht geladen werden',
    'gallery.error.fallback_load': 'Laden der Exporte fehlgeschlagen',
    'gallery.error.fallback_delete': 'Löschen des Exports fehlgeschlagen',
    'gallery.error.delete_confirm': '"{name}" löschen? Das kann nicht rückgängig gemacht werden.',

    // ParcelGroup
    'gallery.group.unassigned': 'Nicht zugeordnete Exporte',
    'gallery.group.parcel_prefix': 'Parzelle',
    'gallery.group.exports_one': '{count} Export',
    'gallery.group.exports_other': '{count} Exporte',
    'gallery.group.show_all': 'alle anzeigen',

    // ExportCard
    'card.open': '{name} öffnen',
    'card.add_favorite': 'Zu Favoriten hinzufügen',
    'card.remove_favorite': 'Aus Favoriten entfernen',
    'card.favorite_tooltip': 'Favorit (F)',
    'card.unfavorite_tooltip': 'Favorit entfernen (F)',
    'card.open_original': 'Original öffnen',
    'card.open_original_aria': 'Original in neuem Tab öffnen',
    'card.delete': 'Löschen',
    'card.delete_aria': 'Export löschen',

    // Lightbox + metadata
    'modal.detail.close': 'Schliessen (Esc)',
    'modal.detail.previous': 'Vorherige (←)',
    'modal.detail.next': 'Nächste (→)',
    'modal.detail.download': 'Herunterladen',
    'modal.detail.show_info': 'Info anzeigen (I)',
    'modal.detail.hide_info': 'Info ausblenden',
    'modal.detail.section_location': 'Standort',
    'modal.detail.section_capture': 'Aufnahme',
    'modal.detail.section_additional': 'Weitere Metadaten',
    'modal.detail.label_address': 'Adresse',
    'modal.detail.label_parcel_id': 'Parzellen-ID',
    'modal.detail.label_center': 'Zentrum',
    'modal.detail.label_saved': 'Gespeichert',
    'modal.detail.label_dimensions': 'Abmessungen',
    'modal.detail.label_size': 'Grösse',
    'modal.detail.label_zoom': 'Zoom',
    'modal.detail.label_tilt': 'Neigung',
    'modal.detail.label_bearing': 'Ausrichtung',
    'modal.detail.label_basemap': 'Grundkarte',
    'modal.detail.label_3d_mode': '3D-Modus',
    'modal.detail.value_on': 'Ein',
    'modal.detail.value_off': 'Aus',

    // Saved parcels
    'parcels.try_again': 'Erneut versuchen',

    // Reporter
    'page.reporter.kicker': 'Reporter',
    'page.reporter.intro':
      'Adresse eingeben, um einen standardisierten Showroom-Bericht zu erstellen — fünf Live-Karten-Widgets, die Aireon-Apps am Standort zeigen: Bewertung, Gebäudehöhe, Baujahr, Solarpotenzial und Lärmexposition.',
    'page.reporter.search_disabled_prefix': 'Die Adresssuche ist deaktiviert — die Umgebungsvariable',
    'page.reporter.search_disabled_suffix': 'ist für diese Bereitstellung nicht gesetzt.',
    'page.reporter.search_placeholder': 'Schweizer Adresse suchen…',
    'page.reporter.search_error_fallback': 'Geokodierung fehlgeschlagen',
    'page.reporter.selected_location': 'Ausgewählter Standort',
    'page.reporter.regenerate': 'Neu erstellen',
    'page.reporter.no_report': 'Noch kein Bericht — suche oben eine Adresse, um zu beginnen.',
    'page.reporter.parcel_unavailable': 'Parzellendetails für diesen Standort nicht verfügbar.',
    'page.reporter.flats_one': 'Wohnung',
    'page.reporter.flats_other': 'Wohnungen',

    // Widget cards
    'page.reporter.widget.status.live': 'Live',
    'page.reporter.widget.status.loading': 'Lädt',
    'page.reporter.widget.status.no_data': 'Keine Daten',
    'page.reporter.widget.status.failed': 'Fehlgeschlagen',
    'page.reporter.widget.no_data_at_location': 'Keine Daten an diesem Standort',
    'page.reporter.widget.failed_to_load': 'Laden fehlgeschlagen',
    'page.reporter.widget.retry': 'Erneut',
    'page.reporter.widget.open_at_location': '{label} an diesem Standort öffnen',
    'page.reporter.widget.mapbox_missing': 'Mapbox-Token nicht konfiguriert',
    'page.reporter.widget.solar_unavailable': 'Solardaten nicht verfügbar',
    'page.reporter.widget.noise_unavailable': 'Lärmdaten nicht verfügbar',
    'page.reporter.widget.metric.market_value': 'Marktwert',
    'page.reporter.widget.metric.building_height': 'Gebäudehöhe',
    'page.reporter.widget.metric.construction_year': 'Baujahr',
    'page.reporter.widget.metric.solar_potential': 'Solarpotenzial',
    'page.reporter.widget.metric.road_noise': 'Strassenlärm',

    // Reporter — Auswahl + Berichtgenerator
    'page.reporter.widget.add_to_report': 'In Bericht aufnehmen',
    'page.reporter.widget.in_report': 'Im Bericht',
    'page.reporter.widget.select_for_report': '{label} zum Bericht hinzufügen',
    'page.reporter.widget.deselect_for_report': '{label} aus dem Bericht entfernen',
    'page.reporter.report.generate': 'Bericht erstellen',
    'page.reporter.report.generate_tooltip': 'PDF-Bericht mit den {n} ausgewählten Karten erstellen',
    'page.reporter.report.select_at_least_one': 'Wähle mindestens eine Karte für den Bericht',
    'page.reporter.report.waiting_for_data': 'Warten auf das Laden der Karten…',

    'report.dialog.title': 'Liegenschaftsbericht erstellen',
    'report.dialog.close': 'Schliessen',
    'report.dialog.download': 'PDF herunterladen',
    'report.dialog.try_again': 'Erneut versuchen',
    'report.dialog.included_count': '{n} Karten enthalten',
    'report.dialog.ready_to_build': 'Bericht wird vorbereitet',
    'report.dialog.preamble':
      'Showroom stellt ein mehrseitiges Liegenschaftsdossier mit den ausgewählten Widgets, Parzellenfakten, Methodik und einem Schweizer Disclaimer zusammen.',
    'report.dialog.capturing': 'Kartenaufnahmen werden erstellt',
    'report.dialog.capturing_body':
      'Jedes ausgewählte Widget wird in hoher Auflösung exportiert, damit das PDF genau zeigt, was auf dem Bildschirm sichtbar ist.',
    'report.dialog.rendering': 'PDF wird komponiert',
    'report.dialog.rendering_body':
      'Deckblatt, Zusammenfassung, Parzellenblatt, Analysen pro Widget und Quellen werden gesetzt.',
    'report.dialog.ready': 'Bericht bereit',
    'report.dialog.ready_body': 'Dein mehrseitiges, gebrandetes PDF steht zum Download bereit.',
    'report.dialog.error': 'Bericht konnte nicht erstellt werden',
    'report.dialog.error_body':
      'Beim Erstellen des PDFs ist etwas schiefgelaufen. Du kannst es erneut versuchen — die Widgets oben sind nicht betroffen.',

    'report.pdf.tagline': 'IMMOBILIEN-INTELLIGENZ · SCHWEIZ',
    'report.pdf.title': 'Liegenschaftsbericht',
    'report.pdf.subtitle': 'Showroom — standortbezogenes Multisource-Dossier',
    'report.pdf.report_id': 'Berichts-ID',
    'report.pdf.generated_on': 'Erstellt am',
    'report.pdf.generated_for': 'Erstellt für',
    'report.pdf.executive_title': 'Zusammenfassung',
    'report.pdf.executive_lead':
      'Die nachstehenden Kennzahlen fassen die ausgewählten Analysen für diesen Standort zusammen. Jeder Abschnitt erläutert die Methode und verlinkt auf die zugrunde liegende Aireon-App.',
    'report.pdf.parcel_title': 'Parzellen-Identifikation',
    'report.pdf.parcel_lead':
      'Identifikatoren und Masse aus dem Eidgenössischen Gebäude- und Wohnungsregister (GWR / RegBL) für die Parzelle an den gesuchten Koordinaten.',
    'report.pdf.analyses_title': 'Analysen',
    'report.pdf.methodology_title': 'Methodik',
    'report.pdf.sources_title': 'Quellen und Disclaimer',
    'report.pdf.disclaimer_title': 'Disclaimer',
    'report.pdf.disclaimer_body':
      'Dieser Bericht ist eine automatisierte, indikative Analyse von Aireon Showroom. Er ist keine zertifizierte Verkehrswertschätzung im Sinne der Schweizer Bankenpraxis (Art. 12 BankV) und kein Gutachten nach RICS / SVS / SEK-SVIT. Es fand keine Besichtigung statt; versteckte Mängel, jüngere Renovationen oder Mikromarkt-Dynamik sind möglicherweise nicht berücksichtigt. Indikative Werte sind mit einer typischen Bandbreite von ±10–15 % zu lesen.',
    'report.pdf.disclaimer_notice':
      'Dieses Dokument ist weder eine Anlageempfehlung noch ein verbindliches Kauf- oder Verkaufsangebot. Die Datenquellen sind oben genannte öffentliche eidgenössische Datensätze und unterliegen deren Nutzungsbedingungen. © Aireon.',
    'report.pdf.address': 'Adresse',
    'report.pdf.locality': 'Ortschaft',
    'report.pdf.coordinates': 'Koordinaten (WGS84)',
    'report.pdf.egrid': 'EGRID',
    'report.pdf.zone': 'Zone',
    'report.pdf.building_size': 'Gebäudegrundfläche',
    'report.pdf.building_volume': 'Gebäudevolumen',
    'report.pdf.flats': 'Wohnungen',
    'report.pdf.not_available': 'Nicht verfügbar',
    'report.pdf.metric': 'Leitkennzahl',
    'report.pdf.assessment': 'Einschätzung',
    'report.pdf.method': 'Methode',
    'report.pdf.source': 'Quelle',
    'report.pdf.live_app': 'Live-App',
    'report.pdf.no_data': 'Keine Daten an diesem Standort',
    'report.pdf.failed': 'Aufnahme fehlgeschlagen',
    'report.pdf.page': 'Seite',
    'report.pdf.of': 'von',
    'report.pdf.footer_brand': 'AIREON · Showroom',

    'report.widget.valoo.blurb': 'Indikativer Marktwert aus hedonischer Modellierung auf Parzellenebene.',
    'report.widget.valoo.narrative':
      'Der Preis drückt den modellierten Marktwert pro Quadratmeter Parzellenfläche aus, abgestimmt auf den Aireon-Parzellenstand 2025. Schnelle Vortriage — solide für den Vergleich benachbarter Parzellen, indikativ für ein einzelnes Objekt.',
    'report.widget.valoo.method.1':
      'Hedonische Regression auf dem Datensatz parcel_2025_07 mit Lage, Grundfläche, Alter und Zonierung.',
    'report.widget.valoo.method.2':
      'Elfklassige Quantilskala auf der Live-Karte; die Parzelle unter dem Pin wird auf ihren CHF/m² abgefragt.',
    'report.widget.valoo.method.3':
      'Keine Begehung — Innenausbau, jüngere Renovationen und Aussichtsprämien sind nicht erfasst.',
    'report.widget.valoo.detail.price_m2': 'Modellierter Preis pro m²',

    'report.widget.roofs.blurb': 'Gebäudehöhe ab Boden aus dem eidgenössischen 3D-Gebäudemodell.',
    'report.widget.roofs.narrative':
      'Minimal- und Maximalhöhe stammen aus swissBUILDINGS3D 3.0, dem vom Bund aus LiDAR abgeleiteten 3D-Vektormodell. Der Wert entspricht dem höchsten Dachpunkt über der niedrigsten Geländekante.',
    'report.widget.roofs.method.1':
      'swissBUILDINGS3D 3.0-Netz mit der Grundfläche aus parcel_2025_07 räumlich verknüpft.',
    'report.widget.roofs.method.2':
      'Die Mini-Karte extrudiert jede Parzelle mit ihrem bldg_height_max für sofortigen visuellen Kontext.',
    'report.widget.roofs.method.3':
      'Traufen und Firste werden zu einem Gebäudemaximum aggregiert; komplexe Dächer können Strukturen verbergen.',
    'report.widget.roofs.detail.max': 'Maximalhöhe',
    'report.widget.roofs.detail.min': 'Minimalhöhe',

    'report.widget.roots.blurb': 'Baujahr und Parzellenalter aus dem eidgenössischen Gebäuderegister.',
    'report.widget.roots.narrative':
      'Das Baujahr stammt aus dem Eidgenössischen Gebäude- und Wohnungsregister (GWR / RegBL). Es verankert Energieerwartungen, Unterhaltshorizonte und wahrscheinliche Renovationszyklen.',
    'report.widget.roots.method.1':
      'GeoServer GetFeatureInfo gegen project_res:parcel_2025_07 mit bldg_constr_year sowie cy_max / cy_avg als Fallback.',
    'report.widget.roots.method.2':
      'Jahre werden auf den Bereich 1200 bis aktuelles Jahr validiert; unmögliche Werte werden verworfen.',
    'report.widget.roots.method.3':
      'Parzellen mit mehreren Gebäuden zeigen das dominante Baujahr; jüngere Anbauten sind ggf. nicht abgebildet.',
    'report.widget.roots.detail.age': 'Ungefähres Alter',

    'report.widget.soolar.blurb': 'Jährliches PV-Ertragspotenzial der Gebäudedächer.',
    'report.widget.soolar.narrative':
      'Der Jahresertrag summiert alle geeigneten Dachflächen der Adresse gemäss eidgenössischem Programm sonnendach.ch (BFE / swisstopo). Er unterstellt eine moderne kristalline PV-Anlage auf allen geeigneten Flächen.',
    'report.widget.soolar.method.1':
      'Jedes Dachpolygon wird via sonnendach.ch nach Ausrichtung, Neigung und Verschattung bewertet; geeignete Flächen melden einen stromertrag (kWh/Jahr).',
    'report.widget.soolar.method.2':
      'Die Leitkennzahl summiert stromertrag aller Dächer, die der Identify-Aufruf um den Suchpunkt zurückgibt.',
    'report.widget.soolar.method.3':
      'Das Modell unterstellt eine Standard-PV-Anlage; reale Erträge hängen von Wechselrichter, Verschmutzung, Schnee und Dachzugang ab.',
    'report.widget.soolar.detail.roofs': 'Geeignete Dachsegmente',
    'report.widget.soolar.detail.area': 'Gesamte geeignete Fläche',

    'report.widget.boom.blurb': 'Tagsüber-Strassenlärmexposition aus dem eidgenössischen sonBASE-Modell.',
    'report.widget.boom.narrative':
      'Das dB(A)-Band beschreibt die modellierte Strassenlärmexposition tagsüber an der Adresse, abgetastet aus dem eidgenössischen sonBASE-Raster (BAFU / FOEN). Bänder über 60 dB(A) nähern sich den eidgenössischen Planungswerten für Wohnzonen.',
    'report.widget.boom.method.1':
      'Die offizielle sonBASE-WMTS-Kachel unter dem Punkt wird pixelweise abgetastet und über die nächste RGB-Distanz dem Legendenband zugeordnet.',
    'report.widget.boom.method.2':
      'Eine 5×5-Pixel-Abstimmung unterdrückt Anti-Aliasing; transparente Kacheln entsprechen Expositionen unterhalb der 40-dB(A)-Modellgrenze.',
    'report.widget.boom.method.3':
      'Bahn- und Fluglärm sind separat modelliert und in dieser Leitkennzahl nicht enthalten.',
    'report.widget.boom.detail.band': 'Abgetastetes Band',

    // About modal
    'about.menu': 'Über diese App',
    'about.description': 'Showroom sammelt und präsentiert Aireon-Immobilien-Exporte — Screenshots, Berichte und Kartenaufnahmen — in einer einzigen kuratierten Galerie.',
    'about.mapData': 'Kartendaten',
    'about.renderer': 'Darstellung',
    'about.close': 'Schliessen',

    // Common
    'common.loading': 'Lädt',
  },
  it: {
    // Navbar
    'nav.search_placeholder': 'Cerca export, indirizzi, ID parcelle…',
    'nav.select_language': 'Seleziona lingua',
    'nav.gallery': 'Galleria',
    'nav.reporter': 'Reporter',
    'nav.sign_in': 'Accedi',
    'nav.open_user_menu': 'Apri menu utente',
    'nav.open_with': 'Apri con',

    // User menu
    'menu.my_saved_parcels': 'Le mie parcelle salvate',
    'menu.view_profile': 'Vedi profilo',
    'menu.sign_out': 'Esci',
    'menu.active_session': 'Sessione attiva',
    'menu.in_your_gallery': 'Nella tua galleria',
    'menu.user_fallback': 'Utente',
    'menu.more_tools': 'Altri strumenti',
    'menu.release_notes': 'Note di versione',

    // PRM — pulsante Salva sulla barra parcella
    'prm.save': 'Segui',
    'prm.saving': 'Salvataggio…',
    'prm.saved': 'Seguita',
    'prm.open_in_proom': 'Apri in proom',
    'prm.signin_required': 'Accedi per salvare',
    'prm.save_failed': 'Salvataggio fallito',

    // Gallery
    'gallery.heading': 'La tua galleria',
    'gallery.count_filtered': '{visible} di {total}',
    'gallery.count_total': '{total} export nella suite Aireon',
    'gallery.tip_search': 'per cercare',
    'gallery.tip_navigate': 'per navigare',
    'gallery.tip_favorite': 'per i preferiti',
    'gallery.tip_close': 'per chiudere',
    'gallery.tips_label': 'Suggerimenti:',

    // Filters
    'gallery.filter.favorites': 'Preferiti',
    'gallery.filter.refresh': 'Aggiorna',
    'gallery.filter.view_grouped': 'Raggruppato',
    'gallery.filter.view_flat': 'Elenco',
    'gallery.filter.from': 'Da',
    'gallery.filter.clear': 'Cancella',

    // Sort
    'gallery.sort.recent': 'Più recenti',
    'gallery.sort.oldest': 'Più vecchi',
    'gallery.sort.count': 'Più export',
    'gallery.sort.address': 'A → Z',

    // Empty / error
    'gallery.empty.no_exports_title': 'La tua galleria ti aspetta',
    'gallery.empty.no_exports_body':
      'Showroom raccoglie gli export che salvi nella suite Aireon. Cattura una schermata o un report e apparirà qui automaticamente.',
    'gallery.empty.open_roofs': 'Apri Roofs per catturare',
    'gallery.empty.no_favorites_title': 'Ancora nessun preferito',
    'gallery.empty.no_favorites_body_prefix': 'Premi',
    'gallery.empty.no_favorites_body_suffix': 'nella visualizzazione o clicca la stella su un export per tenerlo a portata.',
    'gallery.empty.show_all': 'Mostra tutti gli export',
    'gallery.empty.no_matches_title': 'Nessun risultato',
    'gallery.empty.no_matches_body': 'Prova un’altra ricerca, cancella i filtri o rimuovi il filtro preferiti.',
    'gallery.empty.reset_filters': 'Reimposta filtri',
    'gallery.error.title': 'Impossibile caricare i tuoi export',
    'gallery.error.fallback_load': 'Caricamento export non riuscito',
    'gallery.error.fallback_delete': 'Eliminazione export non riuscita',
    'gallery.error.delete_confirm': 'Eliminare «{name}»? L’operazione non è reversibile.',

    // ParcelGroup
    'gallery.group.unassigned': 'Export non assegnati',
    'gallery.group.parcel_prefix': 'Parcella',
    'gallery.group.exports_one': '{count} export',
    'gallery.group.exports_other': '{count} export',
    'gallery.group.show_all': 'mostra tutti',

    // ExportCard
    'card.open': 'Apri {name}',
    'card.add_favorite': 'Aggiungi ai preferiti',
    'card.remove_favorite': 'Rimuovi dai preferiti',
    'card.favorite_tooltip': 'Preferito (F)',
    'card.unfavorite_tooltip': 'Rimuovi preferito (F)',
    'card.open_original': 'Apri originale',
    'card.open_original_aria': 'Apri originale in nuova scheda',
    'card.delete': 'Elimina',
    'card.delete_aria': 'Elimina export',

    // Lightbox + metadata
    'modal.detail.close': 'Chiudi (Esc)',
    'modal.detail.previous': 'Precedente (←)',
    'modal.detail.next': 'Successivo (→)',
    'modal.detail.download': 'Scarica',
    'modal.detail.show_info': 'Mostra info (I)',
    'modal.detail.hide_info': 'Nascondi info',
    'modal.detail.section_location': 'Posizione',
    'modal.detail.section_capture': 'Cattura',
    'modal.detail.section_additional': 'Metadati aggiuntivi',
    'modal.detail.label_address': 'Indirizzo',
    'modal.detail.label_parcel_id': 'ID parcella',
    'modal.detail.label_center': 'Centro',
    'modal.detail.label_saved': 'Salvato',
    'modal.detail.label_dimensions': 'Dimensioni',
    'modal.detail.label_size': 'Dimensione',
    'modal.detail.label_zoom': 'Zoom',
    'modal.detail.label_tilt': 'Inclinazione',
    'modal.detail.label_bearing': 'Orientamento',
    'modal.detail.label_basemap': 'Mappa di base',
    'modal.detail.label_3d_mode': 'Modalità 3D',
    'modal.detail.value_on': 'Attiva',
    'modal.detail.value_off': 'Disattiva',

    // Saved parcels
    'parcels.try_again': 'Riprova',

    // Reporter
    'page.reporter.kicker': 'Reporter',
    'page.reporter.intro':
      'Inserisci un indirizzo per generare un report showroom standardizzato — cinque widget cartografici in tempo reale che ricreano le app Aireon in quel punto: valutazione, altezza edifici, anno di costruzione, potenziale solare ed esposizione al rumore.',
    'page.reporter.search_disabled_prefix': 'La ricerca indirizzi è disabilitata — la variabile d’ambiente',
    'page.reporter.search_disabled_suffix': 'non è impostata per questo deployment.',
    'page.reporter.search_placeholder': 'Cerca un indirizzo svizzero…',
    'page.reporter.search_error_fallback': 'Geocodifica non riuscita',
    'page.reporter.selected_location': 'Posizione selezionata',
    'page.reporter.regenerate': 'Rigenera',
    'page.reporter.no_report': 'Nessun report — cerca un indirizzo sopra per iniziare.',
    'page.reporter.parcel_unavailable': 'Dettagli parcella non disponibili per questa posizione.',
    'page.reporter.flats_one': 'appartamento',
    'page.reporter.flats_other': 'appartamenti',

    // Widget cards
    'page.reporter.widget.status.live': 'Live',
    'page.reporter.widget.status.loading': 'Caricamento',
    'page.reporter.widget.status.no_data': 'Nessun dato',
    'page.reporter.widget.status.failed': 'Non riuscito',
    'page.reporter.widget.no_data_at_location': 'Nessun dato in questa posizione',
    'page.reporter.widget.failed_to_load': 'Caricamento non riuscito',
    'page.reporter.widget.retry': 'Riprova',
    'page.reporter.widget.open_at_location': 'Apri {label} in questa posizione',
    'page.reporter.widget.mapbox_missing': 'Token Mapbox non configurato',
    'page.reporter.widget.solar_unavailable': 'Dati solari non disponibili',
    'page.reporter.widget.noise_unavailable': 'Dati di rumore non disponibili',
    'page.reporter.widget.metric.market_value': 'Valore di mercato',
    'page.reporter.widget.metric.building_height': 'Altezza edificio',
    'page.reporter.widget.metric.construction_year': 'Anno di costruzione',
    'page.reporter.widget.metric.solar_potential': 'Potenziale solare',
    'page.reporter.widget.metric.road_noise': 'Rumore stradale',

    // Reporter — selezione + generatore di report
    'page.reporter.widget.add_to_report': 'Aggiungi al report',
    'page.reporter.widget.in_report': 'Nel report',
    'page.reporter.widget.select_for_report': 'Aggiungi {label} al report',
    'page.reporter.widget.deselect_for_report': 'Rimuovi {label} dal report',
    'page.reporter.report.generate': 'Genera report',
    'page.reporter.report.generate_tooltip': 'Genera un report PDF con le {n} schede selezionate',
    'page.reporter.report.select_at_least_one': 'Seleziona almeno una scheda per il report',
    'page.reporter.report.waiting_for_data': 'Attesa del caricamento delle schede…',

    'report.dialog.title': 'Crea report immobiliare',
    'report.dialog.close': 'Chiudi',
    'report.dialog.download': 'Scarica PDF',
    'report.dialog.try_again': 'Riprova',
    'report.dialog.included_count': '{n} schede incluse',
    'report.dialog.ready_to_build': 'Preparazione del report',
    'report.dialog.preamble':
      'Showroom assembla un dossier immobiliare a più pagine con i widget selezionati, i dati della parcella, la metodologia e un disclaimer in formato svizzero.',
    'report.dialog.capturing': 'Cattura degli snapshot cartografici',
    'report.dialog.capturing_body':
      'Ogni widget selezionato viene esportato ad alta risoluzione perché il PDF rispecchi ciò che vedi sullo schermo.',
    'report.dialog.rendering': 'Composizione del documento PDF',
    'report.dialog.rendering_body':
      'Impaginazione di copertina, sintesi, scheda parcella, analisi per widget e fonti.',
    'report.dialog.ready': 'Report pronto',
    'report.dialog.ready_body': 'Il tuo PDF a più pagine con branding Showroom è pronto per il download.',
    'report.dialog.error': 'Impossibile creare il report',
    'report.dialog.error_body':
      'Si è verificato un problema durante la creazione del PDF. Puoi riprovare — i widget qui sopra non sono interessati.',

    'report.pdf.tagline': 'INTELLIGENCE IMMOBILIARE · SVIZZERA',
    'report.pdf.title': 'Report immobiliare',
    'report.pdf.subtitle': 'Showroom — dossier multi-fonte per localizzazione',
    'report.pdf.report_id': 'ID report',
    'report.pdf.generated_on': 'Generato il',
    'report.pdf.generated_for': 'Generato per',
    'report.pdf.executive_title': 'Sintesi',
    'report.pdf.executive_lead':
      'Gli indicatori seguenti riassumono le analisi selezionate per questa posizione. Ogni sezione del dossier illustra il metodo e rimanda all’app Aireon corrispondente.',
    'report.pdf.parcel_title': 'Identificazione della parcella',
    'report.pdf.parcel_lead':
      'Identificatori e dimensioni dal Registro federale degli edifici e delle abitazioni (RegBL / GWR) per la parcella alle coordinate ricercate.',
    'report.pdf.analyses_title': 'Analisi',
    'report.pdf.methodology_title': 'Metodologia',
    'report.pdf.sources_title': 'Fonti e disclaimer',
    'report.pdf.disclaimer_title': 'Disclaimer',
    'report.pdf.disclaimer_body':
      'Il presente report è un’analisi automatizzata e indicativa prodotta da Aireon Showroom. Non costituisce una perizia di valore certificata (Verkehrswertschätzung) ai sensi della prassi bancaria svizzera (art. 12 BankV) né uno standard RICS / SVS / SEK-SVIT. Non è stata effettuata alcuna ispezione; difetti nascosti, ristrutturazioni recenti o dinamiche micro-mercato possono non essere riflessi. I valori indicativi si intendono con una banda tipica di ±10–15 %.',
    'report.pdf.disclaimer_notice':
      'Questo documento non è una raccomandazione di investimento né un’offerta vincolante di acquisto o vendita. Le fonti dati sono dataset federali pubblici citati sopra e restano soggette ai rispettivi termini di utilizzo. © Aireon.',
    'report.pdf.address': 'Indirizzo',
    'report.pdf.locality': 'Località',
    'report.pdf.coordinates': 'Coordinate (WGS84)',
    'report.pdf.egrid': 'EGRID',
    'report.pdf.zone': 'Zona',
    'report.pdf.building_size': 'Superficie edificata',
    'report.pdf.building_volume': 'Volume edificato',
    'report.pdf.flats': 'Abitazioni',
    'report.pdf.not_available': 'Non disponibile',
    'report.pdf.metric': 'Indicatore principale',
    'report.pdf.assessment': 'Valutazione',
    'report.pdf.method': 'Metodo',
    'report.pdf.source': 'Fonte',
    'report.pdf.live_app': 'App live',
    'report.pdf.no_data': 'Nessun dato in questa posizione',
    'report.pdf.failed': 'Cattura non riuscita',
    'report.pdf.page': 'Pagina',
    'report.pdf.of': 'di',
    'report.pdf.footer_brand': 'AIREON · Showroom',

    'report.widget.valoo.blurb': 'Valore di mercato indicativo da modello edonico a livello di parcella.',
    'report.widget.valoo.narrative':
      'Il prezzo esprime il valore di mercato modellato per metro quadrato di superficie della parcella, calibrato sullo snapshot parcellare Aireon 2025. Da usare come triage rapido — solido per ordinare parcelle vicine, indicativo per un singolo asset.',
    'report.widget.valoo.method.1':
      'Regressione edonica sul dataset parcel_2025_07 con segnali di posizione, superficie, età e zonizzazione.',
    'report.widget.valoo.method.2':
      'Rampa per quantili a undici classi visibile sulla mappa; la parcella sotto il pin restituisce il suo prezzo al m².',
    'report.widget.valoo.method.3':
      'Nessuna ispezione — finiture interne, ristrutturazioni recenti e premi vista non sono catturati.',
    'report.widget.valoo.detail.price_m2': 'Prezzo modellato al m²',

    'report.widget.roofs.blurb': 'Altezza dell’edificio dal modello 3D federale degli edifici.',
    'report.widget.roofs.narrative':
      'Altezze minima e massima derivano da swissBUILDINGS3D 3.0, il modello vettoriale 3D federale ricavato dal LiDAR aereo. Il valore riflette il punto più alto del tetto sopra l’angolo di terreno più basso.',
    'report.widget.roofs.method.1':
      'Mesh swissBUILDINGS3D 3.0 incrociata con la superficie di parcel_2025_07 per sovrapposizione spaziale.',
    'report.widget.roofs.method.2':
      'La mini-mappa estrude ogni parcella in base al bldg_height_max per un contesto visivo immediato.',
    'report.widget.roofs.method.3':
      'Gronde e colmi sono aggregati a un massimo per edificio; tetti complessi possono mascherare dettagli.',
    'report.widget.roofs.detail.max': 'Altezza massima',
    'report.widget.roofs.detail.min': 'Altezza minima',

    'report.widget.roots.blurb': 'Anno di costruzione e età della parcella dal registro federale.',
    'report.widget.roots.narrative':
      'L’anno di costruzione proviene dal Registro federale degli edifici e delle abitazioni (GWR / RegBL). Ancora le aspettative energetiche, gli orizzonti di manutenzione e i probabili cicli di ristrutturazione.',
    'report.widget.roots.method.1':
      'GeoServer GetFeatureInfo su project_res:parcel_2025_07 con bldg_constr_year e cy_max / cy_avg come fallback.',
    'report.widget.roots.method.2':
      'Gli anni sono validati nell’intervallo 1200–anno corrente; valori impossibili vengono scartati.',
    'report.widget.roots.method.3':
      'Parcelle con più edifici mostrano l’anno dominante; aggiunte recenti possono non essere riflesse.',
    'report.widget.roots.detail.age': 'Età approssimativa',

    'report.widget.soolar.blurb': 'Potenziale fotovoltaico annuo dei tetti dell’edificio.',
    'report.widget.soolar.narrative':
      'L’energia annua somma ogni superficie di tetto idonea dell’indirizzo, modellata dal programma federale sonnendach.ch (UFE / swisstopo). Si presume un impianto FV cristallino moderno su tutte le superfici idonee.',
    'report.widget.soolar.method.1':
      'Ogni poligono di tetto viene valutato per orientamento, inclinazione e ombreggiamento via sonnendach.ch; le superfici idonee riportano uno stromertrag (kWh/anno).',
    'report.widget.soolar.method.2':
      'L’indicatore somma gli stromertrag di tutti i tetti restituiti dall’identify intorno al punto di ricerca.',
    'report.widget.soolar.method.3':
      'Il modello presume un impianto FV standard; la resa reale dipende da inverter, sporcizia, neve e accesso al tetto.',
    'report.widget.soolar.detail.roofs': 'Segmenti di tetto idonei',
    'report.widget.soolar.detail.area': 'Superficie idonea totale',

    'report.widget.boom.blurb': 'Esposizione al rumore stradale diurno dal modello federale sonBASE.',
    'report.widget.boom.narrative':
      'La banda dB(A) descrive l’esposizione modellata al rumore del traffico stradale diurno all’indirizzo, campionata dal raster federale sonBASE (UFAM / BAFU). Bande superiori a 60 dB(A) si avvicinano alle soglie federali di pianificazione per le zone residenziali.',
    'report.widget.boom.method.1':
      'La tile WMTS sonBASE sotto il punto viene campionata pixel per pixel e allineata alla banda della legenda per distanza RGB più vicina.',
    'report.widget.boom.method.2':
      'Un voto su 5×5 pixel respinge l’anti-aliasing; le tile trasparenti corrispondono a esposizione sotto la soglia di mappatura di 40 dB(A).',
    'report.widget.boom.method.3':
      'I rumori ferroviario e aereo sono modellati separatamente e non sono inclusi in questo indicatore principale.',
    'report.widget.boom.detail.band': 'Banda campionata',

    // About modal
    'about.menu': "Informazioni sull'app",
    'about.description': "Showroom raccoglie e presenta gli export immobiliari Aireon — screenshot, report e acquisizioni di mappa — in un'unica galleria curata.",
    'about.mapData': 'Dati cartografici',
    'about.renderer': 'Rendering',
    'about.close': 'Chiudi',

    // Common
    'common.loading': 'Caricamento',
  },
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const SUPPORTED_LOCALES: Locale[] = ['en', 'fr', 'de', 'it'];
const STORAGE_KEY = 'showroom:locale';

function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;
  } catch {
    // localStorage may be disabled — fall through to browser/default.
  }
  const browserLang = navigator.language.slice(0, 2).toLowerCase() as Locale;
  return SUPPORTED_LOCALES.includes(browserLang) ? browserLang : 'en';
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name) =>
    vars[name] !== undefined ? String(vars[name]) : `{${name}}`,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore — locale is best-effort persisted.
    }
  }, [locale]);

  const setLocale = (next: Locale) => {
    if (SUPPORTED_LOCALES.includes(next)) setLocaleState(next);
  };

  const t = (key: string, vars?: Record<string, string | number>): string => {
    const raw = translations[locale]?.[key] ?? translations.en[key] ?? key;
    return interpolate(raw, vars);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}
