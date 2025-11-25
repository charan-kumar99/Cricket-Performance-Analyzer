# 🏏 Cricket Performance Analyzer Pro

**Version 2.0** - A modern, production-ready cricket statistics tracking and analysis platform with advanced animations and realistic cricket validations

A sleek, professional web application for tracking, analyzing, and comparing cricket player statistics with real-time calculations, interactive charts, AI-powered insights, comprehensive performance tracking, and stunning visual animations. Built with modern web technologies featuring multiple font families and smooth transitions throughout.

---

## ✨ Key Features

### 📊 **Performance Analytics**
- **Real-time Dashboard** - Live statistics with animated stat cards
- **Interactive Charts** - Beautiful visualizations using Chart.js
- **Performance Insights** - AI-generated insights for top performers
- **Strike Rate Calculator** - Automatic computation with boundary metrics

### 👥 **Player Management**
- **Quick Add** - Fast player data entry with validation
- **Bulk Import** - CSV file upload with error handling
- **Edit & Delete** - Manage player records with confirmation dialogs
- **Search & Filter** - Advanced filtering by name, team, and match type

### 📈 **Advanced Analytics**
- **Comparison Tool** - Side-by-side player statistics
- **Top Performers** - Leaderboards for runs, strike rate, boundaries
- **Visual Reports** - Bar, line, and combo charts
- **Print Stats** - Export formatted reports for printing

### 🤖 **AI Assistant**
- **Natural Language Queries** - Ask questions in plain English
- **Quick Insights** - "Best strike rate", "Top scorers", etc.
- **Player Comparison** - "Compare Virat and Rohit"
- **Team Statistics** - "Team India stats"

### 🎯 **User Experience**
- **Onboarding Modal** - First-time user guidance
- **Toast Notifications** - Real-time feedback for all actions
- **Keyboard Shortcuts** - Power user productivity features
- **Smooth Animations** - Modern, fluid interface transitions
- **Responsive Design** - Perfect on desktop, tablet, and mobile

---

## 💻 Quick Start

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/charan-kumar99/Cricket-Performance-Analyzer.git
   cd Cricket-Performance-Analyzer
   ```

2. **Run the application:**
   - **Option 1:** Simply open `index.html` in your web browser
   - **Option 2:** Use a local server (recommended):
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js http-server
     npx http-server
     
     # Using PHP
     php -S localhost:8000
     ```
   - Then open http://localhost:8000 in your browser

3. **Start using:**
   - Open the **Add Player** tab
   - Add your first player to begin tracking statistics

### System Requirements

- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- JavaScript enabled
- LocalStorage enabled (for data persistence)
- Internet connection (for CDN resources: Font Awesome, Chart.js, Google Fonts)

---

## 🎯 Usage Guide

### Adding Players

1. Navigate to **Add Player** tab
2. Fill in the required fields:
   - Player Name (required)
   - Runs (required)
   - Balls faced (required)
   - Fours, Sixes (required, used for validation)
   - Team Name (required)
   - Match Type (T20/ODI/Test)
3. Click **Add Player**
4. Strike rate is calculated automatically, and innings are validated using real cricket rules (max 6 runs per ball, boundaries cannot exceed balls faced, etc.)

### Viewing Statistics

- Go to **Statistics** tab
- Use filters to sort by:
  - Match type (T20, ODI, Test)
  - Team
  - Sort by runs, strike rate, or boundaries
- Search players by name
- Edit or delete individual records

### Analyzing Performance

- **Dashboard**: View overall statistics at a glance
- **Analytics**: Interactive charts showing top 10 players
- **Insights**: AI-generated performance insights
  - Top Performer
  - Highest Strike Rate
  - Most Consistent
  - Boundary King

### Using AI Assistant

Navigate to **AI Assistant** tab and ask questions:

- `"Top scorers"` - See top 5 run scorers
- `"Best strike rate"` - Find players with highest SR
- `"Boundary stats"` - Show top boundary hitters
- `"Best performer"` - Show automatically calculated Player of the Match
- `"help"` or `"what can you do"` - Show supported query types

### Import/Export Data

**Import CSV:**
1. Prepare CSV file with headers: `Name,Team,Runs,Balls,Fours,Sixes,Format`
2. Click **Import CSV** in Add Player tab
3. Select your file
4. Only innings that pass the cricket validation rules will be imported

