import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Locale } from '@swissnovo/shared';

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

    // User menu
    'menu.saved_parcels': 'Saved parcels',
    'menu.view_profile': 'View profile',
    'menu.sign_out': 'Sign out',
    'menu.active_session': 'Active session',
    'menu.in_your_gallery': 'In your gallery',
    'menu.user_fallback': 'User',

    // Gallery — heading, counts, footer tips
    'gallery.heading': 'Your gallery',
    'gallery.count_filtered': '{visible} of {total} exports shown',
    'gallery.count_total': '{total} exports across the Swissnovo toolbox',
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
      'Showroom collects exports you save from across the Swissnovo toolbox. Capture a screenshot or report and it will appear here automatically.',
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
    'parcels.title': 'Saved parcels',
    'parcels.search_placeholder': 'Search parcels…',
    'parcels.state_all': 'All states',
    'parcels.priority_all': 'All priorities',
    'parcels.state_new': 'New',
    'parcels.state_due_diligence': 'Due Diligence',
    'parcels.state_contacted': 'Contacted',
    'parcels.state_closed': 'Closed',
    'parcels.priority_low': 'Low',
    'parcels.priority_medium': 'Medium',
    'parcels.priority_high': 'High',
    'parcels.priority_urgent': 'Urgent',
    'parcels.refresh': 'Refresh',
    'parcels.close': 'Close',
    'parcels.try_again': 'Try again',
    'parcels.failed_load': 'Failed to load parcels',
    'parcels.empty_title': 'No saved parcels yet',
    'parcels.empty_body': 'Save parcels in Roofs to track them across the toolbox.',
    'parcels.open_roofs': 'Open Roofs',
    'parcels.no_matches': 'No matches',
    'parcels.no_matches_body': 'Try a different search or clear filters.',
    'parcels.manage_in_roofs': 'Manage parcels in Roofs',
    'parcels.no_address': 'No address',

    // Reporter page
    'page.reporter.kicker': 'Reporter',
    'page.reporter.intro':
      'Enter an address to generate a standardized showroom report — live map widgets recreating five SwissNovo apps at that location: valuation, building height, construction year, solar potential and noise exposure.',
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

    // User menu
    'menu.saved_parcels': 'Parcelles enregistrées',
    'menu.view_profile': 'Voir le profil',
    'menu.sign_out': 'Se déconnecter',
    'menu.active_session': 'Session active',
    'menu.in_your_gallery': 'Dans votre galerie',
    'menu.user_fallback': 'Utilisateur',

    // Gallery
    'gallery.heading': 'Votre galerie',
    'gallery.count_filtered': 'Affichage {visible} sur {total}',
    'gallery.count_total': '{total} exports dans la suite Swissnovo',
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
      'Showroom rassemble les exports enregistrés dans toute la suite Swissnovo. Capturez une vue ou un rapport et il apparaîtra ici automatiquement.',
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
    'parcels.title': 'Parcelles enregistrées',
    'parcels.search_placeholder': 'Rechercher des parcelles…',
    'parcels.state_all': 'Tous les états',
    'parcels.priority_all': 'Toutes priorités',
    'parcels.state_new': 'Nouvelle',
    'parcels.state_due_diligence': 'Due diligence',
    'parcels.state_contacted': 'Contactée',
    'parcels.state_closed': 'Fermée',
    'parcels.priority_low': 'Faible',
    'parcels.priority_medium': 'Moyenne',
    'parcels.priority_high': 'Haute',
    'parcels.priority_urgent': 'Urgente',
    'parcels.refresh': 'Actualiser',
    'parcels.close': 'Fermer',
    'parcels.try_again': 'Réessayer',
    'parcels.failed_load': 'Échec du chargement des parcelles',
    'parcels.empty_title': 'Aucune parcelle enregistrée',
    'parcels.empty_body': 'Enregistrez des parcelles dans Roofs pour les suivre dans toute la suite.',
    'parcels.open_roofs': 'Ouvrir Roofs',
    'parcels.no_matches': 'Aucun résultat',
    'parcels.no_matches_body': 'Essayez une autre recherche ou effacez les filtres.',
    'parcels.manage_in_roofs': 'Gérer les parcelles dans Roofs',
    'parcels.no_address': 'Sans adresse',

    // Reporter
    'page.reporter.kicker': 'Reporter',
    'page.reporter.intro':
      'Saisissez une adresse pour générer un rapport showroom standardisé — cinq widgets cartographiques en direct qui reconstituent les apps SwissNovo à cet endroit : valorisation, hauteur des bâtiments, année de construction, potentiel solaire et exposition au bruit.',
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

    // User menu
    'menu.saved_parcels': 'Gespeicherte Parzellen',
    'menu.view_profile': 'Profil ansehen',
    'menu.sign_out': 'Abmelden',
    'menu.active_session': 'Aktive Sitzung',
    'menu.in_your_gallery': 'In deiner Galerie',
    'menu.user_fallback': 'Benutzer',

    // Gallery
    'gallery.heading': 'Deine Galerie',
    'gallery.count_filtered': '{visible} von {total}',
    'gallery.count_total': '{total} Exporte aus der Swissnovo-Suite',
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
      'Showroom sammelt Exporte, die du in der Swissnovo-Suite speicherst. Erstelle einen Screenshot oder Bericht und er erscheint hier automatisch.',
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
    'parcels.title': 'Gespeicherte Parzellen',
    'parcels.search_placeholder': 'Parzellen suchen…',
    'parcels.state_all': 'Alle Status',
    'parcels.priority_all': 'Alle Prioritäten',
    'parcels.state_new': 'Neu',
    'parcels.state_due_diligence': 'Due Diligence',
    'parcels.state_contacted': 'Kontaktiert',
    'parcels.state_closed': 'Geschlossen',
    'parcels.priority_low': 'Niedrig',
    'parcels.priority_medium': 'Mittel',
    'parcels.priority_high': 'Hoch',
    'parcels.priority_urgent': 'Dringend',
    'parcels.refresh': 'Aktualisieren',
    'parcels.close': 'Schliessen',
    'parcels.try_again': 'Erneut versuchen',
    'parcels.failed_load': 'Laden der Parzellen fehlgeschlagen',
    'parcels.empty_title': 'Noch keine gespeicherten Parzellen',
    'parcels.empty_body': 'Speichere Parzellen in Roofs, um sie suite-weit zu verfolgen.',
    'parcels.open_roofs': 'Roofs öffnen',
    'parcels.no_matches': 'Keine Treffer',
    'parcels.no_matches_body': 'Versuche eine andere Suche oder leere die Filter.',
    'parcels.manage_in_roofs': 'Parzellen in Roofs verwalten',
    'parcels.no_address': 'Keine Adresse',

    // Reporter
    'page.reporter.kicker': 'Reporter',
    'page.reporter.intro':
      'Adresse eingeben, um einen standardisierten Showroom-Bericht zu erstellen — fünf Live-Karten-Widgets, die SwissNovo-Apps am Standort zeigen: Bewertung, Gebäudehöhe, Baujahr, Solarpotenzial und Lärmexposition.',
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

    // User menu
    'menu.saved_parcels': 'Parcelle salvate',
    'menu.view_profile': 'Vedi profilo',
    'menu.sign_out': 'Esci',
    'menu.active_session': 'Sessione attiva',
    'menu.in_your_gallery': 'Nella tua galleria',
    'menu.user_fallback': 'Utente',

    // Gallery
    'gallery.heading': 'La tua galleria',
    'gallery.count_filtered': '{visible} di {total}',
    'gallery.count_total': '{total} export nella suite Swissnovo',
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
      'Showroom raccoglie gli export che salvi nella suite Swissnovo. Cattura una schermata o un report e apparirà qui automaticamente.',
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
    'parcels.title': 'Parcelle salvate',
    'parcels.search_placeholder': 'Cerca parcelle…',
    'parcels.state_all': 'Tutti gli stati',
    'parcels.priority_all': 'Tutte le priorità',
    'parcels.state_new': 'Nuova',
    'parcels.state_due_diligence': 'Due diligence',
    'parcels.state_contacted': 'Contattata',
    'parcels.state_closed': 'Chiusa',
    'parcels.priority_low': 'Bassa',
    'parcels.priority_medium': 'Media',
    'parcels.priority_high': 'Alta',
    'parcels.priority_urgent': 'Urgente',
    'parcels.refresh': 'Aggiorna',
    'parcels.close': 'Chiudi',
    'parcels.try_again': 'Riprova',
    'parcels.failed_load': 'Caricamento parcelle non riuscito',
    'parcels.empty_title': 'Nessuna parcella salvata',
    'parcels.empty_body': 'Salva parcelle in Roofs per seguirle in tutta la suite.',
    'parcels.open_roofs': 'Apri Roofs',
    'parcels.no_matches': 'Nessun risultato',
    'parcels.no_matches_body': 'Prova un’altra ricerca o cancella i filtri.',
    'parcels.manage_in_roofs': 'Gestisci parcelle in Roofs',
    'parcels.no_address': 'Nessun indirizzo',

    // Reporter
    'page.reporter.kicker': 'Reporter',
    'page.reporter.intro':
      'Inserisci un indirizzo per generare un report showroom standardizzato — cinque widget cartografici in tempo reale che ricreano le app SwissNovo in quel punto: valutazione, altezza edifici, anno di costruzione, potenziale solare ed esposizione al rumore.',
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
