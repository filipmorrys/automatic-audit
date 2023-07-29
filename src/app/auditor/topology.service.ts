import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, OnInit } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { environment } from '../environments/environments';

const NODES_URL = environment.topologyUrl + "/api/topologycachemng/basetopology/node/" + environment.topologyVersion;
const TCZS_URL = environment.topologyUrl + "/api/topologycachemng/basetopology/tcz/" + environment.topologyVersion;
const TOPO_EVENTS_URL = environment.topologyUrl + "/api/topologycachemng/basetopology/topologyEvent/" + environment.topologyVersion;

@Injectable({
  providedIn: 'root'
})
export class TopologyService {

  loadEmmiter: EventEmitter<string> = new EventEmitter();



  nodes: any[] = [];
  tczs: any[] = [];
  topoEvents: any[] = [];
  trackCircuits: any[] = [];
  loaded: boolean = false;
  eventsReceived: string[] = [];

  constructor(private http: HttpClient) { }

  loadTopology() {

    this.loadEmmiter.subscribe(
      ev => {
        console.log(ev + " loaded");
        this.eventsReceived.push(ev);
        if (this.eventsReceived.length === 3) {
          this.mergeTopology();
        } 
        if (ev === "COMPLETED") {
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
        this.loadEmmiter.emit("COMPLETED");
        this.loaded = true;
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