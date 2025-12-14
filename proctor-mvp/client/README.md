# Proctor MVP - Client

Angular frontend application for the Proctor MVP platform.

## Tech Stack

- **Angular 14+** - Frontend framework
- **TypeScript** - Type-safe code
- **Socket.IO Client** - Real-time communication
- **RxJS** - Reactive programming

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm start
```

The app will be available at http://localhost:4200

## Project Structure

```
client/
├── src/
│   ├── app/
│   │   ├── recruiter/        # Recruiter module
│   │   │   ├── recruiter-dashboard/
│   │   │   ├── test-list/
│   │   │   ├── test-editor/
│   │   │   ├── report/
│   │   │   └── session-detail/
│   │   ├── candidate/         # Candidate module
│   │   │   ├── candidate-landing/
│   │   │   ├── candidate-test/
│   │   │   └── test-result/
│   │   ├── app.component.*
│   │   ├── app.module.ts
│   │   └── app-routing.module.ts
│   ├── environments/          # Environment configuration
│   └── assets/                # Static assets
├── angular.json
├── package.json
└── tsconfig.json
```

## Routes

### Recruiter Module (`/recruiter`)
- `/recruiter/tests` - List all tests
- `/recruiter/create` - Create new test
- `/recruiter/edit/:id` - Edit existing test
- `/recruiter/report/:id` - View test report with candidate sessions
- `/recruiter/report/:testId/session/:sessionId` - View detailed session information

### Candidate Module (`/candidate`)
- `/candidate` - Landing page to enter test link
- `/candidate/test/:testLinkId` - Take test
- `/candidate/result/:sessionId` - View result

## Environment Configuration

### Development (`environment.ts`)
```typescript
apiUrl: 'http://localhost:3000/api'
```

### Production (`environment.prod.ts`)
```typescript
apiUrl: '/api'
```

## Development

- **Angular CLI** - Development server and build tools
- **Hot Reload** - Automatic reload on file changes
- **TypeScript** - Type checking and compilation

## Build

Build for production:
```bash
npm run build
```

Output will be in `dist/proctor-mvp/`

## Components Status

All components are currently placeholders and need implementation:
- Test creation form
- Test list with management
- Test taking interface
- Proctoring features
- Results display
