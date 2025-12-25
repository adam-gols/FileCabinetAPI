# Operations Sheets API Specification

## Overview

The Operations Sheets (OPs Sheets) endpoints provide access to operational data from individual event spreadsheets. Each operations sheet contains detailed site information, equipment assignments, and scheduling data.

## Site Info Tab Format

Each operations sheet contains a "Site Info" tab with the following column structure:

### Column Headers (Exact Format Required)

| Column | Header | Description | Example |
|--------|---------|-------------|---------|
| A | `Channel` | Broadcasting channel identifier | `CH1`, `CH2`, `CH3` |
| B | `Computer` | Equipment/computer identifier | `GD08`, `GD01`, `GD05` |
| C | `Date` | Date of operation | `12/12/2025` |
| D | `Singular` | Singular.live control URL | `https://app.singular.live/control/7H4PpuMu33VcGeEUorbQml` |
| E | `Facility` | Location/facility description | `Pool 1: Gate`, `Pool 2: Middle` |
| F | `Division` | Division information (often empty) | |
| G | `STAFF` | Staff member assigned | `Amelia Stringham`, `Adam Brzyski` |
| H | `1st Game Start` | First game start time | `8:10:00 AM`, `7:00:00 AM` |
| I | `Last Game End (Last Game Start + 1 HR)` | Last game end time | `8:50:00 PM`, `9:20:00 PM` |
| J | `Site Map` | Site map reference (often empty) | |
| K | `Internet?` | Internet availability (often empty) | |
| L | `Ethernet Info` | Ethernet connection details (often empty) | |
| M | `WIFI username` | WiFi credentials (often empty) | |
| N | `WIFI password` | WiFi credentials (often empty) | |
| O | `Jump Available` | Jump/backup availability (often empty) | |
| P | `Zixi Ingest` | Zixi streaming ingest info (often empty) | |

### Data Characteristics

- **Multi-day Events**: Same channel/computer combinations appear across multiple dates
- **Time Format**: Times in 12-hour format with AM/PM (`8:10:00 AM`)
- **Date Format**: MM/DD/YYYY format (`12/12/2025`)
- **URLs**: Singular.live control URLs are complete HTTPS links
- **Staff Assignment**: One staff member per channel/date combination
- **Equipment Tracking**: Computer IDs track specific hardware assignments

### Sample Data Structure

```
Channel: CH1, Computer: GD08, Date: 12/12/2025
├── Facility: Pool 1: Gate
├── Staff: Amelia Stringham  
├── Schedule: 8:10:00 AM - 8:50:00 PM
└── Control: https://app.singular.live/control/7H4PpuMu33VcGeEUorbQml

Channel: CH2, Computer: GD01, Date: 12/12/2025
├── Facility: Pool 2: Middle
├── Staff: Shawn Stringham
├── Schedule: 8:10:00 AM - 8:50:00 PM  
└── Control: https://app.singular.live/control/3Xjhzjb9SyZB2Wx4JtFRe2
```

### Expected Use Cases

1. **Daily Schedules**: Get all channel assignments for a specific date
2. **Staff Assignments**: Find who is assigned to which channels/facilities
3. **Equipment Tracking**: Track computer assignments across dates
4. **Time Management**: Get start/end times for operational planning
5. **Control Access**: Retrieve Singular.live control URLs for broadcast management

## Master Schedule Tab Format

Each operations sheet contains a "Master Schedule" tab with the following column structure:

### Column Headers (Exact Format Required)

| Column | Header | Description | Example |
|--------|---------|-------------|---------|
| A | `DATE` | Date of the game | `12/12/2025` |
| B | `TIME` | Scheduled game time | `8:10:00 AM` |
| C | `LOCATION` | Pool/venue location | `Pool 1: Gate` |
| D | `GAME#` | Game number identifier | `1`, `43`, `89` |
| E | `TEAM 1` | First team name | `NC Select 14U Boys` |
| F | `T1 SCORE` | Team 1 score (often empty during schedule) | `15`, `12`, `` |
| G | `TEAM 2` | Second team name | `Orlando Thunder 14` |
| H | `T2 SCORE` | Team 2 score (often empty during schedule) | `10`, `8`, `` |
| I | `COMMENTS` | Game comments/notes | `Championship Bracket - Game 3` |
| J | `DIVISION` | Division/age group | `14U Boys`, `16U Girls`, `12U Mixed` |
| K | `ACTUAL START TIME` | Actual game start time | `8:10:00 AM`, `9:03:00 AM` |

### Data Characteristics

- **Multi-day Tournament**: Games span multiple dates (12/12/2025, 12/13/2025, 12/14/2025)
- **Multiple Locations**: Different pools/venues (Pool 1: Gate, Pool 2: Middle, Pool 3: Scoreboard)
- **Sequential Game Numbers**: Games numbered sequentially across all pools (1-121+)
- **Age Divisions**: Various age groups and genders (14U Boys, 16U Girls, 18U Boys, 12U Mixed, etc.)
- **Tournament Structure**: Regular games, championship brackets, placement games
- **Time Tracking**: Both scheduled time and actual start time recorded
- **Score Tracking**: Scores may be filled in during/after games
- **Comments**: Special game designations (Championship, 3rd place, Round Robin, etc.)

### Sample Data Structure

```
Game #1: 12/12/2025 8:10:00 AM at Pool 1: Gate
├── Teams: NC Select 14U Boys vs Orlando Thunder 14
├── Division: 14U Boys
├── Actual Start: 8:10:00 AM
└── Comments: (none)

Game #57: 12/13/2025 6:40:00 PM at Pool 1: Gate  
├── Teams: Orlando Thunder 14 vs Princeton Aquatics 14U Boys
├── Division: 14U Boys
├── Actual Start: 6:51:00 PM
└── Comments: Championship Bracket - Game 3
```

### Usage Patterns

- **Schedule Planning**: Shows complete tournament schedule across all venues
- **Live Updates**: Actual start times track real-world timing delays
- **Tournament Tracking**: Comments indicate bracket progression and game importance
- **Operational Coordination**: Location data helps coordinate equipment and staff
- **Results Recording**: Score fields allow for live score updates during tournament

---

**Status**: Format documented - awaiting further endpoint specifications.
