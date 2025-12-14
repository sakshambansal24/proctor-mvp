import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Test {
  _id: string;
  title: string;
  description: string;
  durationMinutes: number;
  startTime?: string;
  endTime?: string;
  enableScreenMonitoring?: boolean; // Optional: Enable screen sharing monitoring
  questions: Question[];
}

export interface Question {
  _id: string;
  text: string;
  options: { key: string; label: string }[];
  marks: number;
  // Note: correctOption is NOT included for candidates
}

export interface SessionStartResponse {
  sessionId: string;
  sessionToken: string;
  testId: string;
  startedAt: string;
  durationMinutes: number;
}

@Injectable({
  providedIn: 'root'
})
export class CandidateService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get headers with session token for authenticated requests
   */
  private getHeaders(sessionToken?: string): HttpHeaders {
    // Get session token from parameter or localStorage
    const token = sessionToken || localStorage.getItem('sessionToken');
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    });
    return headers;
  }

  /**
   * Get test by testLinkId
   */
  getTestByLink(testLinkId: string): Observable<{ success: boolean; data: Test }> {
    return this.http.get<{ success: boolean; data: Test }>(
      `${this.apiUrl}/test/${testLinkId}`
    );
  }

  /**
   * Start a test session
   */
  startTest(testLinkId: string, candidateName?: string): Observable<{ success: boolean; data: SessionStartResponse; message: string }> {
    return this.http.post<{ success: boolean; data: SessionStartResponse; message: string }>(
      `${this.apiUrl}/test/${testLinkId}/start`,
      { candidateName: candidateName || undefined }
    );
  }

  /**
   * Submit an answer
   * Requires: Session token in Authorization header
   */
  submitAnswer(sessionId: string, questionId: string, selectedOption: string, sessionToken?: string): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/test/${sessionId}/answer`,
      { questionId, selectedOption },
      { headers: this.getHeaders(sessionToken) }
    );
  }

  /**
   * Submit the test
   * Requires: Session token in Authorization header
   */
  submitTest(sessionId: string, sessionToken?: string): Observable<{ success: boolean; data: any; message: string }> {
    return this.http.post<{ success: boolean; data: any; message: string }>(
      `${this.apiUrl}/test/${sessionId}/submit`,
      {},
      { headers: this.getHeaders(sessionToken) }
    );
  }

  /**
   * Compute score for a test session
   * Requires: Session token in Authorization header
   */
  computeScore(sessionId: string, sessionToken?: string): Observable<{ success: boolean; data: any; message: string }> {
    return this.http.post<{ success: boolean; data: any; message: string }>(
      `${this.apiUrl}/test/${sessionId}/compute-score`,
      {},
      { headers: this.getHeaders(sessionToken) }
    );
  }
}

