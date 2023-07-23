import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { POSITION_MESSAGE } from './position.message';

const URL = 'https://opefrvh60-tmm-activeplanmng-realtime-tmstmm.apps.k8s.mova.indra.es/api/activeplanmng/circulation/position';

@Injectable({
  providedIn: 'root'
})
export class AuditorService {

  positionMessage = POSITION_MESSAGE;

  constructor(private http: HttpClient) { }

  sendPosition(circId: string, dir: string, trackCircuit: string) {
    this.positionMessage.circulationId.id = circId;
    this.positionMessage.currentStatus.trainDetectors[0].trainDetectorId = trackCircuit;
    this.positionMessage.currentStatus.direction = dir;

    console.log(this.positionMessage);
    this.http.put(URL, this.positionMessage).subscribe(res => console.log(res));
  }
}
