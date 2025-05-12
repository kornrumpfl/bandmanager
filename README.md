## 🎸 Band Management App - Project Documentation

### 📌 **Project Overview:**

The Band Management App is a React-based web application designed to help manage upcoming band performances, song lists, and event scheduling. It includes authentication (Email/Password and Google Sign-In), Firestore database integration, and PrimeReact UI components for a smooth user experience.

---

### 🗂️ **Project Structure:**

```
src/
├── components/
│   ├── Dashboard.js
│   ├── SongDetails.js
│   └── SideNavBar.js
│
├── services/
│   ├── firebaseConfig.js
│   ├── EventService.js
│   └── SongService.js
│
├── App.js
├── App.css
├── index.js
└── firebase.json
```

---

### ✨ **Main Components:**

#### 1️⃣ **Dashboard.js**

* Displays a calendar and list of upcoming events.
* Allows CRUD operations for event management.
* Smooth animations for item transitions.

#### 2️⃣ **SongDetails.js**

* Detailed form to input song details:

  * Singer, Song Name, Lyrics (PT & DE), YouTube Links, Additional Notes, and Cifra Link.
* Integrated with Firestore to save and delete song data.

#### 3️⃣ **SideNavBar.js**

* A collapsible sidebar for easy navigation:

  * Home, Add, Book, Search, Settings, and Logout.

---

### 🔥 **Firebase Integration:**

* Firestore is used for data persistence with two main collections:

  * `events`: For event scheduling.
  * `songs`: For song management.
* Realtime updates are handled with Firestore listeners.

---

### 🖌️ **Styling & UI:**

* Styled with **PrimeReact** components for modern UI elements.
* CSS animations for smooth transitions in the Dashboard.
* Dark-themed UI with clean, structured layout.

---

### 🔄 **Navigation Flow:**

1. **Login Screen** → User logs in via Email/Password or Google Sign-In.
2. **Dashboard** → Displays upcoming events and allows adding/editing of events.
3. **SongDetails** → Accessible from the 'Add' button on the sidebar.
4. **Logout** → Sidebar button to securely log out.

---

### 🚀 **Deployment:**

* Firebase Hosting (Recommended)
* Vercel / Netlify (Alternative)

---

### 🔄 **API References:**

#### 🔹 **EventService.js**

Manages CRUD operations for event scheduling:

* `fetchEvents()` → Fetches all events from Firestore.
* `addEvent(event)` → Adds a new event to Firestore.
* `deleteEvent(id)` → Deletes an event by its ID.
* `updateEvent(id, updatedEvent)` → Updates an event with new data.

#### 🔹 **SongService.js**

Handles CRUD operations for song details:

* `fetchSongs()` → Retrieves all songs from Firestore.
* `addSong(song)` → Adds a new song to Firestore.
* `deleteSong(id)` → Deletes a song by its ID.

---

### 🛠️ **Future Improvements:**

1. **Search and Filter Features** → Improve navigation within large song lists.
2. **Role-based Access Control** → Different permissions for admin and band members.
3. **Notifications** → Reminders for upcoming shows and events.
4. **File Uploads** → Attach sheet music or practice videos to events.

---

