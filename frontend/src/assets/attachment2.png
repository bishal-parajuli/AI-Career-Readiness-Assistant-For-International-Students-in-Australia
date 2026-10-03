Upgrade the existing **AI Resume Feedback** functionality so that the feedback is genuinely **dynamic, resume-specific, and target-role-specific**.

IMPORTANT:

* Do NOT redesign the existing application.
* Do NOT remove or change the existing screens or navigation.
* Keep the current minimalist professional UI.
* Improve the underlying prototype logic and feedback generation.
* The current problem is that different resumes and different target positions produce almost identical feedback. This MUST be fixed.

## 1. DYNAMIC INPUT ANALYSIS

The Resume Feedback feature must analyse the actual information provided by the user rather than displaying generic predefined feedback.

The analysis should consider:

### Resume content

* Name and professional summary
* Education
* Work experience
* Job titles
* Responsibilities
* Achievements
* Technical skills
* Soft skills
* Certifications
* Projects
* Tools and technologies
* Employment history
* Resume structure
* Formatting
* Writing clarity
* Relevance of experience

### Target role

Use the user's selected or entered target role as a major factor in the analysis.

For example:

If the target role is:
“Software Developer”

Prioritise:

* Programming languages
* Software development projects
* Git/GitHub
* Databases
* APIs
* Testing
* Software development methodologies
* Relevant technical experience

If the target role is:
“Cybersecurity Analyst”

Prioritise:

* Cybersecurity tools
* Security frameworks
* SIEM
* Threat detection
* Incident response
* Network security
* Security certifications
* Relevant security projects

If the target role is:
“Marketing Coordinator”

Prioritise:

* Marketing campaigns
* Digital marketing
* Content creation
* Analytics
* Communication
* Social media
* Campaign performance
* Customer engagement

The feedback MUST change according to the target role.

## 2. ROLE-RESUME MATCH ANALYSIS

Add a dedicated section:

“Role Relevance”

Compare the actual resume content with the selected target role.

Show:

### Strongly relevant

Identify specific skills, experience, projects or qualifications from the uploaded resume that are relevant to the target role.

### Partially relevant

Identify areas that have some relevance but could be presented more clearly.

### Missing or underrepresented

Identify important role-relevant skills or evidence that are not visible in the resume.

Do NOT invent qualifications, skills, employment history or achievements that are not present in the resume.

## 3. SPECIFIC FEEDBACK

Do NOT use generic statements such as:

“Add more relevant skills.”

Instead, reference the actual resume content.

For example:

WEAK:
“Your technical skills section could be improved.”

STRONG:
“Your resume lists Python, Java and SQL, but the target Software Developer role is not clearly connected to these skills. Consider linking these technologies to specific projects or work experience already included in your resume.”

Another example:

WEAK:
“Add measurable achievements.”

STRONG:
“Your experience at ABC Retail describes customer service responsibilities but does not currently show measurable outcomes. If you have accurate figures, consider adding information such as the number of customers served, sales targets achieved, or process improvements.”

The system must reference information actually found in the uploaded resume.

## 4. DIFFERENT RESUMES MUST PRODUCE DIFFERENT FEEDBACK

The prototype must NOT return the same feedback template for every resume.

For example:

Resume A:
Software Developer with Python, Java, SQL and university projects.

Target role:
Software Developer

Feedback should focus on:

* Technical skills
* Projects
* Programming experience
* Git/GitHub
* Software development evidence
* Databases
* Technical achievements

Resume B:
Registered Nurse with clinical placement and patient-care experience.

Target role:
Registered Nurse

Feedback should focus on:

* Clinical experience
* Patient care
* Relevant qualifications
* Registration/certifications
* Clinical skills
* Communication
* Healthcare experience

Resume C:
Marketing graduate with social media and campaign experience.

Target role:
Marketing Coordinator

Feedback should focus on:

* Marketing experience
* Campaigns
* Digital marketing
* Content
* Analytics
* Communication
* Measurable campaign outcomes

The feedback should clearly demonstrate that the AI has understood the differences between the resumes.

## 5. DIFFERENT TARGET ROLES MUST CHANGE THE FEEDBACK

The SAME resume should also produce different feedback when the target role changes.

Example:

Same resume:
Bachelor of IT + Python + SQL + university projects + customer service experience.

Target role 1:
Software Developer

Focus on:
Programming, projects, databases, Git, software development.

Target role 2:
Data Analyst

Focus on:
Python, SQL, data analysis, visualisation, statistics, analytical projects.

Target role 3:
IT Support Officer

Focus on:
Technical troubleshooting, customer service, communication, systems, hardware/software support.

The feedback should change substantially based on the target role.

## 6. FEEDBACK CATEGORIES

Generate feedback dynamically across these categories:

1. Overall Resume Relevance
2. Role Relevance
3. Professional Summary
4. Skills
5. Work Experience
6. Projects
7. Education
8. Achievements
9. Structure & Formatting
10. Clarity & Language
11. Australian Employment Context
12. Missing or Underrepresented Evidence
13. Suggested Improvements

