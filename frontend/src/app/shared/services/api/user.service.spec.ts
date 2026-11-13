import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { IUser } from 'app/shared/models/v2/user.schema';
import { environment } from '../../../../environments/environment';
import { UserService } from './user.service';

const user = { _id: 'u1', email: 'a@student.monash.edu' } as IUser;

describe('UserService session state', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  const v2 = environment.apiV2Url;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('populates current user on a successful validate (initialization)', () => {
    service.validateSession().subscribe();
    httpMock
      .expectOne(`${v2}/users/validate`)
      .flush({ message: 'Authenticated', data: user });

    expect(service.currentUserValue).toEqual(user);
  });

  it('leaves current user null when validation fails', () => {
    service.validateSession().subscribe({ error: () => undefined });
    httpMock
      .expectOne(`${v2}/users/validate`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(service.currentUserValue).toBeNull();
  });

  it('clears current user on logout', () => {
    service.validateSession().subscribe();
    httpMock
      .expectOne(`${v2}/users/validate`)
      .flush({ message: 'Authenticated', data: user });
    expect(service.currentUserValue).toEqual(user);

    service.logout().subscribe();
    httpMock.expectOne(`${v2}/users/logout`).flush({ message: 'Logged out' });

    expect(service.currentUserValue).toBeNull();
  });

  it('deletes the account and clears the current user', () => {
    service.validateSession().subscribe();
    httpMock
      .expectOne(`${v2}/users/validate`)
      .flush({ message: 'Authenticated', data: user });
    expect(service.currentUserValue).toEqual(user);

    service.deleteAccount(user._id).subscribe();
    const req = httpMock.expectOne(`${v2}/users/delete/${user._id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'User successfully deleted' });

    expect(service.currentUserValue).toBeNull();
  });

  it('sends credentials on authed reads and updates', () => {
    service.me().subscribe();
    const meReq = httpMock.expectOne(`${v2}/users/me`);
    expect(meReq.request.withCredentials).toBeTrue();
    meReq.flush(user);

    service.updateUsername('u1', 'newname').subscribe();
    const updateReq = httpMock.expectOne(`${v2}/users/update/u1`);
    expect(updateReq.request.withCredentials).toBeTrue();
    updateReq.flush({ message: 'ok', username: 'newname' });
  });

  it('clearSession drops the user without a backend call', () => {
    service.validateSession().subscribe();
    httpMock
      .expectOne(`${v2}/users/validate`)
      .flush({ message: 'Authenticated', data: user });

    service.clearSession();

    expect(service.currentUserValue).toBeNull();
    expect(service.currentAuthStateValue).toBe('logged out');
    httpMock.expectNone(`${v2}/users/logout`);
  });
});
