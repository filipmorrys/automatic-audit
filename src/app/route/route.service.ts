import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { environment } from '../environments/environments';
import { CirculationsService } from '../circulations/circulations.service';
import { Observable, audit, concat, forkJoin, mergeMap, tap } from 'rxjs';
import { ITrackCircuit } from '../auditor/interfaces';

const MOVEMENTS_URL =
  '/api/topologycachemng/basetopology/movement/' + environment.topologyVersion;
const TOPO_EVENTS_URL =
  '/api/topologycachemng/basetopology/topologyEvent/' +
  environment.topologyVersion;
const TRACK_CIRCUITS_URL =
  '/api/topologycachemng/basetopology/track-circuit/' +
  environment.topologyVersion;
const NODES_URL =
  '/api/topologycachemng/basetopology/node/' + environment.topologyVersion;
const ARCS_URL =
  '/api/topologycachemng/basetopology/arc/' + environment.topologyVersion;
const TCZS_URL =
  '/api/topologycachemng/basetopology/tcz/' + environment.topologyVersion;

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
  private nodes =  new Map<string, any>();
  /**
   * Lista temporal en la que almacenamos los TCZs
   */
  private tczs = new Map<string, any>();
  /**
   * Lista temporal en la que almacenamos los arcos
   */
  private arcs: any[] = [];
  /**
   * Lista temporal en la que almacenamos los nodos
   */
  private movements = new Map<string, any>();
  /**
   * Lista temporal en la que almacenamos los eventos topologicos
   */
  private topoEvents = new Map<string, any>();
  /**
   * Lista temporal en la que almacenamos los circuitos de vía
   */
  private trackCircuits: any[] = [];

  /**
   * Recorrido de circuitos de vía ordenados por los que se recorren en la circulación
   */
  public route: ITrackCircuit[] = [];


  constructor(
    private http: HttpClient,
    private circulationsService: CirculationsService
  ) {}

  /**
   * Carga una runta para una circulación. Obtiene por http la circulacion y los elementos topológicos necesarios y construye el recorrido
   * @param circulationId identificador de la circulación
   */
  loadRouteFor(circulationId: string) {
    // Espera a que se ejecuten todos los observables y luego hacemos el merge
    forkJoin([
      this.loadCirculation(circulationId),
      this.loadMovements(),
      this.loadTopologyEvents(),
      this.loadTrackCircuits(),
      this.loadNodes(),
      this.loadTczs(),
    ]).subscribe(([circ, movs, tes, tcs, nodes, tczs]) => {
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
      sections.push(...movement.microLocation.sections);
    });

    const routeTrackCircuits = this.overlaps(sections);
    this.removeDuplicates(routeTrackCircuits);
    this.completeRoute(routeTrackCircuits);
  }

  completeRoute(routeTrackCircuits: any[]) {
    for (const tc of routeTrackCircuits) {
          const topoEvent = this.topoEvents.get(tc.id);
          const node = this.nodes.get(tc.elementMacroUUID);
          const auditedTcz = topoEvent ? this.tczs.get(topoEvent.tcz) : null;
          const auditedNode = topoEvent ? this.nodes.get(topoEvent.node) : null;
          this.route.push({
            mnemonic: tc.mnemonic,        
            name: tc.name,
    //        direction?: string;
            type: topoEvent?.type,
            nodeName: node?.name,
            nodeMnemonic: node?.mnemonic,
            // arcName?: string;
            // arcMnemonic?: string;
            trainDetectorMnemonic: tc.mnemonic,
            circulationTrackMnemonic: topoEvent?.circulationTrackMnemonic,
            stationingTrackMnemonic: topoEvent?.stationingTrackMnemonic,
            auditedTczName: auditedTcz?.name,
            auditedTczMnemonic: auditedTcz?.mnemonic,
            auditedNodeName: auditedNode?.name,
            auditedNodeMnemonic: auditedNode?.mnemonic,
           });
        }
  }

  removeDuplicates(routeTrackCircuits: any[]): void {
    for (let i = 0; i < routeTrackCircuits.length - 1; i++) {
      const tc = routeTrackCircuits[i];
      let nextTc = routeTrackCircuits[i + 1];
      while (tc.id === nextTc.id) {
        routeTrackCircuits.splice(i + 1, 1);
        nextTc = routeTrackCircuits[i + 1];
      }
    }
  }

  overlaps(sections: any[]): any[] {
    const allTcOverlaped: any[] = [];
    for (const section of sections) {
      const tcOverlaped = this.trackCircuits.filter((tc) =>
        this.overlapsTc(tc, section)
      );

      allTcOverlaped.push(...this.sortTcs(tcOverlaped, section));
    }

    return allTcOverlaped;
  }

  sortTcs(tcOverlaped: any[], section: any): any[] {
    if (tcOverlaped.length === 0) return [];

    if (section.beginCoord < section.endCoord) {
      tcOverlaped.sort((tc1, tc2) => {
        const [tc1BeginCoord, tc2BeginCoord] = this.getBeginCoord(
          tc1,
          tc2,
          section
        );
        return tc1BeginCoord - tc2BeginCoord;
      });
    } else {
      tcOverlaped.sort((tc1, tc2) => {
        const [tc1BeginCoord, tc2BeginCoord] = this.getBeginCoord(
          tc1,
          tc2,
          section
        );
        return tc2BeginCoord - tc1BeginCoord;
      });
    }

    return [...tcOverlaped];
  }

  getBeginCoord(tc1: any, tc2: any, section: any): number[] {
    let tc1BeginCoord = 0;
    if (tc1.microLocationLinear) {
      tc1BeginCoord = tc1.microLocationLinear.sections.find(
        (s: any) => s.netElementMnemo === section.netElementMnemo
      ).beginCoord;
    } else {
      tc1BeginCoord = tc1.microLocationArea.sections.find(
        (s: any) => s.netElementMnemo === section.netElementMnemo
      ).beginCoord;
    }

    let tc2BeginCoord = 0;
    if (tc2.microLocationLinear) {
      tc2BeginCoord = tc2.microLocationLinear.sections.find(
        (s: any) => s.netElementMnemo === section.netElementMnemo
      ).beginCoord;
    } else {
      tc2BeginCoord = tc2.microLocationArea.sections.find(
        (s: any) => s.netElementMnemo === section.netElementMnemo
      ).beginCoord;
    }

    return [tc1BeginCoord, tc2BeginCoord];
  }

  overlapsTc(tc: any, section: any): boolean {
    let sectionBeginCoord = Math.min(section.beginCoord, section.endCoord);
    let sectionEndCoord = Math.max(section.beginCoord, section.endCoord);

    if (tc.microLocationLinear) {
      const tcSections = tc.microLocationLinear.sections;

      for (const tcSection of tcSections) {
        let tcBeginCoord = Math.min(tcSection.beginCoord, tcSection.endCoord);
        let tcEndCoord = Math.max(tcSection.beginCoord, tcSection.endCoord);
        if (
          tcSection.netElementMnemo === section.netElementMnemo &&
          tcBeginCoord < sectionEndCoord &&
          tcEndCoord > sectionBeginCoord
        ) {
          return true;
        }
      }
    } else if (tc.microLocationArea) {
      const tcAreas = tc.microLocationArea.sections;
      for (const tcArea of tcAreas) {
        let tcBeginCoord = Math.min(tcArea.beginCoord, tcArea.endCoord);
        let tcEndCoord = Math.max(tcArea.beginCoord, tcArea.endCoord);
        if (
          tcArea.netElementMnemo === section.netElementMnemo &&
          tcBeginCoord < sectionEndCoord &&
          tcEndCoord > sectionBeginCoord
        ) {
          return true;
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
      tap((res) => console.log('Movements loaded', res)),
      tap((res) => {
        for (const movement of res) {
          this.movements.set(movement.id, movement);
        }
      })
    );
  }

  private loadTopologyEvents(): Observable<any[]> {
    return this.http.get<any[]>(TOPO_EVENTS_URL).pipe(
      tap((res) => console.log('Topology events loaded', res)),
      tap((res) => {
        for (const topoEvent of res) {
          this.topoEvents.set(topoEvent.trainDetector, topoEvent);
        }
      })
    );
  }

  private loadTrackCircuits(): Observable<any[]> {
    return this.http.get<any[]>(TRACK_CIRCUITS_URL).pipe(
      tap((res) => console.log('Track circuits loaded', res)),
      tap((res) => (this.trackCircuits = res))
    );
  }

  private loadCirculation(circulationId: string): Observable<any> {
    return this.circulationsService.getCirculationById(circulationId).pipe(
      tap((res) => console.log('Circulation loaded', res)),
      tap((res) => (this.circulation = res))
    );
  }

  private loadNodes(): Observable<any[]> {
    return this.http.get<any[]>(NODES_URL).pipe(
      tap((res) => console.log('Nodes loaded', res)),
      tap((res) => {
        for (const node of res) {
          this.nodes.set(node.id, node);
        }
      })
    );
  }

  private loadTczs(): Observable<any[]> {
    return this.http.get<any[]>(TCZS_URL).pipe(
      tap((res) => console.log('TCZs loaded', res)),
      tap((res) => {
        for (const tcz of res) {
          this.tczs.set(tcz.id, tcz);
        }
      })
    );
  }
}
