import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription, debounceTime, fromEvent } from 'rxjs';
import { AuditorService } from './auditor.service';
import { POSITION_MESSAGE } from './position.message';
import { TopologyService } from './topology.service';
import { DELETE_POSITION_MESSAGE } from './delete-position.message';
import { ITrackCircuit } from './interfaces';

@Component({
  selector: 'app-auditor',
  templateUrl: './auditor.component.html',
  styleUrls: ['./auditor.component.css']
})
export class AuditorComponent implements OnInit, AfterViewInit, OnDestroy {

  /** 
   * Contiene los eventos filtrables que se van a mostrar en la tabla
   */
  filteredTrainDetectors: ITrackCircuit[] = [];
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
   * plantilla de mensaje de borrado de posición
   */
  deletePositionMessage = DELETE_POSITION_MESSAGE;

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
            this.filteredTrainDetectors = this.topologyService.trainDetectors;
          }
        }
      );
      this.topologyService.loadTopology();
    } else {
      this.filteredTrainDetectors = this.topologyService.trainDetectors;
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
      this.filteredTrainDetectors = this.topologyService.trainDetectors.filter(tc => this.matchSearch(tc))
    });
  }

  /**
   * Devuelve true si un trackCircuit cumple la búsqueda del buscador rápido
   * @param tc el trackCircuit
   * @returns 
   */
  matchSearch(tc: any): boolean {
    let value = this.searcherElement.nativeElement.value;
    let tczName = tc.tczName ? tc.tczName : '';
    let nodeName = tc.nodeName ? tc.nodeName : tc.arcName;
    return tc.trainDetectorMnemonic.toLowerCase().indexOf(value.toLowerCase()) >= 0
      || tczName.toLowerCase().indexOf(value.toLowerCase()) >= 0
      || nodeName.toLowerCase().indexOf(value.toLowerCase()) >= 0;
  }

  /**
   * Envía un mensaje de borrado de posición a una circulación. 
   */
  sendDeletePosition() {
    this.auditor.sendDeletePosition(this.circulationId);
  }

  setDeletePosition() {
    this.deletePositionMessage.id = this.circulationId;
    this.message = JSON.stringify(this.deletePositionMessage);
    this.copyMessage();
  }

  /**
   * Envía un mensaje de posición a una circulación. 
   * @param i índice del trackCircuit a enviar. 
   */
  sendPosition(i: number) {
    let tc = this.filteredTrainDetectors[i];
    this.auditor.sendPosition(this.circulationId, tc.trainDetectorMnemonic, tc.direction);
  }

  /**
   * Establece un mensaje de posición en el textarea y copia el mensaje
   * en el clipboard
   * @param i 
   */
  setPosition(i: number) {
    let tc = this.filteredTrainDetectors[i];
    this.positionMessage.circulationId.id = this.circulationId;
    this.positionMessage.currentStatus.trainDetectors[0].trainDetectorId = tc.trainDetectorMnemonic;
    this.positionMessage.currentStatus.direction = (!tc.direction || tc.direction === 'BOTH') ? 'EVEN' : tc.direction;

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
