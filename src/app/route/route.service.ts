import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { environment } from '../environments/environments';
import { CirculationsService } from '../circulations/circulations.service';
import { Observable, concat, mergeMap, tap } from 'rxjs';

const MOVEMENTS_URL =
  '/api/topologycachemng/basetopology/movement/' + environment.topologyVersion;
const TOPO_EVENTS_URL =
  '/api/topologycachemng/basetopology/topologyEvent/' +
  environment.topologyVersion;
const TRACK_CIRCUITS_URL =
  '/api/topologycachemng/basetopology/trackcircuit/' +
  environment.topologyVersion;

const EVENT_MOVEMENTS = 'MOVEMENTS';
const EVENT_TOPOLOGY_EVENTS = 'TOPO_EVENTS';
const EVENT_TRACK_CIRCUITS = 'TRACK_CIRCUITS';
const EVENT_COMPLETED = 'COMPLETED';

@Injectable({ providedIn: 'root' })
export class RouteService {
  /**
   * La circulacion que se está cargando
   */
  private circulation: any;
  /**
   * Lista temporal en la que almacenamos los nodos
   */
  private movements = new Map<string, any>();
  /**
   * Lista temporal en la que almacenamos los eventos topologicos
   */
  private topoEvents: any[] = [];
  /**
   * Lista temporal en la que almacenamos los circuitos de vía
   */
  private trackCircuits: any[] = [];

  /**
   * Todos los eventos de carga emitidos se van almacenando aqui para
   * saber lo que se ha cargado
   */
  private eventsReceived: string[] = [];
  /**
   * Flag que indica que la topología está cargada.
   */
  loaded: boolean = false;

  constructor(
    private http: HttpClient,
    private circulationsService: CirculationsService
  ) {}

  /**
   * Carga una runta para una circulación. Obtiene por http la circulacion y los elementos topológicos necesarios y construye el recorrido
   * @param circulationId identificador de la circulación
   */
  loadRouteFor(circulationId: string) {
    concat(
      this.loadCirculation(circulationId),
      this.loadMovements(),
      this.loadTopologyEvents(),
      this.loadTrackCircuits()
    ).subscribe((res) => {
      this.mergeRoute();
    });
  }

  /**
   * Construye el recorrido, que consiste en la lista de circuitos de via que se recorren de forma ordenada
   */
  mergeRoute() {
    const movIds = this.getMovementIds();

    const sections: any[] = [];
    movIds.forEach((movId) => {
      const movement = this.movements.get(movId);
      sections.push(movement.microLocation.sections);
    });

    const overlapedTrackCircuits = this.trackCircuits.filter((tc) =>
      this.overlaps(tc, sections)
    );
  }

  /**
   * Devuelve true si el circuito de via se solapa con alguna de las secciones del movimiento
   * @param tc track circuit
   * @param sections secciones abarcadas por el movimiento
   * @returns true si el circuito de via se solapa con alguna de las secciones del movimiento
   */
  overlaps(tc: any, sections: any[]): boolean {
    if (tc.microLocationLinear) {
      const tcSections = tc.microLocationLinear.sections;
      for (const tcSection of tcSections) {
        for (const section of sections) {
          if (
            tcSection.id === section.id &&
            tcSection.beginCood <= section.endCood &&
            tcSection.endCood >= section.beginCood
          ) {
            return true;
          }
        }
      }
    } else if (tc.microLocationArea) {
      const tcAreas = tc.microLocationArea.areas;
      for (const tcArea of tcAreas) {
        for (const section of sections) {
          if (
            tcArea.id === section.id &&
            tcArea.beginCood <= section.endCood &&
            tcArea.endCood >= section.beginCood
          ) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private getMovementIds(): string[] {
    const movIds: string[] = [];
    const route: any[] = this.circulation.workRoute
      ? this.circulation.workRoute
      : this.circulation.plannedRoute;
    route.forEach((tcz) => {
      if (tcz.iMovementId) {
        movIds.push(tcz.iMovementId);
      }
      if (tcz.oMovementId) {
        movIds.push(tcz.oMovementId);
      }
    });
    return movIds;
  }

  private loadMovements(): Observable<any[]> {
    return this.http.get<any[]>(MOVEMENTS_URL).pipe(
      tap((res) => {
        for (const movement of res) {
          this.movements.set(movement.id, movement);
        }
      })
    );
  }

  private loadTopologyEvents(): Observable<any[]> {
    return this.http
      .get<any[]>(TOPO_EVENTS_URL)
      .pipe(tap((res) => (this.topoEvents = res)));
  }

  private loadTrackCircuits(): Observable<any[]> {
    return this.http
      .get<any[]>(TRACK_CIRCUITS_URL)
      .pipe(tap((res) => (this.trackCircuits = res)));
  }

  private loadCirculation(circulationId: string): Observable<any> {
    return this.circulationsService
      .getCirculationById(circulationId)
      .pipe(tap((res) => (this.circulation = res)));
  }
}
