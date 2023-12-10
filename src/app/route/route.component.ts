import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouteService } from './route.service';

@Component({
  selector: 'app-route',
  templateUrl: 'route.component.html',
})
export class RouteComponent implements OnInit {
  circulationId: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private routeService: RouteService
  ) {}

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params['circulationId']) {
        this.circulationId = params['circulationId'];
        this.routeService.loadRouteFor(this.circulationId);
      }
    });
  }
}
