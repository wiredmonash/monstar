import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { ApiService } from '../../shared/services/api.service';
import { Router } from '@angular/router';
import { Edge, NgxGraphModule, NgxGraphZoomOptions } from '@swimlane/ngx-graph';
import * as shape from 'd3-shape';
import { Subject } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { Unit } from '../../shared/models/unit.model';
import { UpperCasePipe } from '@angular/common';
import { DividerModule } from 'primeng/divider';

/**
 * * Unit Node Interface
 * 
 * An interface for the nodes in the unit graph
 */
interface UnitNode {
  id: string;
  label: string;
  data: {
    type: 'prerequisite' | 'current' | 'parent';
    name: string;
  }
}

/**
 * * Unit Edge Interface
 * 
 * An interface for the edges in the unit graph
 */
interface UnitEdge extends Edge {
  data?: {
    type: 'prerequisite' | 'parent';
  }
}

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
    DividerModule
  ],
  templateUrl: './unit-map.component.html',
  styleUrl: './unit-map.component.scss'
})
export class UnitMapComponent implements OnInit, OnDestroy {
  @ViewChild('graphContainer') graphContainer!: ElementRef;

  nodes: UnitNode[] = [];
  edges: UnitEdge[] = [];
  layout = 'dagre';
  curve = shape.curveBasis;

  center$: Subject<boolean> = new Subject();
  zoomToFit$: Subject<NgxGraphZoomOptions> = new Subject();

  isLoading: boolean = false;

  unit: Unit | null = null;
  prerequisiteNumReq: number = 0;
  prerequisiteUnitCodes: string[] | null = null;
  parentUnitCodes: string[] | null = null;


  /**
   * === Constructor ===
   */
  constructor (
    private apiService: ApiService,
    private router: Router
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
   * Fetches the current unit and its prerequisites and parent units, then build 
   * the graph.
   * 
   * The graph is built by adding the current unit as the root node, prereqs as 
   * 'prerequisite' nodes, and parent units as 'parent' nodes.
   * 
   * The edges are then added between the current unit and its prerequisites, 
   * and the current unit and its parent units.
   */
  fetchAndBuildUnitGraph() {
    // Get the current unit's unitcode from the url
    const unitCode = this.router.url.split('/')[2];
    
    // Fetch the current unit
    this.apiService.getUnitByUnitcodeGET(unitCode).subscribe({
      next: (unit: Unit) => {
        // ? Debug log: Current unit
        console.log('Current unit:', unit);

        // Save the unit
        this.unit = unit;
        
        // Add current unit node from router param
        const currentNode: UnitNode = {
          id: unit.unitCode,
          label: unit.unitCode.toUpperCase(),
          data: { 
            type: 'current',
            name: unit.name
          }
        };
        // ? Debug log: Current node
        console.log('Current node:', currentNode);

        // Initalise arrays for prerequisites
        let prereqNodes: UnitNode[] = [];
        let prereqEdges: UnitEdge[] = [];
        
        // Only process prerequisites if they exist
        if (unit.requisites?.prerequisites && unit.requisites.prerequisites.length > 0) {
          // Add prerequisite nodes
          prereqNodes = unit.requisites.prerequisites
            .flatMap(group => group.units)
            .map(code => ({
              id: code,
              label: code.toUpperCase(),
              data: {  type: 'prerequisite', name: code }
            }));

          // Save the prerequisite unit codes
          this.prerequisiteUnitCodes = prereqNodes.map(node => ' ' + node.label);
          // Save the prerequisite number required
          this.prerequisiteNumReq = unit.requisites.prerequisites[0].NumReq;
          
          // Add prerequisite edges
          prereqEdges = prereqNodes.map(node => ({
            id: `${node.id}-${currentNode.id}`,
            source: node.id,
            target: currentNode.id,
            data: { type: 'prerequisite' }
          }));
        }

        // Set initial nodes and edges
        this.nodes = [currentNode, ...prereqNodes];
        this.edges = prereqEdges;


        // Fetch the units that are required by the current unit
        this.apiService.getUnitsRequiringUnitGET(unit.unitCode).subscribe({
          next: (parentUnits) => {
            // ? Debug log: Fetched parent units
            console.log('Parent units:', parentUnits);
            
            // Add parent nodes
            const parentNodes: UnitNode[] = parentUnits.map(parent => ({
              id: parent.unitCode,
              label: parent.unitCode.toUpperCase(),
              data: { 
                type: 'parent',
                name: parent.name
              }
            }));

            // Save the parent unit codes
            this.parentUnitCodes = parentNodes.map(node => ' ' + node.label);

            // ? Debug log: Parent nodes
            console.log('Parent nodes:', parentNodes);
  
            // Add edges from current node to parent nodes
            const parentEdges: UnitEdge[] = parentNodes.map(node => ({
              id: `${currentNode.id}-${node.id}`,
              source: currentNode.id,
              target: node.id,
              data: { type: 'parent' }
            }));

            // ? Debug log: Parent edges
            console.log('Parent edges:', parentEdges);
            
            // Add parent nodes and edges to the graph
            this.nodes = [...this.nodes, ...parentNodes];
            this.edges = [...this.edges, ...parentEdges];
            
            // ? Debug log: Final graph state
            console.log('Final graph state:', {
              nodes: this.nodes,
              edges: this.edges
            });

            // Center the graph
            this.centerGraph();
          }
        });
      }
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
}
