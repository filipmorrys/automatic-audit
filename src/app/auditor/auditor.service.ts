import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { POSITION_MESSAGE } from './position.message';
import { environment } from '../environments/environments';

const URL = environment.realtimeUrl + '/api/activeplanmng/circulation/position';

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
