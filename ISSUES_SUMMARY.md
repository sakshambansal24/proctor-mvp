# GitHub Issues - Quick Summary

## Sprint 1: Foundation & Test Creation (12 issues)

| # | Title | Labels | Priority | Est. Time |
|---|-------|--------|----------|-----------|
| 1 | Project Scaffolding - Repository Structure & Development Environment | `setup`, `infrastructure`, `MVP`, `backend`, `frontend` | High | 4-6h |
| 2 | Database Schema - MongoDB Models | `database`, `backend`, `MVP`, `schema` | High | 3-4h |
| 3 | MongoDB Connection & Database Configuration | `database`, `backend`, `MVP`, `infrastructure` | High | 1h |
| 4 | Backend API - Test CRUD Operations | `backend`, `API`, `MVP`, `test-creation` | High | 4-5h |
| 5 | Backend API - Question Management | `backend`, `API`, `MVP`, `test-creation` | High | 2h |
| 6 | Backend API - Test Publishing & Link Generation | `backend`, `API`, `MVP`, `test-creation` | High | 1.5h |
| 7 | Backend API - Recruiter Token Authentication | `backend`, `authentication`, `MVP`, `security` | High | 1.5h |
| 8 | Frontend - Recruiter Module Setup | `frontend`, `recruiter`, `MVP`, `setup` | High | 1.5h |
| 9 | Frontend - Test Creation Form Component | `frontend`, `recruiter`, `MVP`, `test-creation`, `UI` | High | 4h |
| 10 | Frontend - Question Builder Component | `frontend`, `recruiter`, `MVP`, `test-creation`, `UI` | High | 3h |
| 11 | Frontend - Test List & Management Component | `frontend`, `recruiter`, `MVP`, `UI` | Medium | 2.5h |
| 12 | Frontend - Test Link Display & Sharing | `frontend`, `recruiter`, `MVP`, `UI` | Medium | 1.5h |

**Sprint 1 Total: ~30-35 hours**

---

## Sprint 2: Proctoring, Scoring & Reporting (23 issues)

| # | Title | Labels | Priority | Est. Time |
|---|-------|--------|----------|-----------|
| 13 | Backend API - Test Session Management | `backend`, `API`, `MVP`, `session`, `candidate` | High | 3h |
| 14 | Backend API - Answer Submission | `backend`, `API`, `MVP`, `session`, `candidate` | High | 2h |
| 15 | Backend API - Test Submission | `backend`, `API`, `MVP`, `session`, `scoring` | High | 2h |
| 16 | Backend API - Scoring System | `backend`, `API`, `MVP`, `scoring` | High | 3h |
| 17 | Backend API - Red Flag Logging | `backend`, `API`, `MVP`, `proctoring`, `red-flags` | High | 2h |
| 18 | Socket.IO Server Setup | `backend`, `websocket`, `MVP`, `proctoring`, `real-time` | High | 2h |
| 19 | Backend - Real-time Red Flag Broadcasting | `backend`, `websocket`, `MVP`, `proctoring`, `real-time` | High | 1.5h |
| 20 | Frontend - Candidate Module Setup | `frontend`, `candidate`, `MVP`, `setup` | High | 1.5h |
| 21 | Frontend - Test Entry Page | `frontend`, `candidate`, `MVP`, `UI` | High | 2h |
| 22 | Frontend - Test Taking Interface | `frontend`, `candidate`, `MVP`, `UI`, `test-taking` | High | 4h |
| 23 | Frontend - Timer Component | `frontend`, `candidate`, `MVP`, `UI`, `timer` | High | 2h |
| 24 | Frontend - Submit Test Component | `frontend`, `candidate`, `MVP`, `UI` | High | 1.5h |
| 25 | Frontend - Webcam Access & Monitoring | `frontend`, `candidate`, `MVP`, `proctoring`, `webcam` | High | 3h |
| 26 | Frontend - Screen Sharing & Monitoring | `frontend`, `candidate`, `MVP`, `proctoring`, `screen-share` | High | 2.5h |
| 27 | Frontend - Tab Switching Detection | `frontend`, `candidate`, `MVP`, `proctoring`, `tab-detection` | High | 2h |
| 28 | Frontend - Socket.IO Client Integration | `frontend`, `websocket`, `MVP`, `proctoring`, `real-time` | High | 2h |
| 29 | Frontend - Result Display Component | `frontend`, `candidate`, `MVP`, `UI`, `results` | Medium | 2h |
| 30 | Backend API - Results Retrieval | `backend`, `API`, `MVP`, `reporting`, `results` | High | 2h |
| 31 | Frontend - Recruiter Results Dashboard | `frontend`, `recruiter`, `MVP`, `UI`, `reporting` | High | 3h |
| 32 | Frontend - Detailed Result View | `frontend`, `recruiter`, `MVP`, `UI`, `reporting` | Medium | 2h |
| 33 | Frontend - Recruiter Live Monitoring (Optional) | `frontend`, `recruiter`, `MVP`, `real-time`, `monitoring` | Low | 2h |
| 34 | Error Handling & User Feedback | `frontend`, `backend`, `MVP`, `UX`, `error-handling` | Medium | 2h |
| 35 | Basic Styling & Responsive Design | `frontend`, `MVP`, `UI`, `styling` | Medium | 3h |

**Sprint 2 Total: ~45-50 hours**

---

## MVP Total: ~75-85 hours

---

## Issue Dependencies Map

### Critical Path (Must complete in order):
1. #1 → #2 → #3 → #4 → #5 → #6 → #7
2. #1 → #8 → #9 → #10
3. #2 → #13 → #14 → #15 → #16
4. #13 → #17 → #19
5. #18 → #19 → #28

### Can work in parallel:
- Backend APIs (#4-7) can be done while Frontend setup (#8) is in progress
- Proctoring features (#25-27) can be developed in parallel
- Results API (#30) and Results UI (#31-32) can be done in parallel

---

## Labels Usage Count

- `MVP`: 35 issues
- `backend`: 15 issues
- `frontend`: 20 issues
- `API`: 12 issues
- `proctoring`: 8 issues
- `UI`: 15 issues
- `test-creation`: 6 issues
- `scoring`: 2 issues
- `reporting`: 4 issues
- `websocket`: 4 issues
- `real-time`: 4 issues

---

## Priority Distribution

- **High Priority**: 28 issues (80%)
- **Medium Priority**: 6 issues (17%)
- **Low Priority**: 1 issue (3%)

