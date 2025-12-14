# GitHub Issues - MVP Sprints 1 & 2

## Sprint 1: Foundation & Test Creation (MVP Part 1)

---

### Issue #1: Project Scaffolding - Repository Structure & Development Environment
**Labels:** `setup`, `infrastructure`, `MVP`, `backend`, `frontend`  
**Assignee:** Backend Dev / Frontend Dev  
**Priority:** High  
**Estimated Time:** 4-6 hours

#### Description
Set up the monorepo structure and development environment for the proctored test platform.

#### Tasks
- [ ] Create monorepo structure (backend/, frontend/)
- [ ] Initialize Node.js project with Express in backend/
- [ ] Initialize Angular 14+ project in frontend/
- [ ] Set up root .gitignore
- [ ] Configure environment variables (.env files)
- [ ] Set up CORS middleware for frontend-backend communication
- [ ] Configure npm scripts for concurrent dev servers
- [ ] Set up nodemon for backend hot-reload
- [ ] Create basic README with setup instructions

#### Acceptance Criteria
- ✅ Repository structure created (backend/, frontend/)
- ✅ Backend server runs on port 3000 (or configured port)
- ✅ Frontend Angular app runs on port 4200
- ✅ Both servers can run concurrently
- ✅ Basic CORS configured
- ✅ Environment variables properly configured
- ✅ Git repository initialized

#### Dependencies
None

---

### Issue #2: Database Schema - MongoDB Models
**Labels:** `database`, `backend`, `MVP`, `schema`  
**Assignee:** Backend Dev  
**Priority:** High  
**Estimated Time:** 3-4 hours

#### Description
Create MongoDB models using Mongoose for Test, Question, TestSession, and RedFlag entities.

#### Tasks
- [ ] Create Test model with schema (title, description, duration, startTime, endTime, questions[], recruiterToken, testLink, isPublished, createdAt)
- [ ] Create Question schema (questionText, options[], correctAnswer, points, questionType) - embedded in Test
- [ ] Create TestSession model (testId, candidateName, sessionToken, startTime, endTime, submittedAt, status, answers[], redFlags[])
- [ ] Create RedFlag schema (flagType, timestamp, metadata) - embedded in TestSession
- [ ] Add indexes for testLink and sessionToken
- [ ] Add validation rules for all fields
- [ ] Test model creation and queries

#### Acceptance Criteria
- ✅ All Mongoose models created and exported
- ✅ Schema validation working (required fields, types)
- ✅ Indexes created for frequently queried fields
- ✅ Can create, read, update documents in MongoDB
- ✅ Relationships between models properly defined

#### Dependencies
- Issue #1 (Project Scaffolding)

---

### Issue #3: MongoDB Connection & Database Configuration
**Labels:** `database`, `backend`, `MVP`, `infrastructure`  
**Assignee:** Backend Dev  
**Priority:** High  
**Estimated Time:** 1 hour

#### Description
Set up MongoDB connection using Mongoose and configure database connection settings.

#### Tasks
- [ ] Install mongoose dependency
- [ ] Create database configuration file
- [ ] Set up MongoDB connection with error handling
- [ ] Add connection retry logic
- [ ] Test connection on server startup
- [ ] Add connection status logging

#### Acceptance Criteria
- ✅ MongoDB connection established on server start
- ✅ Connection errors handled gracefully
- ✅ Connection retry logic working
- ✅ Connection status logged appropriately

#### Dependencies
- Issue #1 (Project Scaffolding)
- Issue #2 (Database Schema)

---

### Issue #4: Backend API - Test CRUD Operations
**Labels:** `backend`, `API`, `MVP`, `test-creation`  
**Assignee:** Backend Dev  
**Priority:** High  
**Estimated Time:** 4-5 hours

#### Description
Implement REST API endpoints for test creation, retrieval, update, and deletion.

#### Tasks
- [ ] Create test controller
- [ ] Implement `POST /api/tests` - Create test (with recruiter token)
- [ ] Implement `GET /api/tests/:id` - Get test details
- [ ] Implement `GET /api/tests` - List tests (recruiter only)
- [ ] Implement `PUT /api/tests/:id` - Update test
- [ ] Implement `DELETE /api/tests/:id` - Delete test
- [ ] Add input validation middleware
- [ ] Add error handling
- [ ] Write API tests

