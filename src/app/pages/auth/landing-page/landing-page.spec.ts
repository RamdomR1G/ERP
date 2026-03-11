import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LandingPageComponent } from "./landing-page";

describe ('LandingPageComponent', () => {
  let component: LandingPageComponent;
  let fixture: ComponentFixture<LandingPageComponent>;

  beforeEach(async () => {        
    await TestBed.configureTestingModule({
      declarations: [LandingPageComponent]})
    fixture = TestBed.createComponent(LandingPageComponent);
    component = fixture.componentInstance;
  });
  it ('should create the landing page component', () => {
    expect(component).toBeTruthy();
  });
});