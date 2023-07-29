import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, OnInit } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { environment } from '../environments/environments';

const NODES_URL = environment.topologyUrl + "/api/topologycachemng/basetopology/node/" + environment.topologyVersion;
const TCZS_URL = environment.topologyUrl + "/api/topologycachemng/basetopology/tcz/" + environment.topologyVersion;
const TOPO_EVENTS_URL = environment.topologyUrl + "/api/topologycachemng/basetopology/topologyEvent/" + environment.topologyVersion;

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
   * Todos los eventos de carga emitidos se van almacenando aqui para
   * saber lo que se ha cargado
   */
  private eventsReceived: string[] = [];
  /**
   * Lista de circuitos de vía con los eventos topológicos. Esta es la 
   * lista que nos interesa para poder trabajar
   */
  trackCircuits: any[] = [];
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
        if (this.eventsReceived.length === 3) {
          this.mergeTopology();
        } 
        if (ev === "COMPLETED") {
          this.nodes = [];
          this.tczs = [];
          this.topoEvents = [];
          console.log("Se ha cargado la topología", this.trackCircuits);
        }
      }
    );

    /**
     * Carga de nodos
     */
    this.http.get<any[]>(NODES_URL).subscribe(res => {
      this.nodes = res;
      this.loadEmmiter.emit("NODES");
    });

    /**
     * Carga de TCZs
     */
    this.http.get<any[]>(TCZS_URL).subscribe(res => {
      this.tczs = res;
      this.loadEmmiter.emit("TCZS");
    });

    /**
     * Carga de topologyEvents
     */
    this.http.get<any[]>(TOPO_EVENTS_URL).subscribe(res => {
      this.topoEvents = res;
      this.loadEmmiter.emit("TOPO_EVENTS");
    });
  }

  /**
   * Mergea todos los elementos topológicos para formar el
   * array trackCircuits.
   */
  mergeTopology() {
    console.log("Mergeando topología");

    from(this.topoEvents).pipe(
      map(te => {
        let node = this.findNode(te);
        let tcz = this.findTCZ(te);
        return {
          nodeName: node, 
          tczName: tcz,
          topoEvent: te
        }
      }),
    ).subscribe({
      next: tc => this.trackCircuits.push(tc), 
      error: err => console.log(err),
      complete: () => {
        this.trackCircuits.sort(compare);
        this.loaded = true;
        this.loadEmmiter.emit("COMPLETED");
      }
    });
  }

  /**
   * Devuelve el nombre del TCZ al que corresponde el evento topológico
   * @param te
   * @returns 
   */
  findTCZ(te: any): string {
    let tcz;
    if (te.tczMnemonic) {
      tcz = this.tczs.find(t => t.mnemonic === te.tczMnemonic);
    }

    return (tcz) ? tcz.name : '';
  }

  /**
   * Devuelve el nombre del nodo al que corresponde el evento topológico
   * @param te 
   * @returns 
   */
  findNode(te: any): string {
    let node;
    if (!te.nodeMnemonic) {
      node = this.nodes.find(n => {
        if (te.tczMnemonic) {
          return n.tczList.includes(te.tczMnemonic);
        }
        return false;
      });
    } else {
      node = this.nodes.find(n => n.mnemonic === te.nodeMnemonic);
    }

    return (node) ? node.name : '';

  }


}

/**
 * Fución que compara dos trackCircuits.
 * @param a primer trackCircuit
 * @param b segundo trackCircuit
 * @returns -1 si a es mayor, 1 en caso contrario
 */
function compare(a: any, b: any) {
  if (a.nodeName > b.nodeName) {
    return -1;
  } else if (a.nodeName < b.nodeName) {
    return 1;
  } else {
    if (a.tczName > b.tczName) {
      return -1;
    } else {
      return 1;
    }
  }
}