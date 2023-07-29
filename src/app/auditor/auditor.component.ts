import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription, debounceTime, fromEvent } from 'rxjs';
import { AuditorService } from './auditor.service';
import { POSITION_MESSAGE } from './position.message';
import { TopologyService } from './topology.service';

@Component({
  selector: 'app-auditor',
  templateUrl: './auditor.component.html',
  styleUrls: ['./auditor.component.css']
})
export class AuditorComponent implements OnInit, AfterViewInit, OnDestroy {

  /** 
   * Contiene los eventos filtrables que se van a mostrar en la tabla
   */
  filteredTrackCircuits: any[] = [];
  /** 
   * Identificador de la circulación sobre la que enviamos pisados
   */  
  circulationId: string = '';
  /**
   * Nombre de la circulación
   */
  circulationName: string = 'N/A';
  /**
   * plantilla de mensaje de posición
   */
  positionMessage = POSITION_MESSAGE;
  /**
   * Campo de texto para buscar elementos de la tabla
   */
  @ViewChild('searcher') searcherElement: any;
  /**
   * Observable para filtrar los elementos de la tabla que cumplen la búsqueda
   */
  searcher$!: Observable<string>;
  /**
   * Sucripción al observable searcher$
   */
  searcherSubscription!: Subscription;
  /**
   * Textarea de mensajes
   */
  @ViewChild("textMessage") textMessage!: ElementRef;
  /**
   * texto asociado al textarea de mensajes
   */
  message = '';

  constructor(private auditor: AuditorService, private topologyService: TopologyService, private activatedRoute: ActivatedRoute) { }

  /**
   * Ciclo de vida: On Init
   */
  ngOnInit(): void {
    /**
     * Cargamos la topología si es que no está cargada ya. La 
     * subscripción a loadEmmiter nos indica cuando se ha 
     * terminado de cargar
     */
    if (!this.topologyService.loaded) {
      this.topologyService.loadEmmiter.subscribe(
        ev => {
          if (ev === 'COMPLETED') {
            this.filteredTrackCircuits = this.topologyService.trackCircuits;
          }
        }
      );
      this.topologyService.loadTopology();
    } else {
      this.filteredTrackCircuits = this.topologyService.trackCircuits;
    }

    this.activatedRoute.queryParams.subscribe(params => {
      if (params['circulationId']) {
        this.circulationId = params['circulationId'];
      }
      if (params['circulationName']) {
        this.circulationName = params['circulationName'];
      }
    });

  }

  /**
   * Ciclo de vida: On Destroy
   */
  ngOnDestroy(): void {
    if (this.searcherSubscription) {
      this.searcherSubscription.unsubscribe();
    }
  }
  
  /**
   * Ciclo de vida: After View Init
   */
  ngAfterViewInit(): void {
    console.log('searcherElement', this.searcherElement);
    this.searcher$ = fromEvent(this.searcherElement.nativeElement, 'keyup');
    this.searcher$.pipe(
      debounceTime(200)
    );
    this.searcherSubscription = this.searcher$.subscribe(ev => {
      this.filteredTrackCircuits = this.topologyService.trackCircuits.filter(tc => this.matchSearch(tc))
    });
  }

  /**
   * Devuelve true si un trackCircuit cumple la búsqueda del buscador rápido
   * @param tc el trackCircuit
   * @returns 
   */
  matchSearch(tc: any): boolean {
    let value = this.searcherElement.nativeElement.value;
    return tc.topoEvent.trainDetectorMnemonic.toLowerCase().indexOf(value.toLowerCase()) >= 0
      || tc.tczName.toLowerCase().indexOf(value.toLowerCase()) >= 0
      || tc.nodeName.toLowerCase().indexOf(value.toLowerCase()) >= 0;
  }

  /**
   * Envía un mensaje de posición a una circulación. 
   * @param i índice del trackCircuit a enviar. 
   */
  sendPosition(i: number) {
    let tc = this.filteredTrackCircuits[i];
    this.auditor.sendPosition(this.circulationId, tc.topoEvent.direction, tc.topoEvent.trainDetectorMnemonic);
  }

  /**
   * Establece un mensaje de posición en el textarea y copia el mensaje
   * en el clipboard
   * @param i 
   */
  setPosition(i: number) {
    let tc = this.filteredTrackCircuits[i];
    this.positionMessage.circulationId.id = this.circulationId;
    this.positionMessage.currentStatus.trainDetectors[0].trainDetectorId = tc.topoEvent.trainDetectorMnemonic;
    this.positionMessage.currentStatus.direction = (tc.topoEvent.direction === 'BOTH') ? 'EVEN' : tc.topoEvent.direction;

    this.message = JSON.stringify(this.positionMessage);
    this.copyMessage();
  }

  /**
   * Copia en el clipboard lo que esté escrito en el textarea de mensajes
   */
  copyMessage() {
    console.log(this.textMessage);
    setTimeout(() => {
      this.textMessage.nativeElement.select();
      document.execCommand('copy');
      this.textMessage.nativeElement.setSelectionRange(0, 0);
    }, 100);

  }

}
