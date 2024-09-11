import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // The URL of where the API Server is located
  private url = 'http://localhost:8080';

  constructor(private http: HttpClient) { }

  // GET http://localhost:8080/ Testing server connection
  getMessage() {
    return this.http.get(`${this.url}/`)
  }

  // TODO: Add more API Calls here... E.g. getUnits(), getReview(), createReview(), ...
}