#### Acceptance Criteria
- ✅ All test CRUD endpoints working
- ✅ Proper HTTP status codes returned
- ✅ Input validation working
- ✅ Error handling implemented
- ✅ API responses follow consistent format
- ✅ Can create test with basic details

#### Dependencies
- Issue #2 (Database Schema)
- Issue #3 (MongoDB Connection)

---

### Issue #5: Backend API - Question Management
**Labels:** `backend`, `API`, `MVP`, `test-creation`  
**Assignee:** Backend Dev  
**Priority:** High  
**Estimated Time:** 2 hours

#### Description
Implement API endpoints to add, update, and delete questions within a test.

#### Tasks
- [ ] Implement `POST /api/tests/:id/questions` - Add question to test
- [ ] Implement `PUT /api/tests/:id/questions/:qId` - Update question
- [ ] Implement `DELETE /api/tests/:id/questions/:qId` - Delete question
- [ ] Validate question format (MCQ with options and correct answer)
- [ ] Add error handling for invalid question operations

#### Acceptance Criteria
- ✅ Can add questions to a test
- ✅ Can update existing questions
- ✅ Can delete questions from a test
- ✅ Question validation working (MCQ format)
- ✅ Proper error messages for invalid operations

#### Dependencies
- Issue #4 (Test CRUD Operations)

---

### Issue #6: Backend API - Test Publishing & Link Generation
**Labels:** `backend`, `API`, `MVP`, `test-creation`  
**Assignee:** Backend Dev  
**Priority:** High  
**Estimated Time:** 1.5 hours

#### Description
Implement test publishing functionality and generate unique shareable test links.

#### Tasks
- [ ] Implement `POST /api/tests/:id/publish` - Publish test
- [ ] Generate unique test link (UUID or short code)
- [ ] Implement `GET /api/tests/link/:testLink` - Validate and get test by link
- [ ] Update test status to published
- [ ] Add link expiration logic (optional)

#### Acceptance Criteria
- ✅ Can publish a test
- ✅ Unique test link generated for each test
- ✅ Test link is shareable and accessible
- ✅ Can retrieve test details using test link
- ✅ Unpublished tests are not accessible via link

#### Dependencies
- Issue #4 (Test CRUD Operations)

---

### Issue #7: Backend API - Recruiter Token Authentication
**Labels:** `backend`, `authentication`, `MVP`, `security`  
**Assignee:** Backend Dev  
**Priority:** High  
**Estimated Time:** 1.5 hours

#### Description
Implement passwordless token-based authentication for recruiters.

#### Tasks
- [ ] Create token generation utility
- [ ] Create authentication middleware
- [ ] Implement token validation
- [ ] Protect recruiter endpoints with auth middleware
- [ ] Add token expiration logic (optional)
- [ ] Create endpoint to generate recruiter token (optional)

#### Acceptance Criteria
- ✅ Recruiter token generation working
- ✅ Token validation middleware working
- ✅ Protected endpoints require valid token
- ✅ Invalid tokens return 401 Unauthorized
- ✅ Token can be passed via header or query param

#### Dependencies
- Issue #4 (Test CRUD Operations)

---

### Issue #8: Frontend - Recruiter Module Setup
**Labels:** `frontend`, `recruiter`, `MVP`, `setup`  
**Assignee:** Frontend Dev  
**Priority:** High  
**Estimated Time:** 1.5 hours

#### Description
Set up Angular module structure for recruiter dashboard.

#### Tasks
- [ ] Create recruiter module
- [ ] Set up recruiter routing
- [ ] Create recruiter service for API calls
- [ ] Create recruiter layout component
- [ ] Set up HTTP interceptor for API calls
- [ ] Configure base API URL

#### Acceptance Criteria
- ✅ Recruiter module created
- ✅ Routing configured
- ✅ Service can make API calls to backend
- ✅ Layout component renders
- ✅ API base URL configured

#### Dependencies
- Issue #1 (Project Scaffolding)

---

### Issue #9: Frontend - Test Creation Form Component
**Labels:** `frontend`, `recruiter`, `MVP`, `test-creation`, `UI`  
**Assignee:** Frontend Dev  
**Priority:** High  
**Estimated Time:** 4 hours

#### Description
Create Angular component for recruiters to create tests with title, description, and duration.

