import { Component, OnInit } from '@angular/core';
import { ViewportService } from '../../shared/services/viewport.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent implements OnInit {

  viewportType: string = 'desktop';


  constructor(
    private viewportService: ViewportService
  ) { }


  ngOnInit(): void {
    this.viewportService.viewport$.subscribe(type => {
      this.viewportType = type;
    });
  }

}