# Quiz Multiplayer Flow Documentation

## Overview
This document describes the multiplayer quiz flow implementation, including contact invitation and real-time participant addition features.

## Screen Flow

### 1. Main Quiz Screen (`app/(tabs)/quizz.tsx`)
- **Entry Point**: Main quiz screen with mode selection
- **Modes Available**:
  - **Solo**: Direct navigation to level selection
  - **Duo/Équipe/Groupe**: Shows play mode modal
    - **Présentiel** (In-person): Navigate to Add Participants screen
    - **À distance** (Remote): Navigate to Invite Contacts screen

### 2. Invite Contacts Screen (`app/quiz/invite-contacts.tsx`)
**Purpose**: Invite contacts for remote multiplayer quiz

**Features**:
- **Recent Contacts Section**: Horizontal scrollable list with checkboxes
  - Select multiple recent contacts with checkbox toggle
  - Shows contact avatar and abbreviated name
  
- **All Contacts Section**: Vertical scrollable list
  - Each contact shows:
    - Avatar placeholder
    - Full name
    - Last connection date
    - "Inviter" button (toggle state)
  
- **Actions**:
  - "Ajouter" button: Navigate to Add Participants screen
  - Custom bottom navigation:
    - "Revenir": Go back
    - "Suivant": Proceed to game setup with selected contacts

### 3. Add Participants Screen (`app/quiz/add-participants.tsx`)
**Purpose**: Add participants by username for in-person multiplayer

**Features**:
- **Username Input**: 
  - Avatar placeholder
  - Text input field
  - "Valider" button to add participant
  
- **Participants List**: 
  - Shows all added participants
  - Each participant has a remove button (X icon)
  - Counter showing total participants
  
- **Floating Action Button**: 
  - Purple circular button with "+" icon
  - Quick add shortcut (validates current input)
  
- **Actions**:
  - Custom bottom navigation:
    - "Revenir": Go back
    - "Suivant": Proceed to game setup (requires at least 1 participant)

### 4. Setup Game Screen (`app/quiz/setup-game.tsx`)
**Purpose**: Configure level and theme for the multiplayer quiz

**Features**:
- **Participants Info**: Display count of selected participants
  
- **Level Selection**:
  - DÉBUTANT (Beginner)
  - INTERMÉDIAIRE (Intermediate)
  - EXPERT (Expert)
  - Visual feedback for selected level
  
- **Theme Selection**:
  - Multiple themes available:
    - La vie du Prophète sws
    - Les piliers de l'islam
    - La foi
    - Le Coran
    - Jurisprudence
  - Checkmark icon for selected theme
  
- **Actions**:
  - Custom bottom navigation:
    - "Revenir": Go back
    - "Commencer": Start the quiz (validates level & theme selection)

## Reusable Components

### QuizHeader (`components/quiz/QuizHeader.tsx`)
**Purpose**: Consistent header across all quiz screens

**Features**:
- Purple gradient background with curved bottom
- "QUIZZ" logo with decorative stars
- Optional settings button
- Automatically handles safe area insets

**Props**:
```typescript
{
  showSettings?: boolean;      // Show settings button (default: true)
  onSettingsPress?: () => void; // Custom settings handler
}
```

### QuizBottomNav (`components/quiz/QuizBottomNav.tsx`)
**Purpose**: Custom bottom navigation for quiz flow

**Features**:
- Two-button layout: Back and Next
- Consistent styling across all screens
- Handles safe area insets
- Support for disabled state

**Props**:
```typescript
{
  onBack: () => void;           // Back button handler
  onNext: () => void;           // Next button handler
  nextLabel?: string;           // Next button text (default: "Suivant")
  backLabel?: string;           // Back button text (default: "Revenir")
  nextDisabled?: boolean;       // Disable next button (default: false)
}
```

## Navigation Flow Diagram

```
Main Quiz Screen
├─ Solo → Level Selection → Theme Selection → Quiz Game
├─ Duo/Équipe/Groupe
   ├─ Présentiel (In-person)
   │  └─ Add Participants → Setup Game → Quiz Game
   │
   └─ À distance (Remote)
      └─ Invite Contacts → Setup Game → Quiz Game
```

