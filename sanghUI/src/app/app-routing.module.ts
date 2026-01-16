import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegisterUserComponent } from './core/components/account/register-user/register-user.component';
import { HomeComponent } from './core/components/home/home.component';
import { LoginComponent } from './core/components/account/login/login.component';
import { UserDashboardComponent } from './core/components/account/user-dashboard/user-dashboard.component';
import { AuthGuard } from './services/auth.gaurd';
import { PersonalInformationComponent } from './core/components/account/personal-information/personal-information.component';
import { CreateCorporateAccountComponent } from './core/components/account/create-corporate-account/create-corporate-account.component';
import { LogOutComponent } from './core/components/account/log-out/log-out.component';
import { CorporateAccountListComponent } from './core/components/account/corporate-account-list/corporate-account-list.component';
import { CreateUserAccountComponent } from './core/components/account/create-user-account/create-user-account.component';
import { UserAccountListComponent } from './core/components/account/user-account-list/user-account-list.component';
import { UploadDocumentComponent } from './core/components/account/upload-document/upload-document.component';
import { LabDetailsComponent } from './core/components/account/lab-details/lab-details.component';
import { HealthScoreComponent } from './core/components/account/health-score/health-score.component';
import { YatriksComponent } from './core/components/account/yatriks/yatriks.component';
import { DailyTasksComponent } from './core/components/account/daily-tasks/daily-tasks.component';
import { QuizComponent } from './core/components/account/quiz/quiz.component';
import { TentInfoComponent } from './core/components/account/tent-info/tent-info.component';
import { EventsComponent } from './core/components/account/events/events.component';
import { RoomInfoComponent } from './core/components/account/room-info/room-info.component';
import { TravelInfoComponent } from './core/components/account/travel-info/travel-info.component';
import { BusInfoComponent } from './core/components/account/bus-info/bus-info.component';
import { MumbaiEventsComponent } from './core/components/account/mumbai-events/mumbai-events.component';
import { PuneEventsComponent } from './core/components/account/pune-events/pune-events.component';
import { UserProfileComponent } from './core/components/account/user-profile/user-profile.component';
import { PatrikaLekhanComponent } from './core/components/account/patrika-lekhan/patrika-lekhan.component';
import { JainConcertComponent } from './core/components/account/jain-concert/jain-concert.component';
import { LeaderBoardComponent } from './leader-board/leader-board.component';
const routes: Routes = [
    {
    path: '',
    component: LoginComponent,
    pathMatch: 'full'
  },
  {
    path: 'register',
    component: RegisterUserComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'logout',
    component: LogOutComponent
  },
  {
    path: 'dashboard',
    component: UserDashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'personalinformation',
    component: PersonalInformationComponent,
    canActivate: [AuthGuard]
  }
  ,
   {
    path: 'dailytasks',
    component: DailyTasksComponent,
    canActivate: [AuthGuard]
  }
  ,

   {
    path: 'tentinfo',
    component: TentInfoComponent,
    canActivate: [AuthGuard]
  }
  ,
     {
    path: 'roominfo',
    component: RoomInfoComponent,
    canActivate: [AuthGuard]
  }
  ,
      {
    path: 'travelinfo',
    component: TravelInfoComponent,
    canActivate: [AuthGuard]
  }
  ,
    
      {
    path: 'businfo',
    component: BusInfoComponent,
    canActivate: [AuthGuard]
  }
  ,
  {
    path: 'corporateaccount',
    component: CorporateAccountListComponent,
    canActivate: [AuthGuard]
  }
  ,

    {
    path: 'events',
    component: EventsComponent,
    canActivate: [AuthGuard]
  }
  ,
      {
    path: 'mumbai',
    component: MumbaiEventsComponent,
    canActivate: [AuthGuard]
  }
  ,

      {
    path: 'pune',
    component: PuneEventsComponent,
    canActivate: [AuthGuard]
  }
  ,
      {
    path: 'profile',
    component: UserProfileComponent,
    canActivate: [AuthGuard]
  }
  ,

        {
    path: 'patrikalekhan',
    component: PatrikaLekhanComponent,
    canActivate: [AuthGuard]
  }
  ,
        {
    path: 'jainconcert',
    component: JainConcertComponent,
    canActivate: [AuthGuard]
  }
  ,

 {
    path: 'quizes',
    component: QuizComponent,
    canActivate: [AuthGuard]
  }
  ,
  {
    path: 'useraccount',
    component: UserAccountListComponent,
    canActivate: [AuthGuard]
  }
  ,
  {
    path: 'createuseraccount',
    component: CreateUserAccountComponent,
    canActivate: [AuthGuard]
  }
  ,
  {
    path: 'createcorporateaccount',
    component: CreateCorporateAccountComponent,
    canActivate: [AuthGuard]
  }
  ,
  {
    path: 'uploaddoc',
    component: UploadDocumentComponent,
    canActivate: [AuthGuard]
  } ,
  {
    path: 'labdetails',
    component: LabDetailsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'healthScore',
    component: HealthScoreComponent,
    canActivate: [AuthGuard]
  },
    {
    path: 'yatriks',
    component: YatriksComponent
  },
  {
    path:'leaderboard',
    component: LeaderBoardComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
