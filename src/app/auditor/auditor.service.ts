import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { POSITION_MESSAGE } from './position.message';
import { environment } from '../environments/environments';
import { DELETE_POSITION_MESSAGE } from './delete-position.message';

const POSITION_MESSAGE_URL = environment.realtimeUrl + '/api/activeplanmng/circulation/position';
const DELETE_POSITION_MESSAGE_URL = environment.realtimeUrl + '/api/activeplanmng/circulation/position/delete';

@Injectable({
  providedIn: 'root'
})
export class AuditorService {

  positionMessage = POSITION_MESSAGE;
  deletePositionMessage = DELETE_POSITION_MESSAGE;


  constructor(private http: HttpClient) { }

  /**
   * Envía un mensaje de posición al servidor de realtime
   * @param circId identificador de la circulación
   * @param dir sentido
   * @param trackCircuit mnemónico del circuito de vía 
   */
  sendPosition(circId: string, trackCircuit: string, dir?: string) {
    this.positionMessage.circulationId.id = circId;
    this.positionMessage.currentStatus.trainDetectors[0].trainDetectorId = trackCircuit;
    this.positionMessage.currentStatus.direction = dir ? dir : 'EVEN';

    console.log(this.positionMessage);
    this.http.put(POSITION_MESSAGE_URL, this.positionMessage).subscribe(res => console.log(res));
  }

  /**
   * Envía un mensaje de borrado de posición al servidor de realtime
   * @param circulationId identificador de la circulación
   */
  sendDeletePosition(circulationId: string) {
    this.deletePositionMessage.id = circulationId;
    console.log(this.deletePositionMessage);
    this.http.put(DELETE_POSITION_MESSAGE_URL, this.deletePositionMessage).subscribe(res => console.log(res));
  }
}
