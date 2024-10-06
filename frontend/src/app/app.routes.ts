import { Routes } from '@angular/router';

// Component Imports
import { HomeComponent } from './routes/home/home.component';
import { UnitListComponent } from './routes/unit-list/unit-list.component';
import { UnitOverviewComponent } from './routes/unit-overview/unit-overview.component';

export const routes: Routes = [
    // Homepage
    { path: "homepage", component: HomeComponent},
    // Unit List 
    { path: "unit-list", component: UnitListComponent},

    //! DEBUGGING ROUTES
    { path: 'unit-overview', component: UnitOverviewComponent}
];
