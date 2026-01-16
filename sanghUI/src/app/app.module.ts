import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { NavbarComponent } from './core/components/navbar/navbar.component';
import { FooterComponent } from './core/components/footer/footer.component';

import { RegisterUserComponent } from './core/components/account/register-user/register-user.component';
import { LoginComponent } from './core/components/account/login/login.component';
import { HomeComponent } from './core/components/home/home.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { UserDashboardComponent } from './core/components/account/user-dashboard/user-dashboard.component';
import { PersonalInformationComponent } from './core/components/account/personal-information/personal-information.component';

import { CommonModule, DatePipe } from '@angular/common';

import { CreateCorporateAccountComponent } from './core/components/account/create-corporate-account/create-corporate-account.component';
import { LogOutComponent } from './core/components/account/log-out/log-out.component';
import { DynamicMenusComponent } from './core/components/account/dynamic-menus/dynamic-menus.component';
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

import { JwtInterceptor } from './services/interceptors/jwt.interceptor';
import { PatrikaLekhanComponent } from './core/components/account/patrika-lekhan/patrika-lekhan.component';
import { JainConcertComponent } from './core/components/account/jain-concert/jain-concert.component';
import { LeaderBoardComponent } from './leader-board/leader-board.component';
@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    FooterComponent,
    RegisterUserComponent,
    LoginComponent,
    HomeComponent,
    UserDashboardComponent,
    PersonalInformationComponent,
    CreateCorporateAccountComponent,
    CreateUserAccountComponent,
    LogOutComponent,
    DynamicMenusComponent,
    CorporateAccountListComponent,
    UserAccountListComponent,
    UploadDocumentComponent,
    LabDetailsComponent,
    HealthScoreComponent,
    YatriksComponent,
    DailyTasksComponent,
    QuizComponent,
    TentInfoComponent,
    EventsComponent,
    RoomInfoComponent,
    TravelInfoComponent,
    BusInfoComponent,
    MumbaiEventsComponent,
    PuneEventsComponent,
    UserProfileComponent,
    PatrikaLekhanComponent,
    JainConcertComponent,
    LeaderBoardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    CommonModule
  ],
  providers: [
    DatePipe,

    // ✅ Automatically adds Authorization: Bearer <jwt> to every request
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
