import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { UserService } from '../services/api/user.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let userService: UserService;
  const v2 = environment.apiV2Url;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    userService = TestBed.inject(UserService);
  });

  afterEach(() => httpMock.verify());

  it('refreshes on 401 then retries the original request (v2 refresh)', () => {
    let result: unknown;
    http.get(`${v2}/units/popular`).subscribe((res) => (result = res));

    // Original request fails with 401.
    httpMock
      .expectOne(`${v2}/units/popular`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    // Interceptor calls the v2 refresh endpoint.
    httpMock
      .expectOne(`${v2}/users/refresh`)
      .flush({ message: 'Token refreshed successfully' });

    // Original request is retried and succeeds.
    httpMock.expectOne(`${v2}/units/popular`).flush([{ ok: true }]);

    expect(result).toEqual([{ ok: true }]);
  });

  it('clears the session when the refresh itself fails', () => {
    const clearSpy = spyOn(userService, 'clearSession').and.callThrough();
    let errored = false;

    http
      .get(`${v2}/units/popular`)
      .subscribe({ error: () => (errored = true) });

    httpMock
      .expectOne(`${v2}/units/popular`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    // Refresh fails -> session cleared, error propagates, no retry.
    httpMock
      .expectOne(`${v2}/users/refresh`)
      .flush(null, { status: 403, statusText: 'Forbidden' });

    expect(clearSpy).toHaveBeenCalled();
    expect(errored).toBeTrue();
    expect(userService.currentUserValue).toBeNull();
  });

  it('does not attempt a refresh for the refresh endpoint itself', () => {
    userService.refreshToken().subscribe({ error: () => undefined });

    // Only one request goes out; the interceptor skips auth endpoints.
    httpMock
      .expectOne(`${v2}/users/refresh`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectNone(`${v2}/users/refresh`);
  });
});