#### Tasks
- [ ] Create test creation form component
- [ ] Add form fields: title, description, duration (minutes)
- [ ] Implement form validation
- [ ] Add submit handler
- [ ] Integrate with backend API
- [ ] Add loading states
- [ ] Add success/error notifications
- [ ] Basic styling

#### Acceptance Criteria
- ✅ Form displays all required fields
- ✅ Form validation working
- ✅ Can create test via form
- ✅ Success message shown after creation
- ✅ Error handling for failed requests
- ✅ Form resets after successful creation

#### Dependencies
- Issue #4 (Test CRUD Operations)
- Issue #8 (Recruiter Module Setup)

---

### Issue #10: Frontend - Question Builder Component
**Labels:** `frontend`, `recruiter`, `MVP`, `test-creation`, `UI`  
**Assignee:** Frontend Dev  
**Priority:** High  
**Estimated Time:** 3 hours

#### Description
Create component for adding, editing, and deleting MCQ questions within a test.

#### Tasks
- [ ] Create question builder component
- [ ] Add question form (question text, 4 options, correct answer selection)
- [ ] Implement add question functionality
- [ ] Implement edit question functionality
- [ ] Implement delete question functionality
- [ ] Validate question format
- [ ] Display list of added questions
- [ ] Basic styling

#### Acceptance Criteria
- ✅ Can add multiple questions to a test
- ✅ Can edit existing questions
- ✅ Can delete questions
- ✅ Question validation working (all fields required)
- ✅ Correct answer must be selected
- ✅ Questions displayed in list format

#### Dependencies
- Issue #5 (Question Management API)
- Issue #9 (Test Creation Form)

---

### Issue #11: Frontend - Test List & Management Component
**Labels:** `frontend`, `recruiter`, `MVP`, `UI`  
**Assignee:** Frontend Dev  
**Priority:** Medium  
**Estimated Time:** 2.5 hours

#### Description
Create component to display list of created tests with actions (edit, delete, publish).

#### Tasks
- [ ] Create test list component
- [ ] Fetch and display all tests
- [ ] Add edit action
- [ ] Add delete action with confirmation
- [ ] Add publish action
- [ ] Display test status (published/unpublished)
- [ ] Basic styling and layout

#### Acceptance Criteria
- ✅ All tests displayed in list
- ✅ Can edit test
- ✅ Can delete test with confirmation
- ✅ Can publish test
- ✅ Test status displayed correctly
- ✅ Actions work correctly

#### Dependencies
- Issue #4 (Test CRUD Operations)
- Issue #6 (Test Publishing)
- Issue #8 (Recruiter Module Setup)

---

### Issue #12: Frontend - Test Link Display & Sharing
**Labels:** `frontend`, `recruiter`, `MVP`, `UI`  
**Assignee:** Frontend Dev  
**Priority:** Medium  
**Estimated Time:** 1.5 hours

#### Description
Display generated test link and enable copying to clipboard.

#### Tasks
- [ ] Create test link display component
- [ ] Show test link after publishing
- [ ] Implement copy to clipboard functionality
- [ ] Add visual feedback for copy action
- [ ] Display full URL for sharing

#### Acceptance Criteria
- ✅ Test link displayed after publishing
- ✅ Can copy link to clipboard
- ✅ Visual feedback shown on copy
- ✅ Link is clickable and opens in new tab

#### Dependencies
- Issue #6 (Test Publishing)
- Issue #11 (Test List Component)

---

## Sprint 2: Proctoring, Scoring & Reporting (MVP Part 2)

---

### Issue #13: Backend API - Test Session Management
**Labels:** `backend`, `API`, `MVP`, `session`, `candidate`  
**Assignee:** Backend Dev  
**Priority:** High  
**Estimated Time:** 3 hours

#### Description
Implement API endpoints for starting test sessions and managing session state.

#### Tasks
- [ ] Implement `POST /api/sessions/start` - Start test session (with test link and candidate name)
- [ ] Generate unique session token
- [ ] Implement `GET /api/sessions/:sessionId` - Get session details
- [ ] Implement `GET /api/sessions/:sessionId/status` - Get session status
- [ ] Validate test link and test availability
- [ ] Set session start time
- [ ] Add session expiration logic

#### Acceptance Criteria
- ✅ Can start test session with valid test link
- ✅ Session token generated and returned
- ✅ Session details retrievable
- ✅ Invalid test links rejected
- ✅ Session state properly tracked

