import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignoffBuildComponent } from './signoff-build.component';

describe('SignoffBuildComponent', () => {
  let component: SignoffBuildComponent;
  let fixture: ComponentFixture<SignoffBuildComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignoffBuildComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignoffBuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
