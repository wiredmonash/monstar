import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface GitHubContributor {
  username: string;
  name: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
  type: string;
}

// A contributor as the GitHub REST API returns it
interface ApiContributor {
  login: string;
  type: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

@Injectable({
  providedIn: 'root',
})
export class GitHubService {
  // The repo is public, so its contributors are readable without a token
  private apiUrl =
    'https://api.github.com/repos/wiredmonash/monstar/contributors';

  constructor(private http: HttpClient) {}

  // Get the top human contributors to the MonSTAR project from GitHub
  getMonstarContributors(): Observable<GitHubContributor[]> {
    return this.http.get<ApiContributor[]>(this.apiUrl).pipe(
      map((contributors) => {
        if (!contributors.length) return this.getFallbackContributors();

        return contributors
          .filter((c) => c.type === 'User')
          .slice(0, 10)
          .sort((a, b) => b.contributions - a.contributions)
          .map((c) => ({
            username: c.login,
            name: c.login,
            avatar_url: c.avatar_url,
            contributions: c.contributions,
            html_url: c.html_url,
            type: c.type,
          }));
      }),
      catchError((error) => {
        console.error('Error fetching contributors from GitHub:', error);
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
