import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// The Translation Resources
const resources = {
  en: {
    translation: {
      general: {
        province: "Province",
        population: "Population"
      },
      header: {
        title: "NL-City-Quiz",
        subtitle: "Guess the Dutch City",
        quit: "Quit to Menu",
        remaining: "Remaining",
        wrong: "Wrong",
        correct: "Correct",
      },
      menu: {
        settings: "Game Settings",
        min_pop: "Min Population",
        pop_range: "Population Count",
        provinces: "Provinces",
        select_all: "Select All",
        clear_all: "Clear All",
        selected_count: "Selected: {{count}}",
        all_selected: "All provinces selected",
        labels: {
          village: "Small Village",
          city: "Large City"
        },
        btn_start: "Start Quiz",
        btn_explore: "Explore Map 🌍",
        mode_select: "Select Game Mode",
        mode_name: "Name ⌨️",
        mode_point: "Point 📍",
        learn_mode: {
          title: "Enable Learning Mode 🎓",
          description: "Progressive difficulty based on your mastery",
          btn_reset: "Reset Learning Progress",
          config: {
            "title": "Configure Learning Mode",
            "q_per_r": "Questions per Round",
            "new_ratio": "New Material Ratio (only if less than {{maxActive}} active)",
            "active_ratio": "Active Material Ratio",
            "review_ratio": "Review Material Ratio (Calculated)"
          }
        },
        modes: {
          title: "Quiz Type",
          cities: {
            label: "Cities",
            description: "Guess the city",
          },
          road: {
            label: "Roads",
            description: "Guess the road",
            type_filter: "Type of Roads",
            length_filter: "Length",
            type: {
              highway: "Highway",
              provincial: "Provincial",
              city: "City",
              european: "European",
            },
          },
        }
      },
      game: {
        placeholder: "Type the city name...",
        btn_guess: "Guess",
        btn_skip: "Skip for now",
        btn_giveup: "I don't know",
        feedback: {
          correct: "Correct!",
          wrong: "Incorrect!"
        },
        find_prompt: "Locate: {{city}}",
        alert: {
          wrong_location_guess: "You clicked on {{city}}.",
          dont_know: "The city was {{city}}.",
        },
      },
      explore: {
        click_hint: "Click a city to see more information",
        close: "Close Selection",
        aliases: "Known Aliases",
        no_aliases: "No built-in aliases",
        add_placeholder: "Add alias...",
        btn_add: "Add",
        known_alias: "Standard alias",
        remove_alias: "Remove alias",
        road: {
          highway: "Highway",
          provincial: "Provincial road",
          city: "City road",
          european: "European road",
        }
      },
      finish: {
        title: "Quiz Finished!",
        coverage_title: "Population Coverage",
        coverage_text: "You know where <b>{{correct}}</b> people live out of <b>{{total}}</b> in the selected area.",
        btn_replay: "Replay Mistakes",
        btn_menu: "Back to Menu",
        btn_start: "Start a New Game",
        stat_incorrect: "Incorrect",
      }
    }
  },
  nl: {
    translation: {
      general: {
        province: "Provincie",
        population: "Inwoners"
      },
      header: {
        title: "NL-Steden-Quiz",
        subtitle: "Raad de Woonplaats",
        quit: "Terug naar Menu",
        remaining: "Nog te gaan",
        wrong: "Fout",
        correct: "Goed",
      },
      menu: {
        settings: "Instellingen",
        min_pop: "Minimale Inwoners",
        pop_range: "Aantal Inwoners",
        provinces: "Provincies",
        select_all: "Alles Selecteren",
        clear_all: "Alles Wissen",
        selected_count: "Geselecteerd: {{count}}",
        all_selected: "Alle provincies geselecteerd",
        labels: {
          village: "Dorp",
          city: "Grote Stad"
        },
        btn_start: "Start de Quiz!",
        btn_explore: "Verken de Kaart 🌍",
        mode_select: "Selecteer het Speltype",
        mode_name: "Benoem ⌨️",
        mode_point: "Wijs aan 📍",
        learn_mode: {
          title: "Leermodus 🎓",
          description: "Voeg automatisch meer steden toe op basis van voortgang",
          btn_reset: "Verwijder Voortgang",
          config: {
            "title": "Stel Leermodus In",
            "q_per_r": "Aantal Vragen per Ronde",
            "new_ratio": "Verhouding Niewe Stof (alleen als minder dan {{maxActive}} in actieve behandeling)",
            "active_ratio": "Verhouding Actieve Stof",
            "review_ratio": "Verhouding Herhaalde Stof (Berekend)"
          }
        },
        modes: {
          title: "Quiz Type",
          cities: {
            label: "Woonplaatsen",
            description: "Raad de stad",
          },
          road: {
            label: "Wegen",
            description: "Raad de (snel)weg",
            type_filter: "Type Wegen",
            length_filter: "Lengte",
            type: {
              highway: "Snelwegen",
              provincial: "Provinciaal",
              city: "Stadswegen",
              european: "Europees",
            },
          },
        }
      },
      game: {
        placeholder: "Typ de naam van de plaats...",
        btn_guess: "Raad",
        btn_skip: "Sla over",
        btn_giveup: "Ik weet het niet",
        feedback: {
          correct: "Goed!",
          wrong: "Helaas!"
        },
        find_prompt: "Wijs aan: {{city}}",
        alert: {
          wrong_location_guess: "Je klikte {{city}} aan.",
          dont_know: "De woonplaats was {{city}}.",
        },
      },
      explore: {
        click_hint: "Klik op een plaats voor meer info",
        close: "Sluiten",
        aliases: "Bekende Aliassen",
        no_aliases: "Geen standaard aliassen",
        add_placeholder: "Voeg alias toe...",
        btn_add: "Voeg toe",
        known_alias: "Standaard alias",
        remove_alias: "Verwijder alias",
        road: {
          highway: "Snelweg",
          provincial: "Provinciale weg",
          city: "Stadsweg",
          european: "Europese weg",
        }
      },
      finish: {
        title: "Quiz Afgelopen!",
        coverage_title: "Inwoner Percentage",
        coverage_text: "Je weet waar <b>{{correct}}</b> mensen wonen van de <b>{{total}}</b> in het geselecteerde gebied.",
        btn_replay: "Probeer Missers Opnieuw",
        btn_menu: "Terug naar Menu",
        btn_start: "Begin een Nieuw Spel",
        stat_incorrect: "Fout",
      }
    }
  }
};

i18n
  .use(LanguageDetector) // Detects user language
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources,
    fallbackLng: 'nl', // Default to English if language not found
    interpolation: {
      escapeValue: false // React already escapes by default
    }
  });

export default i18n;
