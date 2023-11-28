import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, OnInit } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { environment } from '../environments/environments';
import { ITrackCircuit } from './interfaces';

const NODES_URL = "/api/topologycachemng/basetopology/node/" + environment.topologyVersion;
const ARCS_URL = "/api/topologycachemng/basetopology/arc/" + environment.topologyVersion;
const TCZS_URL = "/api/topologycachemng/basetopology/tcz/" + environment.topologyVersion;
const TOPO_EVENTS_URL = "/api/topologycachemng/basetopology/topologyEvent/" + environment.topologyVersion;
const TRACK_CIRCUITS_URL = "/api/topologycachemng/basetopology/trackcircuit/" + environment.topologyVersion;

const EVENT_NODES = "NODES";
const EVENT_ARCS = "ARCS";
const EVENT_TCZS = "TCZS";
const EVENT_TOPOLOGY_EVENTS = "TOPO_EVENTS";
const EVENT_TRACK_CIRCUITS = "TRACK_CIRCUITS";
const EVENT_COMPLETED = "COMPLETED";
/**
 * Servicio de topología. Consulta por http los elementos topológicos necesarios para
 * formar los circuitos de vía. Todos estos datos quedan persistidos en el servicio.  
 */
@Injectable({
  providedIn: 'root'
})
export class TopologyService {

  /**
   * Eventos de carga del servicio de topología. Se dan cuando se carga alguna
   * de las entidades:
   * - Cuando se cargan los nodos se emite un evento 'NODES'
   * - Cuando se cargan los TCZs se emite un evento 'TCZs'
   * - Cuando se cargan los topology events se emite un evento 'TOPO_EVENTS'
   * - Cuando se carga toda la topología se emite un evento 'COMPLETED'
   */
  loadEmmiter: EventEmitter<string> = new EventEmitter();
  /**
   * Lista temporal en la que almacenamos los nodos
   */
  private nodes: any[] = [];
  /**
   * Lista temporal en la que almacenamos los TCZs
   */
  private tczs: any[] = [];
  /**
   * Lista temporal en la que almacenamos los eventos topologicos
   */
  private topoEvents: any[] = [];
  /**
   * Lista temporal en la que almacenamos los circuitos de vía
   */
  private trackCircuits: any[] = [];

  /**
  * Lista temporal en la que almacenamos los arcos
  */
  private arcs: any[] = [];
  /**
   * Todos los eventos de carga emitidos se van almacenando aqui para
   * saber lo que se ha cargado
   */
  private eventsReceived: string[] = [];
  /**
   * Lista de circuitos de vía con los eventos topológicos. Esta es la 
   * lista que nos interesa para poder trabajar
   */
  trainDetectors: ITrackCircuit[] = [];
  /**
   * Flag que indica que la topología está cargada. 
   */
  loaded: boolean = false;

  constructor(private http: HttpClient) { }

  /**
   * Carga la topología en la lista trackCircuits. 
   */
  loadTopology() {
    /**
     * Primero de todo nos suscribimos a los eventos de carga para 
     * saber cuando se están cargando las distintas entidades topológicas.
     * Una vez que estén todas las entidades que necesitamos lanzamos el 
     * merge de la topología. 
     */
    this.loadEmmiter.subscribe(
      ev => {
        console.log(ev + " loaded");
        this.eventsReceived.push(ev);
        if (this.eventsReceived.length === 5) {
          this.mergeTopology();
        }
        if (ev === EVENT_COMPLETED) {
          // Liberamos memoria
          this.nodes = [];
          this.tczs = [];
          this.topoEvents = [];
          this.arcs = [];
          this.trackCircuits = []
          console.log("Se ha cargado la topología", this.trainDetectors);
        }
      }
    );

    /**
     * Carga de nodos
     */
    this.http.get<any[]>(NODES_URL).subscribe(res => {
      this.nodes = res;
      this.loadEmmiter.emit(EVENT_NODES);
    });

    /**
     * Carga de arcos
     */
    this.http.get<any[]>(ARCS_URL).subscribe(res => {
      for (const key in res) {
        this.arcs.push(res[key]);
      }
      this.loadEmmiter.emit(EVENT_ARCS);
    });

    /**
     * Carga de TCZs
     */
    this.http.get<any[]>(TCZS_URL).subscribe(res => {
      this.tczs = res;
      this.loadEmmiter.emit(EVENT_TCZS);
    });

    /**
     * Carga de topologyEvents
     */
    this.http.get<any[]>(TOPO_EVENTS_URL).subscribe(res => {
      this.topoEvents = res;
      this.loadEmmiter.emit(EVENT_TOPOLOGY_EVENTS);
    });

    /**
     * Carga de trackCircuits
     */
    this.http.get<any[]>(TRACK_CIRCUITS_URL).subscribe(res => {
      this.trackCircuits = res;
      this.loadEmmiter.emit(EVENT_TRACK_CIRCUITS);
    });

  }

