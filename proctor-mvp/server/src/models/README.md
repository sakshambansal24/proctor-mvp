# Mongoose Models

This directory contains all Mongoose models for the Proctor MVP platform.

## Models Overview

### 1. Recruiter (`Recruiter.ts`)
Manages recruiter accounts with passwordless authentication.

**Fields:**
- `name` (required, string, max 100 chars)
- `email` (required, unique, validated)
- `token` (required, unique, indexed)

**Indexes:**
- Unique index on `email`
- Unique index on `token`

---

### 2. Test (`Test.ts`)
Represents a test/assessment created by a recruiter.

**Fields:**
- `title` (required, string, 3-200 chars)
- `description` (required, string, max 1000 chars)
- `startTime` (optional, Date, must be in future)
- `endTime` (optional, Date, must be after startTime)
- `durationMinutes` (required, number, 1-1440)
- `published` (boolean, default: false, indexed)
- `questions` (array of Question ObjectIds)
- `testLinkId` (required, unique, indexed)
- `createdBy` (required, ObjectId ref to Recruiter)
- `recruiterId` (required, ObjectId ref to Recruiter, indexed)

**Indexes:**
- Unique index on `testLinkId`
- Index on `recruiterId`
- Compound index on `published` and `createdAt`
- Compound index on `recruiterId` and `published`

---

### 3. Question (`Question.ts`)
Represents a single question in a test.

**Fields:**
- `testId` (required, ObjectId ref to Test, indexed)
- `text` (required, string, min 10 chars)
- `options` (required, array of {key, label}, 2-6 options)
- `correctOption` (required, string, must match one of the option keys)
- `marks` (required, number, min 1, default: 1)

**Indexes:**
- Index on `testId`
- Compound index on `testId` and `createdAt`

**Validation:**
- Options array must have 2-6 items
- Correct option must exist in options array

---

### 4. CandidateSession (`CandidateSession.ts`)
Tracks a candidate's test session.

**Fields:**
- `testId` (required, ObjectId ref to Test, indexed)
- `candidateName` (optional, string, max 100 chars)
- `sessionId` (required, unique, indexed)
- `startedAt` (required, Date, default: now, indexed)
- `endedAt` (optional, Date, must be after startedAt)
- `timeTaken` (optional, number in seconds, auto-calculated)
- `status` (required, enum: 'in_progress' | 'completed' | 'auto_failed', indexed)
- `answers` (array of Answer ObjectIds)
- `redFlags` (array of RedFlag ObjectIds)

**Indexes:**
- Unique index on `sessionId`
- Compound index on `testId` and `status`
- Compound index on `testId` and `startedAt`
- Compound index on `status` and `startedAt`

**Methods:**
- `calculateTimeTaken()` - Calculates time taken from startedAt and endedAt

**Hooks:**
- Pre-save hook automatically calculates `timeTaken` when `endedAt` is set

---

### 5. Answer (`Answer.ts`)
Represents a candidate's answer to a question.

**Fields:**
- `questionId` (required, ObjectId ref to Question, indexed)
- `selectedOption` (required, string)
- `isCorrect` (required, boolean, default: false)
- `timeAnswered` (required, Date, default: now)

**Indexes:**
- Index on `questionId`
- Index on `timeAnswered`

---

### 6. RedFlag (`RedFlag.ts`)
Tracks proctoring violations during a test session.

**Fields:**
- `sessionId` (required, ObjectId ref to CandidateSession, indexed)
- `type` (required, enum: 'camera_denied' | 'screen_sharing_denied' | 'tab_switch' | 'visibility_hidden' | 'camera_off', indexed)
- `timestamp` (required, Date, default: now, indexed)
- `details` (optional, string, max 500 chars)

**Indexes:**
- Compound index on `sessionId` and `timestamp`
- Compound index on `sessionId` and `type`
- Compound index on `type` and `timestamp`

---

## Usage

### Import Models

```typescript
// Import all models
import { Test, Question, CandidateSession, Answer, RedFlag, Recruiter } from './models';

// Or import individually
import Test from './models/Test';
import Question from './models/Question';
```

### Example Usage

```typescript
// Create a test
const test = new Test({
  title: 'JavaScript Basics',
  description: 'Test your JavaScript knowledge',
  durationMinutes: 60,
  testLinkId: 'unique-link-id-123',
  recruiterId: recruiterId,
  createdBy: recruiterId
});

// Create a question
const question = new Question({
  testId: test._id,
  text: 'What is the result of 2 + 2?',
  options: [
    { key: 'A', label: '3' },
    { key: 'B', label: '4' },
    { key: 'C', label: '5' }
  ],
  correctOption: 'B',
  marks: 1
});

// Start a session
const session = new CandidateSession({
  testId: test._id,
  candidateName: 'John Doe',
  sessionId: 'session-123',
  status: 'in_progress'
});
```

## Database Connection

The database connection is configured in `src/config/database.ts` and automatically connects when the server starts.

Make sure to set `MONGODB_URI` or `MONGO_URI` in your `.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/proctor-mvp
```

## Validation

All models include:
- Required field validation
- Type validation
- Custom validators for business logic
- Indexes for performance
- Timestamps (createdAt, updatedAt) where applicable

## Relationships

- **Test** → **Recruiter** (many-to-one via `recruiterId` and `createdBy`)
- **Test** → **Question** (one-to-many via `questions` array)
- **CandidateSession** → **Test** (many-to-one via `testId`)
- **CandidateSession** → **Answer** (one-to-many via `answers` array)
- **CandidateSession** → **RedFlag** (one-to-many via `redFlags` array)
- **Answer** → **Question** (many-to-one via `questionId`)
- **RedFlag** → **CandidateSession** (many-to-one via `sessionId`)

