import { Routes } from '@angular/router';

// Component Imports
import { HomeComponent } from './routes/home/home.component';
import { UnitListComponent } from './routes/unit-list/unit-list.component';
import { UnitReviewHeaderComponent } from './shared/components/unit-review-header/unit-review-header.component';
import { UnitOverviewComponent } from './routes/unit-overview/unit-overview.component';
import { ProfileComponent } from './shared/components/profile/profile.component';
import { VerifiedComponent } from './routes/verified/verified.component';

export const routes: Routes = [
    // Homepage
    { path: "", component: HomeComponent },
    // Unit List 
    { path: "unit-list", component: UnitListComponent },
    // Unit Overview
    { path: 'unit-overview/:unitcode', component: UnitOverviewComponent},
    // Email Verification
    { path: 'verify-email/:token', component: VerifiedComponent }
];
