# 🏏 Cricket Performance Analyzer Pro

A sleek, professional web application for tracking, analyzing, and comparing cricket player statistics. Built with modern web technologies, featuring real-time calculations, interactive charts, and an AI-powered assistant.

---

## ✨ Key Features

### 📊 **Performance Analytics**
- **Live Dashboard** - View aggregate statistics including total players, runs, average strike rate, and total boundaries.
- **Interactive Charts** - Visual data representation using Chart.js (Runs, Strike Rate, and Boundaries).
- **Best Performer (POTM)** - Automatically calculates the top performer based on a weighted scoring algorithm.

### 👥 **Player Management**
- **Dynamic Entry** - Add players with real-time validation of cricket statistics.
- **Bulk Operations** - Import and Export data via CSV files for easy management.
- **Full CRUD** - Edit or delete player records with confirmation safety.
- **Search & Filter** - Instantly find players by name or team, and filter by match format (T20, ODI, Test).

### 🏆 **Leaderboard**
- **Metric-based Rankings** - Rank players by Runs, Strike Rate, Boundaries, or Boundary Percentage.
- **Visual Podium** - Highlighting the top three performers in each category.

### 🤖 AI Assistant
- **Natural Language Queries** - Query your data using simple English.
- **Quick Insights** - Ask about "Top scorers", "Best strike rate", "Boundary hitters", or "Best performer".
- **Help System** - Guided commands to help you get the most out of the analyzer.

### 🎯 **User Experience**
- **Modern UI** - Dark-themed interface with vibrant neon accents and glassmorphism.
- **Smooth Animations** - Fluid transitions and animated search components.
- **Keyboard Shortcuts** - Enhanced productivity with shortcuts:
  - `Ctrl/Cmd + K`: Focus Search
  - `Ctrl/Cmd + N`: Add New Player
  - `Ctrl/Cmd + /`: Show Help
  - `Esc`: Close Modals
- **Responsive Design** - Fully optimized for desktop, tablet, and mobile devices.

---

## 💻 Quick Start

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/charan-kumar99/Cricket-Performance-Analyzer.git
   cd Cricket-Performance-Analyzer
   ```

2. **Run the application:**
   - **Option 1:** Simply open `index.html` in your web browser.
   - **Option 2:** Use a local server (recommended for best performance):
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js
     npx http-server
     ```
   - Then open `http://localhost:8000` in your browser.

---

## 📂 Project Structure
```bash
Cricket-Performance-Analyzer/
├── index.html         # Main application structure
├── script.js          # Core logic, AI assistant, and Chart.js integration
├── style.css          # Modern styling and animations
├── players.csv        # Sample data for import testing
├── AI_COMMANDS.md     # Detailed AI assistant command reference
├── .gitignore         # Git exclusion rules
└── README.md          # Project documentation
```

---

## ⚙️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **Styling** | Custom CSS with Variables, Space Grotesk & Inter Fonts |
| **Icons** | Font Awesome 6.0 |
| **Charts** | Chart.js |
| **Storage** | LocalStorage API for persistent data |

---

## 🤖 AI Assistant Examples

Navigate to the **AI Assistant** tab and try asking:
- `"Who is the top scorer?"`
- `"Show me the best strike rate"`
- `"Who hit the most boundaries?"`
- `"Who is the best performer?"`
- `"Help"`

For a full list of commands, see [AI_COMMANDS.md](AI_COMMANDS.md).

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📬 Connect

**Developer:** Charan Kumar

---

<div align="center">
  <p>Made with ❤️ for Cricket Fans</p>
</div>
