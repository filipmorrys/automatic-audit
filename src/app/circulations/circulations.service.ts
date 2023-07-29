import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FILTER } from './filter';
import { environment } from '../environments/environments';

const URL = environment.dataaccessUrl + '/api/activeplanmng/circulation-info/search';

@Injectable({
  providedIn: 'root'
})
export class CirculationsService {

  constructor(private http: HttpClient) {}

  getCirculations(applicationDay: number): Observable<any> {
    let f = FILTER;
    f.filter.conditions[0].condition.value = '' + applicationDay;
    return this.http.post(URL, FILTER);
  }
}
