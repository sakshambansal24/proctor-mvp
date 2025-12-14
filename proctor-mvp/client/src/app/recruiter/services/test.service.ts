import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    recruiterId: string;
    email: string;
    name: string;
    token: string;
  };
}

export interface Test {
  _id?: string;
  title: string;
  description: string;
  durationMinutes: number;
  startTime?: string;
  endTime?: string;
  published: boolean;
  questions: string[];
  testLinkId?: string;
  createdBy?: string;
  recruiterId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Question {
  _id?: string;
  testId?: string;
  text: string;
  options: { key: string; label: string }[];
  correctOption: string;
  marks: number;
}

export interface RedFlagTimelineItem {
  type: string;
  timestamp: string;
  details?: string;
  snapshotUrl?: string; // Optional: URL to snapshot image if stored
}

export interface SessionReport {
  _id: string;
  candidateName?: string;
  sessionId: string;
  status: string;
  score: number;
  totalMarks: number;
  scorePercent?: number;
  totalCorrect?: number;
  totalQuestions?: number;
  timeTaken?: number;
  startedAt: string;
  endedAt?: string;
  redFlagCount: number;
  redFlagCounts: Record<string, number>;
  redFlagTimeline: RedFlagTimelineItem[];
}

export interface TestReport {
  test: {
    _id: string;
    title: string;
    description: string;
    durationMinutes: number;
    published: boolean;
    testLinkId: string;
    questionCount: number;
  };
  sessions: SessionReport[];
  summary: {
    totalSessions: number;
    completed: number;
    inProgress: number;
    autoFailed: number;
    failedDueToProctoring?: number;
    totalRedFlags: number;
  };
}

export interface SessionAnswer {
  _id: string;
  questionId: {
    _id: string;
    text: string;
    options: { key: string; label: string }[];
    correctOption: string;
    marks: number;
  };
  selectedOption: string;
  isCorrect: boolean;
  timeAnswered?: string;
}

export interface SessionDetail {
  session: SessionReport;
  answers: SessionAnswer[];
}

export interface Snapshot {
  _id: string;
  image: string; // Base64 encoded image
  timestamp: string;
  priority: 'low' | 'normal' | 'high';
  eventType?: string;
  mimeType: string;
  imageSize: number;
  createdAt: string;
}

export interface SnapshotsResponse {
  sessionId: string;
  count: number;
  total: number;
  snapshots: Snapshot[];
}

export interface PublishResponse {
  testLinkId: string;
  testLink: string;
  published: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TestService {
  private apiUrl = `${environment.apiUrl}/recruiter`;
  private token: string | null = null;

  constructor(private http: HttpClient) {
    // Get token from localStorage or set it
    this.token = localStorage.getItem('recruiter_token');
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('recruiter_token', token);
  }

  /**
   * Register a new recruiter account
   */
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/register`,
      data,
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    );
  }

  /**
   * Login with email and password
   */
  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      data,
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    );
  }

  private getHeaders(): HttpHeaders {
    // Always read from localStorage to get the latest token
    const token = localStorage.getItem('recruiter_token') || this.token;
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    });
    return headers;
  }

  /**
   * Create a new test
   */
  createTest(testData: {
    title: string;
    description: string;
    durationMinutes: number;
    startTime?: string;
    endTime?: string;
  }): Observable<{ success: boolean; data: Test; message: string }> {
    return this.http.post<{ success: boolean; data: Test; message: string }>(
      `${this.apiUrl}/tests`,
      testData,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get all tests for the recruiter
   */
  getTests(): Observable<{ success: boolean; data: Test[] }> {
    // Note: This endpoint needs to be implemented in backend
    // For now, we'll use a placeholder
    return this.http.get<{ success: boolean; data: Test[] }>(
      `${this.apiUrl}/tests`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get a single test by ID
   */
  getTest(testId: string): Observable<{ success: boolean; data: Test }> {
    return this.http.get<{ success: boolean; data: Test }>(
      `${this.apiUrl}/tests/${testId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Update a test
   */
  updateTest(testId: string, testData: Partial<Test>): Observable<{ success: boolean; data: Test; message: string }> {
    return this.http.put<{ success: boolean; data: Test; message: string }>(
      `${this.apiUrl}/tests/${testId}`,
      testData,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Delete a test
   */
  deleteTest(testId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/tests/${testId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Publish a test
   */
  publishTest(testId: string): Observable<{ success: boolean; data: PublishResponse; message: string }> {
    return this.http.post<{ success: boolean; data: PublishResponse; message: string }>(
      `${this.apiUrl}/tests/${testId}/publish`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Unpublish a test (allows editing again)
   */
  unpublishTest(testId: string): Observable<{ success: boolean; data: { _id: string; published: boolean }; message: string }> {
    return this.http.post<{ success: boolean; data: { _id: string; published: boolean }; message: string }>(
      `${this.apiUrl}/tests/${testId}/unpublish`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Save questions for a test
   */
  saveQuestions(testId: string, questions: Question[]): Observable<{ success: boolean; data: { questionIds: string[] }; message: string }> {
    return this.http.post<{ success: boolean; data: { questionIds: string[] }; message: string }>(
      `${this.apiUrl}/tests/${testId}/questions`,
      { questions },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get test report with candidate sessions
   */
  getTestReport(testId: string): Observable<{ success: boolean; data: TestReport }> {
    return this.http.get<{ success: boolean; data: TestReport }>(
      `${this.apiUrl}/tests/${testId}/report`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get session details with answers
   */
  getSessionDetail(testId: string, sessionId: string): Observable<{ success: boolean; data: SessionDetail }> {
    return this.http.get<{ success: boolean; data: SessionDetail }>(
      `${this.apiUrl}/tests/${testId}/sessions/${sessionId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get snapshots for a session
   */
  getSessionSnapshots(
    testId: string, 
    sessionId: string, 
    options?: { priority?: string; eventType?: string; limit?: number; skip?: number }
  ): Observable<{ success: boolean; data: SnapshotsResponse }> {
    let url = `${this.apiUrl}/tests/${testId}/sessions/${sessionId}/snapshots`;
    const params = new URLSearchParams();
    
    if (options?.priority) {
      params.append('priority', options.priority);
    }
    if (options?.eventType) {
      params.append('eventType', options.eventType);
    }
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }
    if (options?.skip) {
      params.append('skip', options.skip.toString());
    }
    
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    return this.http.get<{ success: boolean; data: SnapshotsResponse }>(
      url,
      { headers: this.getHeaders() }
    );
  }
}