#### Dependencies
- Issue #2 (Database Schema)
- Issue #6 (Test Publishing)

---

### Issue #14: Backend API - Answer Submission
**Labels:** `backend`, `API`, `MVP`, `session`, `candidate`  
**Assignee:** Backend Dev  
**Priority:** High  
**Estimated Time:** 2 hours

#### Description
Implement API to save and update candidate answers during test.

#### Tasks
- [ ] Implement `POST /api/sessions/:sessionId/answers` - Save/update answers
- [ ] Validate answer format
- [ ] Check time constraints (within test duration)
- [ ] Store answers in session
- [ ] Support partial answer saving

#### Acceptance Criteria
- ✅ Can save answers during test
- ✅ Can update existing answers
- ✅ Answers validated against question format
- ✅ Time constraints enforced
- ✅ Answers stored correctly in database

#### Dependencies
- Issue #13 (Session Management)

---

### Issue #15: Backend API - Test Submission
**Labels:** `backend`, `API`, `MVP`, `session`, `scoring`  
**Assignee:** Backend Dev  
**Priority:** High  
**Estimated Time:** 2 hours

#### Description
Implement endpoint to submit completed test and trigger scoring.

#### Tasks
- [ ] Implement `POST /api/sessions/:sessionId/submit` - Submit test
- [ ] Validate session is active
- [ ] Set submission timestamp
- [ ] Update session status to 'submitted'
- [ ] Trigger scoring process
- [ ] Prevent multiple submissions

#### Acceptance Criteria
- ✅ Can submit test session
- ✅ Submission timestamp recorded
- ✅ Session status updated to 'submitted'
- ✅ Multiple submissions prevented
- ✅ Scoring triggered on submission

#### Dependencies
- Issue #14 (Answer Submission)
- Issue #16 (Scoring System)

---

### Issue #16: Backend API - Scoring System
**Labels:** `backend`, `API`, `MVP`, `scoring`  
**Assignee:** Backend Dev  
**Priority:** High  
**Estimated Time:** 3 hours

#### Description
Implement automatic scoring system for MCQ answers.

#### Tasks
- [ ] Create scoring service
- [ ] Implement MCQ answer evaluation
- [ ] Calculate total score and percentage
- [ ] Apply red flag penalties (optional: 5+ flags = auto fail)
- [ ] Store results in session
- [ ] Calculate time taken

#### Acceptance Criteria
- ✅ MCQ answers auto-evaluated correctly
- ✅ Score calculated accurately (correct/total)
- ✅ Percentage calculated correctly
- ✅ Time taken calculated
- ✅ Results stored with all metadata
- ✅ Red flag penalties applied (if implemented)

#### Dependencies
- Issue #15 (Test Submission)
- Issue #19 (Red Flag Logging)

---

### Issue #17: Backend API - Red Flag Logging
**Labels:** `backend`, `API`, `MVP`, `proctoring`, `red-flags`  
**Assignee:** Backend Dev  
**Priority:** High  
**Estimated Time:** 2 hours

#### Description
Implement API endpoint to log proctoring red flags during test session.

#### Tasks
- [ ] Implement `POST /api/sessions/:sessionId/red-flags` - Log red flag
- [ ] Store flag type, timestamp, metadata
- [ ] Validate flag types (camera-off, screen-share-off, tab-switch)
- [ ] Store flags in session document
- [ ] Add flag count tracking

#### Acceptance Criteria
- ✅ Can log red flags via API
- ✅ Flag type, timestamp, and metadata stored
- ✅ Flags associated with correct session
- ✅ Flag count tracked
- ✅ Multiple flags can be logged

#### Dependencies
- Issue #13 (Session Management)

---

### Issue #18: Socket.IO Server Setup
**Labels:** `backend`, `websocket`, `MVP`, `proctoring`, `real-time`  
**Assignee:** Backend Dev  
**Priority:** High  
**Estimated Time:** 2 hours

#### Description
Set up Socket.IO server for real-time proctoring events.

#### Tasks
- [ ] Install and configure Socket.IO
- [ ] Create Socket.IO server instance
- [ ] Set up namespace for proctoring events
- [ ] Implement room management per session
- [ ] Handle connection/disconnection
- [ ] Test Socket.IO connection

