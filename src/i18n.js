import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// the translations
// (tip move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)
const resources = {
  en: {
    translation: {
      "nav": {
        "home": "Home",
        "history": "History",
        "logout": "Logout"
      },
      "dashboard": {
        "title": "Dashboard",
        "create_event": "Create Event",
        "upcoming_events": "Upcoming Events",
        "date": "Date",
        "songs": "Songs",
        "mixer": "Mixer",
        "lyrics": "Lyrics",
        "edit": "Edit",
        "export_all": "Export All",
        "delete": "Delete",
        "all_songs": "All Songs",
        "search_placeholder": "Search by title or singer...",
        "singer": "Singer"
      },
      "song": {
        "add_title": "Add New Song",
        "edit_title": "Edit Song",
        "song_title": "Song Title",
        "singer": "Singer",
        "lyrics": "Lyrics",
        "key": "Key",
        "bpm": "BPM",
        "save": "Save",
        "cancel": "Cancel"
      },
      "event": {
        "create_title": "Create Event",
        "edit_title": "Edit Event",
        "name": "Event Name",
        "date": "Date",
        "mixer": "Mixer",
        "lyrics_role": "Lyrics",
        "select_songs": "Select Songs",
        "search_songs": "Search songs...",
        "save": "Save",
        "cancel": "Cancel",
        "export_songs": "Export Songs",
        "format": "Format",
        "group_lines": "Group Lines",
        "download_all": "Download All",
        "single_line": "Single line",
        "two_lines": "Two lines",
        "three_lines": "Three lines",
        "four_lines": "Four lines"
      },
      "history": {
        "title": "Event History",
        "date": "Date",
        "songs": "Songs",
        "view": "View"
      },
      "auth": {
        "login": "Login",
        "register": "Register",
        "email": "Email",
        "password": "Password",
        "dont_have_account": "Don't have an account? Register",
        "already_have_account": "Already have an account? Login",
        "error": "Error"
      }
    }
  },
  pt: {
    translation: {
      "nav": {
        "home": "Início",
        "history": "Histórico",
        "logout": "Sair"
      },
      "dashboard": {
        "title": "Painel",
        "create_event": "Criar Evento",
        "upcoming_events": "Próximos Eventos",
        "date": "Data",
        "songs": "Músicas",
        "mixer": "Mesa de Som",
        "lyrics": "Letras",
        "edit": "Editar",
        "export_all": "Exportar Tudo",
        "delete": "Excluir",
        "all_songs": "Todas as Músicas",
        "search_placeholder": "Pesquisar por título ou cantor...",
        "singer": "Cantor"
      },
      "song": {
        "add_title": "Adicionar Nova Música",
        "edit_title": "Editar Música",
        "song_title": "Título da Música",
        "singer": "Cantor",
        "lyrics": "Letra",
        "key": "Tom",
        "bpm": "BPM",
        "save": "Salvar",
        "cancel": "Cancelar"
      },
      "event": {
        "create_title": "Criar Evento",
        "edit_title": "Editar Evento",
        "name": "Nome do Evento",
        "date": "Data",
        "mixer": "Mesa de Som",
        "lyrics_role": "Letras",
        "select_songs": "Selecionar Músicas",
        "search_songs": "Pesquisar músicas...",
        "save": "Salvar",
        "cancel": "Cancelar",
        "export_songs": "Exportar Músicas",
        "format": "Formato",
        "group_lines": "Agrupar Linhas",
        "download_all": "Baixar Tudo",
        "single_line": "Uma linha",
        "two_lines": "Duas linhas",
        "three_lines": "Três linhas",
        "four_lines": "Quatro linhas"
      },
      "history": {
        "title": "Histórico de Eventos",
        "date": "Data",
        "songs": "Músicas",
        "view": "Ver"
      },
      "auth": {
        "login": "Entrar",
        "register": "Registrar",
        "email": "E-mail",
        "password": "Senha",
        "dont_have_account": "Não tem uma conta? Registre-se",
        "already_have_account": "Já tem uma conta? Entre",
        "error": "Erro"
      }
    }
  },
  de: {
    translation: {
      "nav": {
        "home": "Startseite",
        "history": "Verlauf",
        "logout": "Abmelden"
      },
      "dashboard": {
        "title": "Dashboard",
        "create_event": "Ereignis erstellen",
        "upcoming_events": "Kommende Ereignisse",
        "date": "Datum",
        "songs": "Lieder",
        "mixer": "Mischpult",
        "lyrics": "Liedtexte",
        "edit": "Bearbeiten",
        "export_all": "Alle exportieren",
        "delete": "Löschen",
        "all_songs": "Alle Lieder",
        "search_placeholder": "Suche nach Titel oder Sänger...",
        "singer": "Sänger"
      },
      "song": {
        "add_title": "Neues Lied hinzufügen",
        "edit_title": "Lied bearbeiten",
        "song_title": "Liedtitel",
        "singer": "Sänger",
        "lyrics": "Liedtext",
        "key": "Tonart",
        "bpm": "BPM",
        "save": "Speichern",
        "cancel": "Abbrechen"
      },
      "event": {
        "create_title": "Ereignis erstellen",
        "edit_title": "Ereignis bearbeiten",
        "name": "Ereignisname",
        "date": "Datum",
        "mixer": "Mischpult",
        "lyrics_role": "Liedtexte",
        "select_songs": "Lieder auswählen",
        "search_songs": "Lieder suchen...",
        "save": "Speichern",
        "cancel": "Abbrechen",
        "export_songs": "Lieder exportieren",
        "format": "Format",
        "group_lines": "Zeilen gruppieren",
        "download_all": "Alle herunterladen",
        "single_line": "Einzelne Zeile",
        "two_lines": "Zwei Zeilen",
        "three_lines": "Drei Zeilen",
        "four_lines": "Vier Zeilen"
      },
      "history": {
        "title": "Ereignisverlauf",
        "date": "Datum",
        "songs": "Lieder",
        "view": "Ansehen"
      },
      "auth": {
        "login": "Anmelden",
        "register": "Registrieren",
        "email": "E-Mail",
        "password": "Passwort",
        "dont_have_account": "Sie haben noch kein Konto? Registrieren",
        "already_have_account": "Haben Sie bereits ein Konto? Anmelden",
        "error": "Fehler"
      }
    }
  },
  es: {
    translation: {
      "nav": {
        "home": "Inicio",
        "history": "Historial",
        "logout": "Cerrar sesión"
      },
      "dashboard": {
        "title": "Panel",
        "create_event": "Crear evento",
        "upcoming_events": "Próximos eventos",
        "date": "Fecha",
        "songs": "Canciones",
        "mixer": "Mezclador",
        "lyrics": "Letras",
        "edit": "Editar",
        "export_all": "Exportar todo",
        "delete": "Eliminar",
        "all_songs": "Todas las canciones",
        "search_placeholder": "Buscar por título o cantante...",
        "singer": "Cantante"
      },
      "song": {
        "add_title": "Añadir nueva canción",
        "edit_title": "Editar canción",
        "song_title": "Título de la canción",
        "singer": "Cantante",
        "lyrics": "Letra",
        "key": "Tono",
        "bpm": "BPM",
        "save": "Guardar",
        "cancel": "Cancelar"
      },
      "event": {
        "create_title": "Crear evento",
        "edit_title": "Editar evento",
        "name": "Nombre del evento",
        "date": "Fecha",
        "mixer": "Mezclador",
        "lyrics_role": "Letras",
        "select_songs": "Seleccionar canciones",
        "search_songs": "Buscar canciones...",
        "save": "Guardar",
        "cancel": "Cancelar",
        "export_songs": "Exportar canciones",
        "format": "Formato",
        "group_lines": "Agrupar líneas",
        "download_all": "Descargar todo",
        "single_line": "Una línea",
        "two_lines": "Dos líneas",
        "three_lines": "Tres líneas",
        "four_lines": "Cuatro líneas"
      },
      "history": {
        "title": "Historial de eventos",
        "date": "Fecha",
        "songs": "Canciones",
        "view": "Ver"
      },
      "auth": {
        "login": "Iniciar sesión",
        "register": "Registrarse",
        "email": "Correo electrónico",
        "password": "Contraseña",
        "dont_have_account": "¿No tienes una cuenta? Regístrate",
        "already_have_account": "¿Ya tienes una cuenta? Inicia sesión",
        "error": "Error"
      }
    }
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: "en", // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
    // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
    // if you're using a language detector, do not define the lng option

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
