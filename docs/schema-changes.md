# Schema Changes

## Week 5 Implementation Update

The ERD was modified to represent the changes to the prototype based on feedback from the lecture team and further development. The Interview Session and Interview Question entities were extended to provide storage for additional settings such as industry, interview type, difficulty level, number of questions, question type, guidance, and sample answers.

In addition, two new entities, Job Advertisement and Job Match Analysis, were developed to accommodate the job advertisement matching feature, which compares users' resumes with job advertisement information entered by users.

These modifications increased the model from seven entities to nine entities while maintaining the existing structure for providing resume feedback and interview preparation.
### User Profile Persistence Refinement

During Week 5 implementation, the `USER` entity was refined by adding a nullable `preferred_name` attribute. The approved prototype includes an Edit Profile function that allows users to update their displayed name and email address. Initially, the displayed name was maintained only in frontend state and was therefore lost after logout. Adding `preferred_name` enables the user's chosen display name to be stored persistently in the database and retrieved during subsequent logins.

This is an implementation-level refinement rather than a change to the core MVP scope. No new entity or relationship was introduced, and the existing `USER` relationships remain unchanged.