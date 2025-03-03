import { Routes } from '@angular/router';

// Component Imports
import { HomeComponent } from './routes/home/home.component';
import { UnitListComponent } from './routes/unit-list/unit-list.component';
import { UnitOverviewComponent } from './routes/unit-overview/unit-overview.component';
import { VerifiedComponent } from './routes/verified/verified.component';
import { NotFoundComponent } from './routes/not-found/not-found.component';
import { ResetPasswordComponent } from './routes/reset-password/reset-password.component';
import { UnitMapComponent } from './routes/unit-map/unit-map.component';
import { TermsAndCondsComponent } from './routes/terms-and-conds/terms-and-conds.component';
import { AboutComponent } from './routes/about/about.component';

export const routes: Routes = [
    // Homepage
    { path: "", component: HomeComponent },
    // Unit List 
    { path: "unit-list", component: UnitListComponent },
    // Unit Overview
    { path: 'unit-overview/:unitcode', component: UnitOverviewComponent },
    // Unit Map
    { path: 'unit-map/:unitcode', component: UnitMapComponent },
    // Email Verification
    { path: 'verify-email/:token', component: VerifiedComponent }, 
    // Reset Password
    { path: 'reset-password/:token', component: ResetPasswordComponent }, 
    // Terms and Conditions Page
    { path: 'terms-and-conditions', component: TermsAndCondsComponent }, 
    // About Page
    { path: 'about', component: AboutComponent },
    
    // 404 Not Found for all other routes
    { path: '**', component: NotFoundComponent },
];
