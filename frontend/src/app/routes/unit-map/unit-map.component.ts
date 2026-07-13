import { Location, UpperCasePipe } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgxGraphModule, NgxGraphZoomOptions } from '@swimlane/ngx-graph';
import * as shape from 'd3-shape';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { Subject } from 'rxjs';
import {
  UnitMapEdge,
  UnitMapNode,
} from '../../shared/models/v2/unit-map.model';
import { IUnit } from '../../shared/models/v2/unit.schema';
import { GetUnitService } from '../../shared/services/api/get-unit.service';

@Component({
  selector: 'app-unit-map',
  standalone: true,
  imports: [
    OrganizationChartModule,
    NgxGraphModule,
    ButtonModule,
    ToolbarModule,
    TooltipModule,
    CardModule,
    UpperCasePipe,
    DividerModule,
  ],
  templateUrl: './unit-map.component.html',
  styleUrl: './unit-map.component.scss',
})
export class UnitMapComponent implements OnInit, OnDestroy {
  @ViewChild('graphContainer') graphContainer!: ElementRef;

  nodes: UnitMapNode[] = [];
  edges: UnitMapEdge[] = [];
  layout = 'dagre';
  curve = shape.curveBasis;

  center$: Subject<boolean> = new Subject();
  zoomToFit$: Subject<NgxGraphZoomOptions> = new Subject();

  isLoading: boolean = false;

  unit: IUnit | null = null;
  prerequisiteNumReq: number = 0;
  prerequisiteUnitCodes: string[] = [];
  parentUnitCodes: string[] = [];

  /**
   * === Constructor ===
   */
  constructor(
    private getUnitService: GetUnitService,
    private router: Router,
    private location: Location
  ) {}

  /**
   * * On Init
   *
   * - Checks if the page has been loaded before
   * - Fetch and build the unit graph if the page has been loaded for the first time
   */
  ngOnInit(): void {
    this.fetchAndBuildUnitGraph();
  }

  /**
   * * On Destory
   *
   * - Remove the flag from local storage
   */
  ngOnDestroy(): void {
    localStorage.removeItem('unitMapLoaded');
  }

  /**
   * * Fetch and Build Unit Graph
   *
   * Reads the map-ready data from the unit module and applies it to the graph.
   * The module owns fetching the unit and its parents and assembling the nodes,
   * edges, and sidebar fields; this component only renders and centers them.
   */
  fetchAndBuildUnitGraph() {
    // Get the current unit's unitcode from the url
    const unitCode = this.router.url.split('/')[2];

    this.getUnitService.getUnitMap(unitCode).subscribe({
      next: (unitMap) => {
        this.unit = unitMap.unit;
        this.nodes = unitMap.nodes;
        this.edges = unitMap.edges;
        this.prerequisiteUnitCodes = unitMap.prerequisiteUnitCodes;
        this.prerequisiteNumReq = unitMap.prerequisiteNumReq;
        this.parentUnitCodes = unitMap.parentUnitCodes;

        this.centerGraph();
      },
    });

    // Zoom to fit
    this.resetZoom();
  }

  /**
   * * Centers the Graph
   */
  centerGraph() {
    this.center$.next(true);
  }

  /**
   * * Resets the Graph
   */
  resetGraph() {
    localStorage.removeItem('unitMapLoaded');
    window.location.reload();
  }

  /**
   * * Zoom to Fit
   */
  resetZoom() {
    this.zoomToFit$.next({ force: true, autoCenter: true });
  }

  /**
   * * Toggle Layout
   */
  toggleLayout() {
    this.layout = this.layout === 'dagre' ? 'colaForceDirected' : 'dagre';
  }

  /**
   * * Navigates back to the previous page
   */
  navigateBack() {
    return this.location.back();
  }
}
