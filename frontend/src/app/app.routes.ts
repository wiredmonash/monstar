import { Routes } from '@angular/router';

// Component Imports
import { HomeComponent } from './routes/home/home.component';
import { UnitListComponent } from './routes/unit-list/unit-list.component';
import { UnitReviewHeaderComponent } from './unit-review-header/unit-review-header.component';

export const routes: Routes = [
    // Homepage
    { path: "homepage", component: HomeComponent },
    // Unit List 
    { path: "unit-list", component: UnitListComponent },
    // Unit Review Header
    { path: "unit-review-header", component: UnitReviewHeaderComponent } // New route
];