  /**
   * Mergea todos los elementos topológicos para formar el
   * array trackCircuits.
   */
  mergeTopology():ITrackCircuit[] {
    
    console.log("Mergeando topología");
    for (let tc of this.trackCircuits) {
      let tEvents: any[] = [];
      this.topoEvents.forEach((te: any) => {
         if (te.trainDetectorMnemonic === tc.mnemonic) {
          tEvents.push(te);
         }
      });

      let node = tc.elementMacro === "ND"
        ? this.nodes.find(n => n.mnemonic === tc.elementMacroId)
        : null;
      let arc = tc.elementMacro === "ARC"
        ? this.arcs.find(a => a.id === tc.elementMacroId)
        : null;
      
      if (tEvents && tEvents.length > 0) {
        for (const te of tEvents) {
          let auditedTcz = this.findTCZ(te);
          let auditedNode = te.nodeMnemonic
            ? this.findNodeByMnemo(te.nodeMnemonic)
            : this.findNodeById(auditedTcz.nodeId);

          this.trainDetectors.push({
            mnemonic: tc.mnemonic,
            name: tc.name,
            direction: te.direction,
            type: te.type,
            nodeName: node?.name,
            nodeMnemonic: node?.mnemonic,
            arcName: arc ? this.getArcName(arc) : undefined,
            arcMnemonic: arc?.mnemonic,
            trainDetectorMnemonic: tc.mnemonic,
            circulationTrackMnemonic: te.circulationTrackMnemonic,
            stationingTrackMnemonic: te.stationingTrackMnemonic,
            auditedTczName: auditedTcz?.name,
            auditedTczMnemonic: auditedTcz?.mnemonic,
            auditedNodeName: auditedNode?.name,
            auditedNodeMnemonic: auditedNode?.mnemonic,
            pk: tc.pkBegin,
          });
        }
      } else {
        this.trainDetectors.push({
          mnemonic: tc.mnemonic,
          name: tc.name,
          nodeName: node?.name,
          nodeMnemonic: node?.mnemonic,
          arcName: arc ? this.getArcName(arc) : undefined,
          arcMnemonic: arc?.mnemonic,
          trainDetectorMnemonic: tc.mnemonic,
          pk: tc.pkBegin,
        });      
      }
    }
    this.trainDetectors.sort(compare);

    this.loadEmmiter.emit(EVENT_COMPLETED);

    return [];

  }

  findNodeByMnemo(nodeMnemo: string) {
    return this.nodes.find(n => n.mnemonic === nodeMnemo);
  }
  
  findNodeById(nodeId: string) {
    return this.nodes.find(n => n.id === nodeId);
  }

  getArcName(arc: any): string {
    let initialNode = this.nodes.find(n => n.mnemonic === arc.strNodeMnemo);
    let finalNode = this.nodes.find(n => n.mnemonic === arc.endNodeMnemo);
    return initialNode.name + " - " + finalNode.name;
  }

  /**
   * Devuelve el TCZ al que corresponde un evento topológico
   * @param te
   * @returns 
   */
  findTCZ(te: any): any {
    let tcz;
    if (!te) {
      return tcz;
    }
    if (te.tczMnemonic) {
      tcz = this.tczs.find(t => t.mnemonic === te.tczMnemonic);
    }

    return tcz;
  }
}

/**
 * Fución que compara dos trackCircuits.
 * @param a primer trackCircuit
 * @param b segundo trackCircuit
 * @returns -1 si a es mayor, 1 en caso contrario
 */
function compare(a: any, b: any) {
  let aName = a.nodeName ? a.nodeName : a.arcName;
  let bName = b.nodeName ? b.nodeName : b.arcName;

  if (aName > bName) {
    return -1;
  } else if (aName < bName) {
    return 1;
  } else {
    if (aName > bName) {
      return -1;
    } else {
      return 1;
    }
  }
}