#### Acceptance Criteria
- ✅ Socket.IO server running
- ✅ Clients can connect to server
- ✅ Room management working
- ✅ Connection/disconnection handled
- ✅ Server ready for real-time events

#### Dependencies
- Issue #1 (Project Scaffolding)

---

### Issue #19: Backend - Real-time Red Flag Broadcasting
**Labels:** `backend`, `websocket`, `MVP`, `proctoring`, `real-time`  
**Assignee:** Backend Dev  
**Priority:** High  
**Estimated Time:** 1.5 hours

#### Description
Implement Socket.IO events for real-time red flag broadcasting to recruiters.

#### Tasks
- [ ] Create 'red-flag' event handler
- [ ] Broadcast red flags to recruiter dashboard
- [ ] Emit session status updates
- [ ] Handle time warnings
- [ ] Test real-time flag broadcasting

#### Acceptance Criteria
- ✅ Red flags broadcasted in real-time
- ✅ Recruiters receive live flag updates
- ✅ Session status updates broadcasted
- ✅ Events properly formatted

#### Dependencies
- Issue #17 (Red Flag Logging)
- Issue #18 (Socket.IO Setup)

---

### Issue #20: Frontend - Candidate Module Setup
**Labels:** `frontend`, `candidate`, `MVP`, `setup`  
**Assignee:** Frontend Dev  
**Priority:** High  
**Estimated Time:** 1.5 hours

#### Description
Set up Angular module structure for candidate test interface.

#### Tasks
- [ ] Create candidate module
- [ ] Set up candidate routing
- [ ] Create candidate service for API calls
- [ ] Set up Socket.IO client service
- [ ] Configure test link parameter handling

#### Acceptance Criteria
- ✅ Candidate module created
- ✅ Routing configured
- ✅ Service can make API calls
- ✅ Socket.IO client configured
- ✅ Can handle test link parameter

#### Dependencies
- Issue #1 (Project Scaffolding)

---

### Issue #21: Frontend - Test Entry Page
**Labels:** `frontend`, `candidate`, `MVP`, `UI`  
**Assignee:** Frontend Dev  
**Priority:** High  
**Estimated Time:** 2 hours

#### Description
Create landing page where candidates enter test link and their name.

#### Tasks
- [ ] Create test entry component
- [ ] Add test link input field
- [ ] Add candidate name input field
- [ ] Implement form validation
- [ ] Add "Start Test" button
- [ ] Integrate with session start API
- [ ] Display pre-test instructions
- [ ] Basic styling

#### Acceptance Criteria
- ✅ Form displays test link and name fields
- ✅ Form validation working
- ✅ Can start test session
- ✅ Session token received and stored
- ✅ Redirects to test interface after start

#### Dependencies
- Issue #13 (Session Management)
- Issue #20 (Candidate Module Setup)

---

### Issue #22: Frontend - Test Taking Interface
**Labels:** `frontend`, `candidate`, `MVP`, `UI`, `test-taking`  
**Assignee:** Frontend Dev  
**Priority:** High  
**Estimated Time:** 4 hours

#### Description
Create interface for candidates to view and answer test questions.

#### Tasks
- [ ] Create test taking component
- [ ] Display questions (one by one or all at once)
- [ ] Implement MCQ option selection (radio buttons)
- [ ] Add navigation between questions
- [ ] Implement answer selection and persistence
- [ ] Auto-save answers (optional)
- [ ] Display question numbers
- [ ] Basic styling

#### Acceptance Criteria
- ✅ Questions displayed correctly
- ✅ Can select MCQ options
- ✅ Answers saved to backend
- ✅ Can navigate between questions
- ✅ Selected answers persist
- ✅ UI is clear and usable

#### Dependencies
- Issue #14 (Answer Submission)
- Issue #21 (Test Entry Page)

---

### Issue #23: Frontend - Timer Component
**Labels:** `frontend`, `candidate`, `MVP`, `UI`, `timer`  
**Assignee:** Frontend Dev  
**Priority:** High  
**Estimated Time:** 2 hours

#### Description
Create countdown timer component that displays remaining time and auto-submits on expiry.

#### Tasks
- [ ] Create timer component
- [ ] Calculate remaining time from test duration
- [ ] Display countdown (MM:SS format)
- [ ] Add warning when time running low (< 5 minutes)
- [ ] Implement auto-submit on time expiry
- [ ] Update timer every second
- [ ] Handle timer completion

