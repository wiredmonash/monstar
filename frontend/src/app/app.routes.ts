import { Routes } from '@angular/router';

// Component Imports
import { HomeComponent } from './routes/home/home.component';
import { UnitListComponent } from './routes/unit-list/unit-list.component';
import { UnitOverviewComponent } from './routes/unit-overview/unit-overview.component';
import { VerifiedComponent } from './routes/verified/verified.component';
import { NotFoundComponent } from './routes/not-found/not-found.component';
import { ResetPasswordComponent } from './routes/reset-password/reset-password.component';
import { UnitMapComponent } from './routes/unit-map/unit-map.component';

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
    
    // 404 Not Found for all other routes
    { path: '**', component: NotFoundComponent },
];
