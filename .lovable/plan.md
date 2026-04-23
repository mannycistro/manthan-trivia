
# Jeopardy-Style Quiz Game

A browser-based, host-controlled Jeopardy game built for live screen sharing in online meetings. No login, no installation — open and play.

## Main Game Board
- 5×5 grid: 5 editable category headers across the top, 5 value tiles per category (100/200/300/400/500)
- Bold quiz-show aesthetic: deep blue/black background, gold and white text, large readable fonts optimized for shared screens
- Clicking a tile smoothly transitions (fade/zoom) into the question view
- Used tiles become dimmed and disabled; state persists for the session (until page refresh)

## Question View
- Full-screen display of the question with large typography
- Supports optional media per question:
  - Image (upload from device)
  - Video (YouTube embed or uploaded file)
  - Audio (uploaded file with play controls)
- **Show Answer** button reveals the answer on the same screen with a smooth reveal animation
- **Back to Board** button returns to the grid
- Optional **per-question timer** with Start / Stop / Reset controls

## Scoreboard (always visible below the board)
- Configurable 2–4 teams
- Each team card shows editable name + large score
- Per-team **+** and **−** buttons; host picks the value (uses the current question's value by default, plus quick custom amounts)
- Active team can be highlighted

## Edit Mode
- Single "Edit Game" button opens an editor panel
- Table/list view of all 25 questions grouped by category
- Inline editing of: category titles, question text, answer text, and media attachments
- Changes saved instantly to local browser storage so the game survives refresh if desired (with a "Reset Board" action to clear used tiles)
- Import/Export game data as JSON for reuse and sharing between hosts

## Sound Effects (toggleable)
- Correct answer chime
- Wrong answer buzzer
- Tile/button click
- Master mute switch in the header

## Tech & Behavior
- Single-page React app, all client-side, no backend needed
- Smooth CSS transitions between board ↔ question (no reloads)
- Local storage for game content + session state for used tiles and scores
- Optimized layout for 1080p+ screen sharing in Zoom/Teams/Meet

## Deliverable
A ready-to-play Jeopardy game seeded with placeholder categories/questions so the host can immediately try it, then edit content for their own meeting.