#### Acceptance Criteria
- ✅ Timer displays correctly (MM:SS)
- ✅ Timer counts down accurately
- ✅ Warning shown when time low
- ✅ Test auto-submits on expiry
- ✅ Timer updates in real-time

#### Dependencies
- Issue #22 (Test Taking Interface)
- Issue #15 (Test Submission)

---

### Issue #24: Frontend - Submit Test Component
**Labels:** `frontend`, `candidate`, `MVP`, `UI`  
**Assignee:** Frontend Dev  
**Priority:** High  
**Estimated Time:** 1.5 hours

#### Description
Create component for final test submission with confirmation.

#### Tasks
- [ ] Create submit button component
- [ ] Add confirmation dialog
- [ ] Implement submit handler
- [ ] Show submission status (loading)
- [ ] Handle submission success/error
- [ ] Redirect to results after submission

#### Acceptance Criteria
- ✅ Submit button visible
- ✅ Confirmation dialog shown before submit
- ✅ Submission status displayed
- ✅ Redirects to results after success
- ✅ Error handling for failed submission

#### Dependencies
- Issue #15 (Test Submission)
- Issue #22 (Test Taking Interface)

---

### Issue #25: Frontend - Webcam Access & Monitoring
**Labels:** `frontend`, `candidate`, `MVP`, `proctoring`, `webcam`  
**Assignee:** Frontend Dev  
**Priority:** High  
**Estimated Time:** 3 hours

#### Description
Implement webcam access request and monitoring for proctoring.

#### Tasks
- [ ] Request camera permission using getUserMedia
- [ ] Display webcam feed in component
- [ ] Monitor camera state (on/off/denied)
- [ ] Detect camera disconnection
- [ ] Log red flag when camera denied or turned off
- [ ] Handle permission denial gracefully
- [ ] Show camera status indicator

#### Acceptance Criteria
- ✅ Camera permission requested on test start
- ✅ Webcam feed displayed
- ✅ Camera state monitored
- ✅ Red flag logged when camera off/denied
- ✅ Status indicator shows camera state
- ✅ Graceful handling of permission denial

#### Dependencies
- Issue #17 (Red Flag Logging)
- Issue #21 (Test Entry Page)

---

### Issue #26: Frontend - Screen Sharing & Monitoring
**Labels:** `frontend`, `candidate`, `MVP`, `proctoring`, `screen-share`  
**Assignee:** Frontend Dev  
**Priority:** High  
**Estimated Time:** 2.5 hours

#### Description
Implement screen sharing request and monitoring for proctoring.

#### Tasks
- [ ] Request screen share permission using getDisplayMedia
- [ ] Monitor screen share state
- [ ] Detect when screen share stops
- [ ] Log red flag when screen share denied or stopped
- [ ] Handle permission denial gracefully
- [ ] Show screen share status indicator

#### Acceptance Criteria
- ✅ Screen share permission requested
- ✅ Screen share state monitored
- ✅ Red flag logged when screen share stops/denied
- ✅ Status indicator shows screen share state
- ✅ Graceful handling of permission denial

#### Dependencies
- Issue #17 (Red Flag Logging)
- Issue #25 (Webcam Access)

---

### Issue #27: Frontend - Tab Switching Detection
**Labels:** `frontend`, `candidate`, `MVP`, `proctoring`, `tab-detection`  
**Assignee:** Frontend Dev  
**Priority:** High  
**Estimated Time:** 2 hours

#### Description
Implement tab switching and window blur detection using Page Visibility API.

#### Tasks
- [ ] Use Page Visibility API (document.hidden)
- [ ] Listen to visibilitychange event
- [ ] Listen to window blur/focus events
- [ ] Detect tab switches and window minimization
- [ ] Log red flag when tab switch detected
- [ ] Show warning to candidate (optional)
- [ ] Prevent false positives

#### Acceptance Criteria
- ✅ Tab switching detected accurately
- ✅ Window blur detected
- ✅ Red flag logged on tab switch
- ✅ No false positives
- ✅ Works across different browsers

#### Dependencies
- Issue #17 (Red Flag Logging)
- Issue #22 (Test Taking Interface)

---

### Issue #28: Frontend - Socket.IO Client Integration
**Labels:** `frontend`, `websocket`, `MVP`, `proctoring`, `real-time`  
**Assignee:** Frontend Dev  
**Priority:** High  
**Estimated Time:** 2 hours

