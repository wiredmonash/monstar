import { Routes } from '@angular/router';

// Component Imports
import { HomeComponent } from './routes/home/home.component';
import { UnitListComponent } from './routes/unit-list/unit-list.component';
import { UnitReviewHeaderComponent } from './shared/components/unit-review-header/unit-review-header.component';
import { UnitOverviewComponent } from './routes/unit-overview/unit-overview.component';

export const routes: Routes = [
    // Homepage
    { path: "", component: HomeComponent },
    // Unit List 
    { path: "unit-list", component: UnitListComponent },

    //! DEBUGGING ROUTES (Currently shows just FIT1045)
    { path: 'unit-overview', component: UnitOverviewComponent}
];
