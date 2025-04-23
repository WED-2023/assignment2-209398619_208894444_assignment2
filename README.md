# Spaceship Game
## Overview
Spaceship Game is a classic space shooter inspired by iconic arcade games like Space Invaders. Players control a spaceship at the bottom of the screen and must defend against waves of enemy ships while earning points by shooting them down.

# Developers
### Raz Ganon (208894444)
### Keren Londner (209398619)

# Play the Game

Play Spaceship Game

# Game Features

User Authentication System: Register an account or use the test account (username: p, password: testuser)

Interactive Gameplay: Control your spaceship using arrow keys with full diagonal movement support

Progressive Difficulty: Enemy ships speed up every 5 seconds (up to 4 times)

Point System: Different points awarded based on enemy row position

Lives System: Players have 3 lives before game over

Custom Game Configuration: Configure gameplay settings including shooting key and game duration

High Score Tracking: Personal high scores are saved and displayed at the end of each game

Responsive Design: Optimized for Chrome with a minimum resolution of 1366x768

Visual Effects: Dynamic star field background with particle animation

Sound Effects: Background music and sound effects for various game actions

# Technical Implementation

Built with HTML5, CSS3, and vanilla JavaScript

Uses HTML5 Canvas for rendering game elements

Implements object-oriented design patterns for game entities

Custom collision detection system

State management for game progression and user data

Particle animation system for visual effects

Sound management system

# Game Controls

Arrow Keys: Move the spaceship (including diagonal movement)

Configurable Shoot Key: Default is spacebar, but can be changed in the configuration screen

Home Key: Return to the welcome screen at any time

# Scoring System

Bottom row (4th): 5 points

3rd row: 10 points

2nd row: 15 points

Top row (1st): 20 points

## Game Rules

You have 3 lives - getting hit 3 times ends the game

You can only move in the bottom 40% of the screen

Enemy ships speed up every 5 seconds (up to 4 times)

## You can win by either:

Reaching the time limit with a score above 100 points

Destroying all enemy ships before the time limit



# Development Challenges
During the development process, we encountered several challenges:

Managing transitions between game screens and UI states

Synchronizing canvas rendering with HTML-based game UI

Implementing diagonal movement for both player and enemies

Handling real-time scoring and persistent user data

Creating a balanced acceleration system for enemies

Optimizing sound management across different game states

Implementing efficient collision detection

# Browser Compatibility

The game is designed to run in Chrome browser with a minimum resolution of 1366x768.

# Code Structure
### HTML: Defines the game structure and UI components
### CSS: Handles styling and visual effects
### JavaScript: Manages game logic, animation, and user interactions

# Future Improvements
Potential future enhancements could include:

Additional enemy types with different behaviors
Power-ups and special weapons
Multiple game levels with increasing difficulty
Global leaderboard
Mobile/touch support

# Credits
All game assets, code, and design were created by Raz Ganon and Keren Londner without the use of any templates or jQuery plugins.