## Design System

### Colors
- **Primary Purple**: `#8B5CF6`
- **Purple Gradient**: `#7C3AED` → `#A855F7`
- **Accent Yellow**: `#FCD34D`
- **Background**: `#F5F5F5`
- **Surface**: `#FFFFFF`
- **Text Primary**: `#374151`
- **Text Secondary**: `#9CA3AF`

### Typography
- Uses dynamic font loading based on current language
- Font weights: Regular, Medium, Bold
- Consistent sizing across screens

### Components Style
- **Cards**: White background with subtle shadow
- **Buttons**: Rounded corners (12-20px radius)
- **Inputs**: White background with placeholder text
- **Checkboxes**: Purple when selected, gray border when not

## Data Flow

### Invite Contacts Flow
1. User selects contacts from recent or all contacts list
2. Selected contacts stored in state (Set<string>)
3. Participant count passed to Setup Game screen
4. Level and theme configuration
5. Quiz initialization with all parameters

### Add Participants Flow
1. User enters username and validates
2. Participant added to local state (Participant[])
3. Duplicate check prevents same username twice
4. List updates with animation
5. Participant count passed to Setup Game screen
6. Level and theme configuration
7. Quiz initialization with all parameters

## Future Enhancements

### Potential Features
- [ ] Search functionality in contacts list
- [ ] Contact grouping (favorites, recent, etc.)
- [ ] User profile preview on contact tap
- [ ] Participant avatar customization
- [ ] Save common participant groups
- [ ] Real-time multiplayer synchronization
- [ ] Push notifications for quiz invites
- [ ] Quiz history with participants
- [ ] Leaderboard for multiplayer sessions

### Technical Improvements
- [ ] Backend API integration for contacts
- [ ] Real-time WebSocket for live multiplayer
- [ ] Contact sync with device contacts
- [ ] Participant validation with database
- [ ] Quiz state persistence
- [ ] Offline mode support

## Testing Checklist

### Invite Contacts Screen
- [ ] Recent contacts checkbox toggle works
- [ ] All contacts invite button toggle works
- [ ] "Ajouter" button navigates to Add Participants
- [ ] "Revenir" button goes back
- [ ] "Suivant" button passes correct participant count

### Add Participants Screen
- [ ] Username input accepts text
- [ ] "Valider" button adds participant
- [ ] Duplicate username check works
- [ ] Remove button deletes participant
- [ ] Floating button validates current input
- [ ] "Suivant" button validates at least 1 participant
- [ ] Participant count displayed correctly

### Setup Game Screen
- [ ] Level selection updates state
- [ ] Theme selection updates state
- [ ] Participant count displays correctly
- [ ] "Commencer" button validates both selections
- [ ] Error alerts show for missing selections
- [ ] Navigation to quiz game works

## Dependencies

### Required Packages
- `expo-router`: Navigation
- `react-native-reanimated`: Animations
- `expo-linear-gradient`: Gradient backgrounds
- `@expo/vector-icons`: Icons
- `expo-image`: Optimized images
- `react-native-safe-area-context`: Safe area handling

### Custom Hooks
- `use-fonts`: Font loading and management
- `use-theme`: Theme management (if needed)

## File Structure

```
app/
├── (tabs)/
│   └── quizz.tsx              # Main quiz screen
├── quiz/
│   ├── invite-contacts.tsx    # Invite contacts screen
│   ├── add-participants.tsx   # Add participants screen
│   ├── setup-game.tsx         # Level/theme setup screen
│   ├── level-selection.tsx    # Solo level selection
│   ├── theme-selection.tsx    # Solo theme selection
│   └── index.tsx              # Quiz opponent finder
components/
└── quiz/
    ├── QuizHeader.tsx         # Reusable quiz header
    └── QuizBottomNav.tsx      # Reusable bottom navigation
```

## Notes

- All screens use consistent purple theme with yellow accents
- Animations implemented with `react-native-reanimated`
- Safe area insets handled for iOS notch and Android navigation
- Mock data used for contacts (replace with real API calls)
- Error handling with Alert dialogs
- Responsive layout for different screen sizes
