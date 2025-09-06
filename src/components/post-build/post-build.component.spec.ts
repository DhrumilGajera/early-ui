import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostBuildComponent } from './post-build.component';

describe('PostBuildComponent', () => {
  let component: PostBuildComponent;
  let fixture: ComponentFixture<PostBuildComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostBuildComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostBuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
