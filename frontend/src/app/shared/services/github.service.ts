import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface GitHubContributor {
  username: string;
  name: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
  type: string;
}

interface BackendResponse {
  success: boolean;
  status: number;
  message: string;
  data: GitHubContributor[];
}

@Injectable({
  providedIn: 'root',
})
export class GitHubService {
  private apiUrl = '/api/v1/github';

  constructor(private http: HttpClient) {}

  // Get all contributor data for the MonSTAR project from backend
  getMonstarContributors(): Observable<GitHubContributor[]> {
    return this.http.get<BackendResponse>(`${this.apiUrl}/contributors`).pipe(
      map((response) => {
        if (response.success && response.data) {
          return response.data;
        }
        return this.getFallbackContributors();
      }),
      catchError((error) => {
        console.error('Error fetching contributors from backend:', error);
        return of(this.getFallbackContributors());
      })
    );
  }

  private getFallbackContributors(): GitHubContributor[] {
    return [
      {
        username: 'jenul-ferdinand',
        name: 'Jenul Ferdinand',
        avatar_url: 'https://avatars.githubusercontent.com/u/jenul-ferdinand',
        contributions: 150,
        html_url: 'https://github.com/jenul-ferdinand',
        type: 'User',
      },
      {
        username: 'Rikidink',
        name: 'Ricky Zhang',
        avatar_url: 'https://avatars.githubusercontent.com/u/Rikidink',
        contributions: 45,
        html_url: 'https://github.com/Rikidink',
        type: 'User',
      },
      {
        username: 'dlnphng',
        name: 'Phuong Do',
        avatar_url: 'https://avatars.githubusercontent.com/u/dlnphng',
        contributions: 32,
        html_url: 'https://github.com/dlnphng',
        type: 'User',
      },
      {
        username: 'neviskawatra',
        name: 'Nevis Kawatra',
        avatar_url: 'https://avatars.githubusercontent.com/u/neviskawatra',
        contributions: 28,
        html_url: 'https://github.com/neviskawatra',
        type: 'User',
      },
    ];
  }
}
