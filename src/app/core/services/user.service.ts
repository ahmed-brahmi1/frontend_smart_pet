import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { User, CreateUserDto, UpdateUserDto } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiUrl = environment.apiUrl + '/user';

  constructor(private http: HttpClient) {}

  create(body: CreateUserDto): Observable<User> {
    return this.http.post<User>(this.apiUrl, body);
  }

  findAll(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  findOne(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  update(id: string, body: UpdateUserDto): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, body);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