#### Description
Integrate Socket.IO client for real-time red flag logging and session updates.

#### Tasks
- [ ] Install socket.io-client
- [ ] Create Socket.IO service
- [ ] Connect to Socket.IO server
- [ ] Emit red flag events
- [ ] Handle connection/disconnection
- [ ] Implement reconnection logic
- [ ] Join session room

#### Acceptance Criteria
- ✅ Socket.IO client connected
- ✅ Red flags emitted in real-time
- ✅ Connection errors handled
- ✅ Reconnection logic working
- ✅ Session room joined correctly

#### Dependencies
- Issue #18 (Socket.IO Server)
- Issue #19 (Real-time Broadcasting)
- Issue #20 (Candidate Module Setup)

---

### Issue #29: Frontend - Result Display Component
**Labels:** `frontend`, `candidate`, `MVP`, `UI`, `results`  
**Assignee:** Frontend Dev  
**Priority:** Medium  
**Estimated Time:** 2 hours

#### Description
Create component to display test results after submission.

#### Tasks
- [ ] Create result display component
- [ ] Fetch result data from API
- [ ] Display total score and percentage
- [ ] Display correct/incorrect answer breakdown
- [ ] Show time taken
- [ ] Display red flags count
- [ ] Basic styling

#### Acceptance Criteria
- ✅ Result data fetched and displayed
- ✅ Score and percentage shown correctly
- ✅ Answer breakdown displayed
- ✅ Time taken shown
- ✅ Red flags count displayed
- ✅ UI is clear and readable

#### Dependencies
- Issue #16 (Scoring System)
- Issue #24 (Submit Test)

---

### Issue #30: Backend API - Results Retrieval
**Labels:** `backend`, `API`, `MVP`, `reporting`, `results`  
**Assignee:** Backend Dev  
**Priority:** High  
**Estimated Time:** 2 hours

#### Description
Implement API endpoints to retrieve test results for recruiters and candidates.

#### Tasks
- [ ] Implement `GET /api/tests/:testId/results` - Get all results for a test (recruiter)
- [ ] Implement `GET /api/sessions/:sessionId/result` - Get individual result
- [ ] Include: score, time taken, red flags count, answer breakdown
- [ ] Add authentication for recruiter endpoint
- [ ] Format response data

#### Acceptance Criteria
- ✅ Recruiter can view all candidate results
- ✅ Individual result retrievable
- ✅ All result data included (score, time, flags, answers)
- ✅ Proper authentication on recruiter endpoint
- ✅ Response format consistent

#### Dependencies
- Issue #16 (Scoring System)
- Issue #7 (Recruiter Authentication)

---

### Issue #31: Frontend - Recruiter Results Dashboard
**Labels:** `frontend`, `recruiter`, `MVP`, `UI`, `reporting`  
**Assignee:** Frontend Dev  
**Priority:** High  
**Estimated Time:** 3 hours

#### Description
Create dashboard component for recruiters to view all candidate results.

#### Tasks
- [ ] Create results dashboard component
- [ ] Fetch all results for a test
- [ ] Display results in table/list format
- [ ] Show: candidate name, score, time taken, red flags count, status
- [ ] Add click to view detailed result
- [ ] Add filters (by status, by score range)
- [ ] Basic styling

#### Acceptance Criteria
- ✅ All candidate results displayed
- ✅ Results table shows key information
- ✅ Can view detailed result
- ✅ Filters working
- ✅ UI is organized and clear

#### Dependencies
- Issue #30 (Results Retrieval API)
- Issue #11 (Test List Component)

---

### Issue #32: Frontend - Detailed Result View
**Labels:** `frontend`, `recruiter`, `MVP`, `UI`, `reporting`  
**Assignee:** Frontend Dev  
**Priority:** Medium  
**Estimated Time:** 2 hours

#### Description
Create component to display detailed result view with answer breakdown and red flags.

#### Tasks
- [ ] Create detailed result component
- [ ] Display candidate information
- [ ] Show answer breakdown (question, selected answer, correct answer)
- [ ] Display red flags with timestamps
- [ ] Show time taken and score details
- [ ] Basic styling

#### Acceptance Criteria
- ✅ Detailed result data displayed
- ✅ Answer breakdown shown clearly
- ✅ Red flags listed with timestamps
- ✅ All result information visible
- ✅ UI is readable and organized

