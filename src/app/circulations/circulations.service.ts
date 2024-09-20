import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FILTER } from './filter';
import { environment } from '../environments/environments';

const URL_CIRCULATION_LIST = environment.dataaccessUrl + '/api/activeplanmng/circulation-info/search';
const URL_CIRCULATION_BY_ID = environment.dataaccessUrl + '/api/activeplanmng/circulation';


@Injectable({
  providedIn: 'root'
})
export class CirculationsService {

  constructor(private http: HttpClient) {}

  getCirculations(applicationDay: number): Observable<any> {
    let f = FILTER;
    f.filter.conditions[0].condition.value = '' + applicationDay;
    return this.http.post(URL_CIRCULATION_LIST, FILTER);
  }

  getCirculationById(id: string): Observable<any> {
    return this.http.get(URL_CIRCULATION_BY_ID + '/' + id);
  }

  
}
