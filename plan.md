# 🎪 AMIS PARK – STRUCTURED NAV PLAN

user thinking: want to leaverage event to gain burst of users
Goal: Organize all fest events into a clean, intuitive, fast-access system inside OthrHalff.
navigation/button: currently inside virtual date options pinned card
---

# 🧭 NAVIGATION STRUCTURE

## 🏠 Main Entry
- Amis Park Landing (/ami-Spark)
  - 🔥 Live Feed
  - 🗺️ Heatmap
  - 🗳️ Polls
  - 🎯 Events Explorer

---

# 🎯 EVENTS EXPLORER (CORE NAV)

## 🔍 Category-Based Navigation

### 🎭 EXPERIENCE ZONES (Immersive / Fun)
- Magic Meet in Hogwarts
- Stranger Things
- Chamber of Secrets
- The Last Escape
- Killer on Board

---

### 🧠 INTELLECTUAL / CREATIVE EVENTS
- Mindset Reloaded
- Brainwave Bazaar
- Archinterio
- ARC X
- Next Gen Arena

---

### 🎨 CULTURAL / LITERARY
- Kavyavani
- Afasana

---

### 🎮 GAMING ZONE
- Free Fire & BGMI
- Technova

---

### 🎪 ENTERTAINMENT / FUN EVENTS
- Carnival Fiesta
- Ad Mad Show
- Cramp It Up

---

### 🔥 SPECIAL / MIXED EVENTS
- Crime Scene Investigation
- Heatwaves
- Amivibe

---

# 🧩 EVENT DATA STRUCTURE

Each event should have:

- id
- name
- category
- location (zone/building)
- liveStats:
  - postsCount
  - checkIns
  - rating
- tags (array)
- isTrending (boolean)

---

# ⚡ UI NAV FLOW

## 📍 Entry Screen
- Hero: "Enter Amis Park"
- Buttons:
  - Explore Events
  - See Live Crowd
  - Jump to Feed

---

## 🎯 Events Page

### Layout:
- Category Tabs (horizontal scroll)
  - Experience
  - Gaming
  - Cultural
  - Fun
  - Tech

### Inside Each Category:
- Event Cards:
  - Name
  - Live Rating
  - Crowd Level (🔥 indicator)
  - "View Live" CTA

---

## 📄 Event Detail Page

Each event gets:

- 🧾 Title + vibe tag
- 📊 Live stats:
  - Rating
  - Crowd level
- 📰 Live posts (filtered feed)
- 😱 Reaction buttons
- 📍 Check-in button

---

# 🔥 HEATMAP MAPPING (LINK WITH EVENTS)

Map events to zones:

- Horror/Experience → Zone A
- Gaming → Zone B
- Cultural → Zone C
- Fun/Carnival → Zone D

Each zone:
- Aggregates event activity
- Drives heat color

---

# 🗳️ POLL INTEGRATION

Poll examples:
- "Best Experience Zone?"
- "Top Gaming Event?"
- "Most overrated event?"

Poll options auto-filled from event list.

---

# 💡 SUGGESTION SYSTEM LINK

Allow suggestions per event:
- "Improve this event"
- "Too crowded"
- "Needs better setup"

---

# 🔎 SEARCH & QUICK ACCESS

- Search bar:
  - Type event name → jump directly
- Quick filters:
  - 🔥 Trending
  - 😱 Most Intense
  - 🎮 Gaming Only

---

# 🚀 MVP NAV (KEEP IT SIMPLE FIRST)

- [ ] Events Explorer Page
- [ ] Category Tabs
- [ ] Event Cards
- [ ] Event Detail Page
- [ ] Feed filtered by event

---

# 🧠 FUTURE ENHANCEMENTS

- Smart suggestion:
  → "You should visit Chamber of Secrets now"
- Event timeline replay
- Personalized event feed

---

# ⚡ DESIGN NOTE

This should NOT feel like a list.

It should feel like:
> *walking through a digital festival map, where every click opens a new vibe.*

- Use horizontal scroll
- Use glowing cards
- Use motion transitions


*#Note
- you can override any command if u feel like it can be done easily in other appraoch 