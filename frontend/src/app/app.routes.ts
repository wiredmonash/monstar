import { Routes } from '@angular/router';

// Component Imports
import { HomeComponent } from './routes/home/home.component';
import { UnitListComponent } from './routes/unit-list/unit-list.component';

export const routes: Routes = [
    // Homepage
    { path: "homepage", component: HomeComponent},
    // Unit List 
    { path: "unit-list", component: UnitListComponent},
];
