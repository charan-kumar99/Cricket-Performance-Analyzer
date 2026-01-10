# 🤖 AI Assistant Commands Reference

The Cricket Performance Analyzer AI Assistant uses a keyword-based system to provide quick insights into your player data.

## 📊 Supported Queries

### 🏆 Best Performer (POTM)
Find out who the top performer is based on the application's weighted scoring algorithm.
- **Keywords:** `best`, `performer`, `player`
- **Examples:** 
  - "Who is the best performer?"
  - "Top player"
  - "Best performer"

### 🏏 Run Scorers
Get a list of the top 5 players by total runs.
- **Keywords:** `top` AND (`run` OR `scorer`)
- **Examples:**
  - "Top scorers"
  - "Show top 5 run scorers"
  - "Who are the top scorers?"

### ⚡ Strike Rate Leaders
Get a list of the top 5 players by strike rate.
- **Keywords:** `strike`
- **Examples:**
  - "Best strike rate"
  - "Top strike rates"
  - "Strike rate leaders"

### 🚀 Boundary Hitters
Get a list of the top 5 players by total boundaries (4s + 6s).
- **Keywords:** `boundary`, `boundaries`
- **Examples:**
  - "Most boundaries"
  - "Top boundary hitters"
  - "Who hit the most boundaries?"

### 📈 Comparisons
The AI provides guidance on how to perform detailed comparisons.
- **Keywords:** `compare`
- **Example:** "Compare Virat and Rohit"
- **Response:** Directs you to use the **Analytics** section for interactive charts.

---

## 💡 Tips for Best Results

1. **Keep it Simple**: The AI looks for specific keywords in your sentence.
2. **Add Data First**: If no players are added to the system, the AI will prompt you to add some.
3. **Use Help**: Type `"help"` at any time to see a list of what the AI can do.

## 🛠️ How it Works
The assistant analyzes your input for specific keywords and then queries the local `players` array. It sorts the data in real-time to give you the most up-to-date statistics available in your dashboard.