#### Dependencies
- Issue #30 (Results Retrieval API)
- Issue #31 (Results Dashboard)

---

### Issue #33: Frontend - Recruiter Live Monitoring (Optional)
**Labels:** `frontend`, `recruiter`, `MVP`, `real-time`, `monitoring`  
**Assignee:** Frontend Dev  
**Priority:** Low  
**Estimated Time:** 2 hours

#### Description
Create live monitoring view for recruiters to see active sessions and real-time red flags.

#### Tasks
- [ ] Create live monitoring component
- [ ] Connect to Socket.IO
- [ ] Display active sessions list
- [ ] Show real-time red flags feed
- [ ] Update session status in real-time
- [ ] Basic styling

#### Acceptance Criteria
- ✅ Active sessions displayed
- ✅ Real-time red flags shown
- ✅ Session status updates live
- ✅ UI updates without refresh

#### Dependencies
- Issue #19 (Real-time Broadcasting)
- Issue #28 (Socket.IO Client)
- Issue #31 (Results Dashboard)

---

### Issue #34: Error Handling & User Feedback
**Labels:** `frontend`, `backend`, `MVP`, `UX`, `error-handling`  
**Assignee:** Frontend Dev / Backend Dev  
**Priority:** Medium  
**Estimated Time:** 2 hours

#### Description
Implement comprehensive error handling and user feedback across the application.

#### Tasks
- [ ] Create error handling service (frontend)
- [ ] Add error toast/notification component
- [ ] Handle API errors gracefully
- [ ] Add loading states for async operations
- [ ] Improve error messages
- [ ] Add success notifications

#### Acceptance Criteria
- ✅ Errors displayed to users clearly
- ✅ Loading states shown during API calls
- ✅ Success messages displayed
- ✅ Network errors handled gracefully
- ✅ User-friendly error messages

#### Dependencies
- All previous issues

---

### Issue #35: Basic Styling & Responsive Design
**Labels:** `frontend`, `MVP`, `UI`, `styling`  
**Assignee:** Frontend Dev  
**Priority:** Medium  
**Estimated Time:** 3 hours

#### Description
Apply basic styling and ensure responsive design across components.

#### Tasks
- [ ] Add basic CSS/styling framework (Bootstrap/Material/Tailwind)
- [ ] Style recruiter dashboard components
- [ ] Style candidate test interface
- [ ] Ensure responsive design (mobile/tablet/desktop)
- [ ] Improve overall UI/UX
- [ ] Add consistent color scheme

#### Acceptance Criteria
- ✅ Application is visually appealing
- ✅ Responsive on different screen sizes
- ✅ Consistent styling across components
- ✅ UI is professional and clean

#### Dependencies
- All frontend issues

---

## Sprint Summary

### Sprint 1 Issues (12 issues)
- **Foundation**: #1, #2, #3
- **Backend APIs**: #4, #5, #6, #7
- **Frontend Recruiter**: #8, #9, #10, #11, #12

**Focus**: Test creation and management

### Sprint 2 Issues (23 issues)
- **Backend APIs**: #13, #14, #15, #16, #17, #18, #19, #30
- **Frontend Candidate**: #20, #21, #22, #23, #24, #25, #26, #27, #28, #29
- **Frontend Recruiter**: #31, #32, #33
- **Polish**: #34, #35

**Focus**: Proctoring, scoring, and reporting

---

## Labels Legend

- `MVP` - Minimum Viable Product feature
- `backend` - Backend development
- `frontend` - Frontend development
- `API` - REST API endpoint
- `websocket` - Socket.IO/WebSocket feature
- `database` - Database/model related
- `proctoring` - Proctoring feature
- `test-creation` - Test creation feature
- `scoring` - Scoring system
- `reporting` - Reporting/results feature
- `UI` - User interface component
- `authentication` - Authentication/security
- `real-time` - Real-time features
- `setup` - Setup/infrastructure
- `UX` - User experience
- `styling` - Styling/design

---

## Priority Levels

- **High**: Critical for MVP, blocks other features
- **Medium**: Important but not blocking
- **Low**: Nice to have, optional

---

## Estimated Total Time

- **Sprint 1**: ~30-35 hours
- **Sprint 2**: ~45-50 hours
- **Total MVP**: ~75-85 hours