Do not force every category to have the same number of recommendations.

If a category is already strong, say so.

If a category is not relevant to the user's resume, explain why rather than generating artificial criticism.

## 7. EVIDENCE-BASED FEEDBACK

Every important recommendation should be based on evidence from the uploaded resume.

Use this structure:

### Observation

What was actually found in the resume.

### Why it matters

Explain why this matters for the selected target role.

### Suggested improvement

Provide a practical improvement.

Example:

Observation:
“Your resume includes an AWS EC2 deployment project.”

Why it matters:
“This is relevant to cloud-oriented IT roles because it demonstrates practical exposure to cloud infrastructure.”

Suggested improvement:
“Consider making the AWS project more prominent and briefly describing what you deployed and what technologies you used.”

Do NOT fabricate evidence.

## 8. PRIORITISE FEEDBACK

Instead of giving the same generic six recommendations every time, identify the most important issues for THIS resume.

Use:

### High Priority

Issues that significantly affect role relevance or clarity.

### Medium Priority

Useful improvements that would strengthen the resume.

### Low Priority

Minor formatting or wording improvements.

The priorities must be calculated from the actual resume and target role.

## 9. POSITIVE FEEDBACK MUST ALSO BE SPECIFIC

Do not always say:

“Your resume has a strong foundation.”

Instead identify actual strengths.

Example:

“Your resume demonstrates practical AWS experience through your EC2 deployment project, which is relevant to cloud-focused IT positions.”

Or:

“Your customer service experience demonstrates transferable communication skills that may support an IT support role.”

Positive feedback must also be based on the uploaded resume.

## 10. AVOID HALLUCINATIONS

This is critical.

The AI must NEVER:

* Invent employment experience
* Invent qualifications
* Invent certifications
* Invent technical skills
* Invent achievements
* Invent metrics
* Invent employers
* Assume the user has a skill because it is common for the target role

If something is missing, explicitly state:

“This information was not identified in the provided resume.”

If a recommendation requires information that is not provided, say:

“If applicable, consider adding…”

## 11. AVOID ARBITRARY EMPLOYABILITY SCORES

Do NOT generate:

* “You are 85% employable”
* “Your resume is 92% compatible”
* “You have a 78% chance of getting the job”

Instead provide an evidence-based qualitative assessment such as:

“Your resume shows several relevant technical skills, but the connection between these skills and your practical project experience could be made clearer.”

## 12. AUSTRALIAN CONTEXT

When appropriate, consider Australian resume conventions, including:

* Clear professional summary
* Relevant skills
* Achievement-oriented experience
* Concise formatting
* Appropriate spelling using Australian English
* Clear project descriptions
* Relevant qualifications
* Avoiding unnecessary personal information

Do not assume that every Australian employer uses exactly the same resume format.

## 13. REALISTIC AI PROCESS

Make the prototype visually communicate that the AI is actually analysing the user's information.

During analysis show:

“Reading resume…”

then:

“Identifying skills and experience…”

then:

“Comparing resume with target role…”

then:

“Generating personalised recommendations…”

then:

“Analysis complete”

This should lead into the feedback results screen.

## 14. RESULTS SCREEN

Update the existing Resume Feedback Results screen so that it includes:

### Resume Overview

A short summary based specifically on the uploaded resume.

### Target Role

Display the selected target role.

### Role Relevance

Explain how the resume aligns with that role.

### Key Strengths

Specific strengths identified from the resume.

### Priority Improvements

Specific improvements based on the resume and role.

### Detailed Feedback

Expandable cards for:

* Summary
* Skills
* Experience
* Projects
* Education
* Formatting
* Relevance

### Missing / Underrepresented Evidence

Identify important areas that are not sufficiently demonstrated.

### Suggested Improvements

Specific, actionable recommendations.

## 15. DEMONSTRATION TEST CASES

Build the prototype logic so the following tests produce clearly different outputs:

TEST 1:
Resume = IT graduate with Python, Java, SQL, AWS and university projects
Target role = Software Developer

TEST 2:
Same resume
Target role = Data Analyst

TEST 3:
Same resume
Target role = IT Support Officer

TEST 4:
Resume = Nursing graduate with clinical placement and patient-care experience
Target role = Registered Nurse

TEST 5:
Resume = Business/Marketing graduate with campaign and social media experience
Target role = Marketing Coordinator

The output for these test cases must be materially different.

## 16. MOST IMPORTANT REQUIREMENT

The prototype should demonstrate:

INPUT
→ Actual Resume Content
→ Target Role
→ Resume/Role Comparison
→ Evidence Extraction
→ Personalised Analysis
→ Role-Specific Recommendations
→ Feedback Results

NOT:

INPUT
→ Generic Resume Feedback Template

The purpose of this feature is to demonstrate a credible **AI-powered personalised resume feedback system**, not a static resume checklist.

Keep the existing visual design and navigation unchanged. Only strengthen the intelligence, personalisation, data-driven feedback and prototype interactions.
