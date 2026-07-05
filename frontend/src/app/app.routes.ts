import { Routes } from '@angular/router';
import { environment } from '../environments/environment';

// Component Imports
import { AuthComponent } from '@routes/auth/auth.component';
import { UserProfileComponent } from '@routes/user-profile/user-profile.component';
import { AboutComponent } from './routes/about/about.component';
import { ChangelogComponent } from './routes/changelog/changelog.component';
import { HomeComponent } from './routes/home/home.component';
import { NotFoundComponent } from './routes/not-found/not-found.component';
import { SetuOverviewComponent } from './routes/setu-overview/setu-overview.component';
import { TermsAndCondsComponent } from './routes/terms-and-conds/terms-and-conds.component';
import { UnitListComponent } from './routes/unit-list/unit-list.component';
import { UnitMapComponent } from './routes/unit-map/unit-map.component';
import { UnitOverviewComponent } from './routes/unit-overview/unit-overview.component';
import { JobsBoardComponent } from './routes/jobs-board/jobs-board.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'list', component: UnitListComponent },
  { path: 'user/:username', component: UserProfileComponent },
  { path: 'unit/:unitcode', component: UnitOverviewComponent },
  { path: 'map/:unitcode', component: UnitMapComponent },
  ...(environment.enableSetuCards
    ? [{ path: 'setu/:unitCode', component: SetuOverviewComponent }]
    : []),
  { path: 'terms-and-conditions', component: TermsAndCondsComponent },
  { path: 'jobs', component: JobsBoardComponent },
  { path: 'about', component: AboutComponent },
  { path: 'changelog', component: ChangelogComponent },

  // 404 Not Found for all other routes
  { path: '**', component: NotFoundComponent },
];
