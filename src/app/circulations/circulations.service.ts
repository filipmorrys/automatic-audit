import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FILTER } from './filter';

const URL = 'https://opefrvh60-tmm-activeplanmng-dataaccess-tmstmm.apps.k8s.mova.indra.es/api/activeplanmng/circulation-info/search';

@Injectable({
  providedIn: 'root'
})
export class CirculationsService {

  constructor(private http: HttpClient) {}

  getCirculations(): Observable<any> {
    return this.http.post(URL, FILTER);
  }
}