**Export CSV:**
- Go to Statistics tab
- Click **Export CSV** to download all data

**Print Stats:**
- Go to Insights tab
- Click **Print Stats** for formatted report

### Keyboard Shortcuts

Power users can use these shortcuts:
- `Ctrl/Cmd + K` - Quick search players
- `Ctrl/Cmd + N` - Add new player
- `Ctrl/Cmd + /` - Show keyboard shortcuts
- `Esc` - Close dialogs/modals

---

## 📂 Project Structure
```bash
Cricket-Performance-Analyzer/
│
├── index.html         # Main HTML file with semantic structure
├── script.js          # JavaScript logic and animations
├── style.css          # Advanced CSS with animations
├── players.csv        # Sample player data
├── AI_COMMANDS.md     # Complete AI assistant commands reference
├── README.md          # Project documentation
└── assets/            # Screenshots and images
```

### **File Descriptions**

| File | Purpose |
|------|---------|
| `index.html` | Main application structure with tabs and components |
| `script.js` | All JavaScript functionality including leaderboard |
| `style.css` | Complete styling with animations and font families |
| `AI_COMMANDS.md` | **📖 Full reference of all AI assistant commands** |
| `players.csv` | Sample data for importing |

---

## ⚙️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **Styling** | Custom CSS with CSS Variables, Modern Gradients, Advanced Animations |
| **Fonts** | Orbitron, Rajdhani, Inter, Poppins (Google Fonts) |
| **Icons** | Font Awesome 6.0 |
| **Charts** | Chart.js 4.x with custom styling |
| **Storage** | LocalStorage API for data persistence |
| **Design** | Responsive, Mobile-First, Teal/Cyan Dark Theme |
| **Animations** | CSS Keyframes, Transitions, Transforms |

---

## 🎨 Design Features

### **Visual Design**
- **Modern Color Palette** - Teal/Cyan with Coral accents
- **Glassmorphism Effects** - Backdrop blur and transparency
- **Gradient Overlays** - Dynamic glowing backgrounds
- **Responsive Layout** - Works on all screen sizes
- **Accessibility** - ARIA labels, keyboard navigation
- **Performance** - Optimized rendering and animations

### **Typography**
- **Orbitron** - Futuristic font for headings and numbers (uppercase, wide spacing)
- **Rajdhani** - Sporty font for subheadings and labels
- **Inter** - Clean font for body text and forms
- **Poppins** - Modern font for specific elements

### **Advanced Animations**
- **Title Glitch Effect** - Periodic glitch animation on main heading
- **Fade In Up** - Cards slide up and fade in on load
- **Zoom In** - Stat cards zoom in with bounce effect (staggered)
- **Slide In** - Section headers slide from left
- **Rotate In** - Icons rotate and scale on appearance
- **Number Glow** - Pulsing glow effect on statistics
- **Icon Pulse** - Continuous pulsing on stat icons
- **Hover Scale** - Cards scale and rotate slightly on hover
- **Radial Glow** - Expanding glow effect on card hover
- **Shine Effect** - Light sweep across buttons on hover
- **Podium Rise** - Leaderboard podium rises with bounce
- **Avatar Glow** - Pulsing shadow animation on avatars
- **Floating Icons** - Trophy icons float up and down

---

## 🤖 AI Commands Reference

For a complete list of all AI assistant commands, see **[AI_COMMANDS.md](AI_COMMANDS.md)**

This comprehensive reference document includes:
- ✅ All query patterns and variations
- ✅ Player comparison commands
- ✅ Team statistics queries
- ✅ Top performer queries
- ✅ Natural language examples
- ✅ Tips for best results
- ✅ Example conversations

**Quick Examples:**
```
"Best strike rate"
"Top 5 scorers"
"Compare Virat and Rohit"
"Team India stats"
"Most boundaries"
```

📖 **[View Full Command Reference →](AI_COMMANDS.md)**

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📬 Connect

**Developer:** Charan Kumar
---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- Font Awesome for the beautiful icons
- Chart.js for the amazing charting library
- Google Fonts for Inter and Poppins fonts
- The cricket community for inspiration

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/charan-kumar99">Charan Kumar</a></p>
  <p>⭐ Star this repo if you find it useful!</p>
</div>