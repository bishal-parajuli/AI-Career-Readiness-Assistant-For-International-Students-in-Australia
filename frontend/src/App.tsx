import { useState, useEffect, useCallback, useRef } from "react";

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
type Screen =
  | "landing"
  | "auth"
  | "onboarding"
  | "dashboard"
  | "resume-upload"
  | "resume-analysing"
  | "resume-results"
  | "interview-setup"
  | "interview-question"
  | "interview-feedback"
  | "interview-summary"
  | "progress"
  | "responsible-ai"
  | "job-match-input"
  | "job-match-analysing"
  | "job-match-results"
  | "resume-error"
  | "interview-generating"
  | "interview-error"
  | "interview-feedback-generating"
  | "interview-feedback-error"
  | "job-match-error";

type NavItem = "dashboard" | "resume" | "interview" | "job-matching" | "progress" | "responsible-ai";

/* ─────────────────────────────────────────
   Dynamic Resume Feedback Engine
───────────────────────────────────────── */

interface FeedbackItem { observation: string; why: string; suggestion: string; priority: "High" | "Medium" | "Low"; }
interface FeedbackSection { title: string; icon: string; summary: string; items: FeedbackItem[]; }
interface ResumeFeedback {
  overview: string;
  targetRole: string;
  resumeLabel: string;
  roleRelevance: { strong: string[]; partial: string[]; missing: string[] };
  strengths: string[];
  sections: FeedbackSection[];
}
function mapAIResumeFeedback(
  apiData: any,
  fileName: string
): ResumeFeedback {
  const items = Array.isArray(apiData.feedback)
    ? apiData.feedback
    : [];

  const strengths = items
    .filter((item: any) => item.type === "strength")
    .map((item: any) => item.text);

  const improvements = items.filter(
    (item: any) =>
      item.type === "improvement" ||
      item.type === "recommendation"
  );

  const grouped = new Map<string, any[]>();

  items.forEach((item: any) => {
    const category = item.category || "General feedback";

    if (!grouped.has(category)) {
      grouped.set(category, []);
    }

    grouped.get(category)!.push(item);
  });

  const sections: FeedbackSection[] = Array.from(
    grouped.entries()
  ).map(([category, categoryItems]) => ({
    title: category,
    icon: "✦",
    summary: `AI feedback for ${category.toLowerCase()}.`,
    items: categoryItems.map((item: any) => ({
      observation: item.text,
      why:
        item.type === "strength"
          ? "This is a positive feature identified in your resume."
          : "This area may affect how clearly your experience and suitability are communicated.",
      suggestion: item.text,
      priority:
        item.priority === "high"
          ? "High"
          : item.priority === "low"
          ? "Low"
          : "Medium",
    })),
  }));

  return {
    overview:
      strengths.length > 0
        ? `Your resume shows relevant strengths for the ${
            apiData.target_role || "selected"
          } role. The AI analysis also identified ${
            improvements.length
          } area${improvements.length === 1 ? "" : "s"} where your resume could be strengthened.`
        : `The AI analysis identified ${
            improvements.length
          } area${improvements.length === 1 ? "" : "s"} where your resume could be strengthened.`,

    targetRole: apiData.target_role || "Not specified",

    resumeLabel: fileName || "Resume",

    roleRelevance: {
      strong: strengths,
      partial: improvements
        .filter((item: any) => item.priority !== "high")
        .map((item: any) => item.text),
      missing: improvements
        .filter((item: any) => item.priority === "high")
        .map((item: any) => item.text),
    },

    strengths,

    sections,
  };
}


type ResumeType = "it-grad" | "nurse" | "marketing" | "generic";

function detectResumeType(text: string): ResumeType {
  const t = text.toLowerCase();
  const itScore = (t.match(/python|java|sql|aws|git|software|developer|programming|database|api|react|node|algorithm|cloud|docker|kubernetes|agile|scrum/g) || []).length;
  const nurseScore = (t.match(/nursing|nurse|clinical|patient|ward|hospital|healthcare|medication|care|medical|placement|registered|midwife/g) || []).length;
  const mktScore = (t.match(/marketing|campaign|social media|content|seo|digital|brand|analytics|engagement|advertising|copywriting|crm|hubspot/g) || []).length;
  if (nurseScore >= 2) return "nurse";
  if (mktScore >= 2) return "marketing";
  if (itScore >= 2) return "it-grad";
  return "generic";
}

function detectRoleCategory(role: string): string {
  const r = role.toLowerCase();
  if (r.includes("data analyst") || r.includes("data science")) return "data";
  if (r.includes("support") || r.includes("helpdesk") || r.includes("it support")) return "itsupport";
  if (r.includes("cyber") || r.includes("security analyst") || r.includes("infosec")) return "cyber";
  if (r.includes("software") || r.includes("developer") || r.includes("engineer") || r.includes("full stack") || r.includes("backend") || r.includes("frontend")) return "software";
  if (r.includes("nurs") || r.includes("midwi") || r.includes("healthcare") || r.includes("clinical")) return "nursing";
  if (r.includes("market") || r.includes("coordinator") || r.includes("brand") || r.includes("digital")) return "marketing";
  return "general";
}

function generateFeedback(resumeText: string, targetRole: string, fileName: string): ResumeFeedback {
  const resumeType = detectResumeType(resumeText);
  const roleCategory = detectRoleCategory(targetRole);
  const t = resumeText.toLowerCase();

  // ── IT Graduate resume ──────────────────────────────────────────
  if (resumeType === "it-grad" && roleCategory === "software") {
    return {
      overview: "Your resume demonstrates a solid technical foundation for a Software Developer role. You have listed relevant programming languages and include university project experience. The main opportunities for improvement are connecting your technical skills to concrete project outcomes and presenting your experience using achievement-oriented language typical of Australian graduate applications.",
      targetRole: targetRole, resumeLabel: fileName,
      roleRelevance: {
        strong: ["Python, Java and SQL directly align with Software Developer requirements", "University software projects demonstrate practical application of skills", "Academic qualification in IT provides foundational credibility"],
        partial: ["Technical skills are listed but not connected to specific work or project contexts", "Project descriptions mention technologies but do not clearly describe outcomes or your individual contribution"],
        missing: ["No mention of version control (Git/GitHub) was identified in the provided resume", "Software development methodology experience (Agile, Scrum) was not identified", "No evidence of API design, integration or testing was found"],
      },
      strengths: [
        "Your resume includes Python, Java and SQL — three skills directly relevant to most Software Developer roles in Australia.",
        "Including university projects shows practical application of technical knowledge, which is valued in graduate hiring.",
        "Your academic qualification in Information Technology establishes a credible foundation for the target role.",
      ],
      sections: [
        { title: "Skills", icon: "⚙️", summary: "Technical skills are present but need stronger contextualisation.", items: [
          { observation: "Your resume lists Python, Java and SQL in a skills section.", why: "These are relevant to the Software Developer role, but listing skills without context makes it difficult for employers to assess your depth of experience.", suggestion: "For each key skill, briefly note the context — e.g. 'Python (data processing scripts, university projects)' — to demonstrate applied experience rather than theoretical knowledge.", priority: "High" },
          { observation: "No mention of Git or GitHub was identified in the provided resume.", why: "Version control is considered a baseline expectation for Software Developer roles in Australia. Its absence may raise questions for technical reviewers.", suggestion: "If you have used Git in your university projects or personal work, add it explicitly to your skills section and reference it in relevant project descriptions.", priority: "High" },
        ]},
        { title: "Projects", icon: "🗂", summary: "Projects exist but outcomes need to be more prominent.", items: [
          { observation: "Your university projects are listed with technology descriptions but limited outcome information.", why: "Australian graduate employers look for evidence of what you built and what it achieved — not only what technologies you used.", suggestion: "For each project, add one or two sentences describing the outcome: what the system did, who used it, or what problem it solved. Where accurate, include a quantitative detail such as 'reduced processing time by approximately 30%'.", priority: "High" },
          { observation: "The individual contribution within group projects is not clearly stated.", why: "Employers need to understand your specific role in team projects to assess your capabilities accurately.", suggestion: "Add a brief note to each team project clarifying your individual responsibility — e.g. 'Responsible for backend API design and database integration'.", priority: "Medium" },
        ]},
        { title: "Experience", icon: "💼", summary: "Work experience descriptions focus on duties rather than outcomes.", items: [
          { observation: "Experience descriptions use duty-focused language such as 'responsible for' and 'assisted with'.", why: "Australian employers typically respond better to achievement-oriented language that demonstrates impact rather than task completion.", suggestion: "Rewrite at least two experience bullet points using action verbs and outcome-focused language. For example: 'Developed a Python script that automated weekly data processing, reducing manual effort by approximately four hours per week' — only if this is accurate.", priority: "High" },
        ]},
        { title: "Australian Context", icon: "🇦🇺", summary: "A few Australian-specific elements could be added.", items: [
          { observation: "A LinkedIn profile link was not identified in the provided resume.", why: "Many Australian graduate employers expect a LinkedIn profile as part of the application package.", suggestion: "Add a professional LinkedIn profile URL in your contact section, and ensure your LinkedIn profile is up to date and consistent with your resume.", priority: "Medium" },
          { observation: "A referees section or 'referees available on request' note is not included.", why: "Australian resumes typically acknowledge referees, even if details are provided separately.", suggestion: "Add a brief referees section at the end of your resume, or note 'Referees available upon request'.", priority: "Low" },
        ]},
        { title: "Structure & Formatting", icon: "📄", summary: "Structure is clear; minor consistency improvements would help.", items: [
          { observation: "Section headings appear consistently formatted, which is a positive indicator.", why: "Consistent formatting is a signal of attention to detail valued in technical roles.", suggestion: "Ensure the same formatting is applied to all date ranges and location details for a fully polished appearance.", priority: "Low" },
        ]},
      ],
    };
  }

  if (resumeType === "it-grad" && roleCategory === "data") {
    return {
      overview: "Your IT graduate resume contains several skills relevant to a Data Analyst role — particularly Python and SQL. However, the resume is currently framed around software development. To strengthen the application for Data Analyst positions, you should foreground your analytical and data-handling experience and connect your technical skills explicitly to data tasks.",
      targetRole: targetRole, resumeLabel: fileName,
      roleRelevance: {
        strong: ["Python is directly relevant and widely used in data analysis workflows", "SQL demonstrates database querying capability, a core Data Analyst skill", "Academic IT background provides a credible quantitative foundation"],
        partial: ["University projects may include data tasks but are currently framed as software projects", "Some analytical thinking is implied but not explicitly positioned for a data context"],
        missing: ["No mention of data visualisation tools (Tableau, Power BI, matplotlib, seaborn) was identified", "Statistical analysis or data modelling experience was not identified in the provided resume", "No mention of working with datasets, data cleaning or exploratory analysis was found"],
      },
      strengths: [
        "Python and SQL are the two most commonly required skills in Data Analyst job descriptions in Australia — your resume already includes both.",
        "An IT academic background signals quantitative capability that many Data Analyst employers value.",
        "Including university projects provides a foundation to demonstrate applied analytical work, even without industry experience.",
      ],
      sections: [
        { title: "Skills", icon: "⚙️", summary: "Strong technical base, but data-specific tools are not represented.", items: [
          { observation: "Your resume lists Python and SQL but does not identify any data visualisation or analysis libraries.", why: "Data Analyst roles in Australia typically expect familiarity with tools such as Pandas, NumPy, matplotlib or Tableau alongside Python and SQL.", suggestion: "If you have used any of these tools in projects or coursework, add them explicitly. For example: 'Python (Pandas, NumPy, matplotlib — data analysis projects)'.", priority: "High" },
          { observation: "No statistical analysis or data modelling skills were identified in the provided resume.", why: "Data Analyst roles often require basic statistical understanding — correlation, regression, hypothesis testing — even at graduate level.", suggestion: "If your IT coursework included statistics or data analytics subjects, add these explicitly to your education or skills sections.", priority: "High" },
        ]},
        { title: "Projects", icon: "🗂", summary: "Projects exist but are not positioned for a data audience.", items: [
          { observation: "University projects are described using software development framing rather than data analysis framing.", why: "Employers reviewing Data Analyst applications look for evidence of working with data, drawing insights, and presenting findings — not only building software.", suggestion: "Review your existing project descriptions and reframe any data-related work. If a project involved data processing, querying or reporting, describe it in those terms — e.g. 'Analysed a dataset of X records using Python and SQL to identify Y'.", priority: "High" },
        ]},
        { title: "Experience", icon: "💼", summary: "Work experience could be reframed to highlight analytical thinking.", items: [
          { observation: "Work experience descriptions do not currently highlight any data-handling or analytical tasks.", why: "Even in non-analytical roles, evidence of working with numbers, reports, or systems is transferable to Data Analyst positions.", suggestion: "Review your experience entries and identify any tasks involving data, reporting, or problem-solving. Reframe these using data-relevant language where accurate.", priority: "Medium" },
        ]},
        { title: "Australian Context", icon: "🇦🇺", summary: "Standard Australian conventions apply.", items: [
          { observation: "A LinkedIn profile link was not identified in the provided resume.", why: "LinkedIn is widely used by Data Analyst recruiters in Australia to screen candidates.", suggestion: "Add your LinkedIn profile URL and ensure your profile reflects your interest in data analyst roles.", priority: "Medium" },
        ]},
        { title: "Structure & Formatting", icon: "📄", summary: "No significant structural issues identified.", items: [
          { observation: "The resume structure is clear and readable.", why: "Clear structure is particularly important when applying for analytical roles, as it demonstrates logical thinking.", suggestion: "No major changes required. Consider reordering sections to place your most data-relevant experience first.", priority: "Low" },
        ]},
      ],
    };
  }

  if (resumeType === "it-grad" && roleCategory === "itsupport") {
    return {
      overview: "Your IT graduate resume has a solid technical foundation, and some of your experience is transferable to an IT Support Officer role. However, the resume is currently framed around software development and projects. To be competitive for IT Support positions, you should foreground your customer-facing experience, troubleshooting skills, and communication capabilities.",
      targetRole: targetRole, resumeLabel: fileName,
      roleRelevance: {
        strong: ["Technical IT background directly supports understanding of systems and hardware", "Any customer service or team experience is highly transferable to IT support contexts", "Academic IT qualification demonstrates foundational systems knowledge"],
        partial: ["Technical skills are present but not positioned for a support or troubleshooting context", "Project experience demonstrates problem-solving but is framed as development work"],
        missing: ["No explicit mention of helpdesk, ticketing systems or technical support experience was identified", "Hardware, networking or operating systems knowledge was not clearly described in the provided resume", "Communication and customer-facing skills are not explicitly highlighted"],
      },
      strengths: [
        "Your IT academic background provides the systems knowledge expected in IT Support roles.",
        "Any customer service experience in your work history is directly relevant and should be prominently featured.",
        "Problem-solving through university projects demonstrates analytical thinking valued in support environments.",
      ],
      sections: [
        { title: "Skills", icon: "⚙️", summary: "Technical skills present; support-specific skills underrepresented.", items: [
          { observation: "Your skills section lists programming languages but does not mention operating systems, networking, or hardware.", why: "IT Support roles typically require familiarity with Windows, macOS, Active Directory, networking basics and common productivity tools.", suggestion: "Add operating system and networking skills explicitly if you have them. For example: 'Windows 10/11 administration, basic networking (TCP/IP, DNS), Active Directory'.", priority: "High" },
          { observation: "No mention of ticketing systems or IT support tools was found in the provided resume.", why: "Many Australian IT Support roles expect familiarity with helpdesk or ticketing platforms such as ServiceNow, Jira Service Desk or Zendesk.", suggestion: "If you have used any helpdesk tools in study or work, add them to your skills section.", priority: "Medium" },
        ]},
        { title: "Experience", icon: "💼", summary: "Customer service experience should be more prominently featured.", items: [
          { observation: "Any customer service or communication-oriented experience in your resume is currently given limited prominence.", why: "IT Support roles require strong communication skills to assist users with varying levels of technical knowledge. This experience is directly transferable.", suggestion: "Reorder your experience section so customer-facing or communication-oriented roles appear before technical project experience when targeting IT Support applications.", priority: "High" },
          { observation: "Experience descriptions focus on technical tasks rather than support or troubleshooting scenarios.", why: "IT Support employers look for evidence of resolving problems under pressure and communicating solutions clearly.", suggestion: "Where accurate, add examples of resolving technical or operational problems — even in non-IT roles. For example: 'Resolved point-of-sale technical issues during peak trade periods'.", priority: "Medium" },
        ]},
        { title: "Projects", icon: "🗂", summary: "Projects demonstrate problem-solving but need support framing.", items: [
          { observation: "University projects are described in a software development context.", why: "While the technical work is relevant, IT Support employers may not immediately recognise the connection to a support role.", suggestion: "Add a brief note to relevant projects describing the troubleshooting or systems-administration aspects — even if they were a minor part of the project.", priority: "Low" },
        ]},
        { title: "Australian Context", icon: "🇦🇺", summary: "Standard Australian conventions apply.", items: [
          { observation: "Referees section was not identified in the provided resume.", why: "IT Support employers often check referees early in the process.", suggestion: "Add a referees section or note 'Referees available upon request' at the end of your resume.", priority: "Low" },
        ]},
        { title: "Structure & Formatting", icon: "📄", summary: "No significant structural issues identified.", items: [
          { observation: "Resume structure is clear and easy to navigate.", why: "Readability is important in IT Support applications, as it reflects communication skills.", suggestion: "No major changes required. Ensure your contact details are at the top and easy to find.", priority: "Low" },
        ]},
      ],
    };
  }

  // ── Nursing resume ──────────────────────────────────────────────
  if (resumeType === "nurse" && roleCategory === "nursing") {
    return {
      overview: "Your resume clearly communicates a clinical background relevant to a Registered Nurse application. Your clinical placement experience and patient care responsibilities are well represented. The primary opportunity is to strengthen achievement-oriented language and ensure your AHPRA registration and qualifications are prominently featured.",
      targetRole: targetRole, resumeLabel: fileName,
      roleRelevance: {
        strong: ["Clinical placement experience directly demonstrates patient care capability", "Nursing qualification is essential and identified in the provided resume", "Patient care responsibilities align with core Registered Nurse requirements"],
        partial: ["Clinical skills are described but outcomes and specific clinical contexts could be clearer", "Communication skills are implied but not explicitly evidenced in the resume"],
        missing: ["AHPRA registration number or status was not clearly identified in the provided resume", "Specific clinical specialisations or ward types were not clearly described", "Evidence of medication administration competency was not identified"],
      },
      strengths: [
        "Your clinical placement experience is directly relevant and demonstrates exposure to real patient care environments.",
        "The nursing qualification listed on your resume satisfies the essential requirement for most Registered Nurse positions in Australia.",
        "Patient care responsibilities described in your resume demonstrate understanding of nursing fundamentals.",
      ],
      sections: [
        { title: "Qualifications & Registration", icon: "🎓", summary: "Qualification is present; registration details need prominence.", items: [
          { observation: "Your nursing qualification is listed but AHPRA registration details are not clearly prominent in the provided resume.", why: "Australian employers hiring Registered Nurses require confirmation of AHPRA registration. Its absence or unclear positioning can delay shortlisting.", suggestion: "Add your AHPRA registration number or status clearly in your contact details or a dedicated registration section at the top of your resume.", priority: "High" },
        ]},
        { title: "Clinical Experience", icon: "🏥", summary: "Clinical placement is well described; more specificity would strengthen it.", items: [
          { observation: "Your clinical placement is described in terms of patient care responsibilities but does not specify the clinical setting or specialisation.", why: "Employers look for relevant clinical context — e.g. acute care, aged care, mental health, paediatrics — to assess fit with the available position.", suggestion: "Specify the clinical setting for each placement — e.g. 'Medical-Surgical Ward, 300-bed metropolitan hospital'. Include the patient population and any specific clinical skills practised.", priority: "High" },
          { observation: "Medication administration is not explicitly described in the provided resume.", why: "Medication competency is a core expectation for Registered Nurse roles in most Australian healthcare settings.", suggestion: "If you have demonstrated medication administration competency during placement, state this explicitly in your clinical experience section.", priority: "High" },
        ]},
        { title: "Skills", icon: "⚙️", summary: "Clinical skills section could be more comprehensive.", items: [
          { observation: "The skills section does not explicitly list clinical competencies such as wound care, vital signs monitoring, or IV cannulation.", why: "Clinical skills lists help employers quickly assess readiness for the clinical environment.", suggestion: "Add a dedicated clinical skills section listing all competencies you have demonstrated or been assessed in during training and placement.", priority: "Medium" },
        ]},
        { title: "Professional Summary", icon: "👤", summary: "Summary is present but could be more targeted.", items: [
          { observation: "The professional summary describes your background generally rather than connecting it to the specific Registered Nurse role.", why: "A targeted summary helps a busy nurse manager immediately understand your value and fit.", suggestion: "Revise your summary to mention your clinical specialisation interest, key competencies, and AHPRA registration status in two to three concise sentences.", priority: "Medium" },
        ]},
        { title: "Australian Context", icon: "🇦🇺", summary: "Specific Australian nursing application conventions apply.", items: [
          { observation: "The resume does not reference any completion of the Nursing and Midwifery Board of Australia (NMBA) competency standards.", why: "Australian nursing employers expect graduates to demonstrate alignment with NMBA competency standards.", suggestion: "Consider adding a brief statement in your professional summary or skills section acknowledging NMBA competency standards if this is applicable to your qualification.", priority: "Low" },
        ]},
        { title: "Structure & Formatting", icon: "📄", summary: "Well structured for a clinical application.", items: [
          { observation: "Your resume structure is clear and professional.", why: "Clarity is important in healthcare applications where hiring managers review many applications.", suggestion: "Ensure your most relevant clinical experience appears immediately after your qualifications section.", priority: "Low" },
        ]},
      ],
    };
  }

  // ── Marketing resume ─────────────────────────────────────────────
  if (resumeType === "marketing" && roleCategory === "marketing") {
    return {
      overview: "Your resume demonstrates relevant marketing experience that directly supports an application for a Marketing Coordinator role. Your campaign and social media experience is well positioned. The main opportunity is to include measurable outcomes for your campaigns and to better connect your digital marketing skills to the specific responsibilities of a coordinator role.",
      targetRole: targetRole, resumeLabel: fileName,
      roleRelevance: {
        strong: ["Social media and content experience directly aligns with Marketing Coordinator requirements", "Campaign involvement demonstrates practical marketing knowledge", "Communication and creative skills are evidenced throughout the resume"],
        partial: ["Campaign descriptions mention activities but not measurable outcomes", "Digital marketing skills are present but platforms and tools could be specified more clearly"],
        missing: ["Measurable campaign performance data (reach, engagement rate, leads generated) was not identified in the provided resume", "Experience with marketing analytics tools (Google Analytics, Meta Business Suite) was not clearly stated", "CRM or email marketing platform experience was not identified"],
      },
      strengths: [
        "Your social media and content experience is directly applicable to a Marketing Coordinator role and is well demonstrated in your resume.",
        "Campaign involvement — even in a supporting or student capacity — shows practical marketing knowledge that employers value in graduate candidates.",
        "Your communication background is a transferable strength for coordinator roles that involve stakeholder and agency liaison.",
      ],
      sections: [
        { title: "Campaign Experience", icon: "📢", summary: "Campaign experience is present; outcomes need to be more prominent.", items: [
          { observation: "Your resume describes campaign involvement but does not include measurable outcomes or performance results.", why: "Australian marketing employers look for evidence of campaign effectiveness — reach, engagement rates, leads generated, conversion — even in junior or student roles.", suggestion: "Where accurate, add one performance metric per campaign. For example: 'Managed social media content for X campaign, achieving Y% increase in engagement over the campaign period'. Only include figures you can verify.", priority: "High" },
          { observation: "The specific marketing channels managed are not consistently described.", why: "Marketing Coordinator roles often require experience with specific channels — Instagram, LinkedIn, email, paid search — and employers scan for these.", suggestion: "For each campaign or role, list the specific channels you managed or contributed to.", priority: "High" },
        ]},
        { title: "Digital Skills", icon: "💻", summary: "Digital skills are implied but specific tools are not listed.", items: [
          { observation: "Your skills section mentions digital marketing but does not specify platforms or tools.", why: "Employers look for familiarity with specific tools — Google Analytics, Canva, Hootsuite, Mailchimp, Meta Business Suite — to assess readiness.", suggestion: "Add a digital tools section or expand your skills section to list the specific platforms and tools you have used, even in a student or volunteer context.", priority: "High" },
        ]},
        { title: "Content Creation", icon: "✏️", summary: "Content experience is referenced but could be better evidenced.", items: [
          { observation: "Content creation is mentioned but the types of content (copy, graphics, video, blog) are not specified.", why: "Marketing Coordinator roles typically require a range of content skills. Specifying your content types demonstrates versatility.", suggestion: "List the specific content formats you have created — e.g. 'Social media copy, promotional graphics (Canva), blog posts, email newsletters'.", priority: "Medium" },
        ]},
        { title: "Analytics", icon: "📊", summary: "No analytics experience was identified.", items: [
          { observation: "Evidence of using marketing analytics tools or interpreting campaign data was not identified in the provided resume.", why: "Marketing Coordinators in Australia are increasingly expected to report on and interpret campaign performance data.", suggestion: "If you have used Google Analytics, Meta Insights, or any other reporting tool — even in a university project — add this to your skills section and reference it in relevant experience descriptions.", priority: "Medium" },
        ]},
        { title: "Australian Context", icon: "🇦🇺", summary: "Generally well suited to Australian marketing applications.", items: [
          { observation: "The resume does not mention any internship, volunteer marketing work, or student marketing association involvement.", why: "Australian marketing employers value demonstrated initiative and real-world exposure, particularly for graduate candidates.", suggestion: "If you have undertaken any marketing-related volunteer, internship or extra-curricular work, include it — even if informal.", priority: "Low" },
        ]},
        { title: "Structure & Formatting", icon: "📄", summary: "Clear and professional structure.", items: [
          { observation: "Resume structure is clean and professional.", why: "For a marketing role, visual presentation signals attention to brand and communication standards.", suggestion: "Ensure your formatting is consistent and that your most relevant experience appears first. Consider whether a brief portfolio link could be included if you have one.", priority: "Low" },
        ]},
      ],
    };
  }

  // ── Generic fallback ──────────────────────────────────────────────
  return {
    overview: `Your resume has been reviewed in the context of a ${targetRole} application. The feedback below is based on the information provided. To receive more targeted feedback, ensure your resume content and target role are as specific as possible.`,
    targetRole: targetRole, resumeLabel: fileName,
    roleRelevance: {
      strong: ["Relevant qualifications identified in the provided resume", "Work experience demonstrates professional capability"],
      partial: ["Some experience may be relevant to the target role but could be presented more clearly", "Skills section could be better aligned to role requirements"],
      missing: ["Role-specific technical skills or certifications were not clearly identified in the provided resume", "Measurable achievements were not identified — consider adding these where accurate"],
    },
    strengths: [
      "Your resume has a clear, readable structure that is easy for employers to navigate.",
      "Work experience is described in a professional tone consistent with Australian workplace expectations.",
    ],
    sections: [
      { title: "Professional Summary", icon: "👤", summary: "Summary could be more targeted to the role.", items: [
        { observation: "The professional summary does not explicitly reference the target role or connect your background to it.", why: "A targeted summary is one of the most effective ways to immediately signal your fit for a specific role.", suggestion: "Revise your summary to name the target role and highlight two or three specific capabilities that make you suited to it.", priority: "High" },
      ]},
      { title: "Skills", icon: "⚙️", summary: "Skills section present but could be better aligned to the role.", items: [
        { observation: "The skills listed do not clearly map to the requirements of the target role.", why: "Employers and applicant tracking systems scan for role-specific skills. A mismatch reduces the chance of shortlisting.", suggestion: "Review the job description for the target role and ensure your most relevant skills are listed clearly and specifically.", priority: "High" },
      ]},
      { title: "Experience", icon: "💼", summary: "Experience is described but achievement-oriented language could be stronger.", items: [
        { observation: "Experience descriptions use duty-focused language rather than outcome-focused language.", why: "Achievement-oriented language is consistently preferred in Australian graduate applications.", suggestion: "Rewrite at least two bullet points per role to begin with a strong action verb and, where accurate, describe a measurable outcome.", priority: "High" },
      ]},
      { title: "Structure & Formatting", icon: "📄", summary: "Clear structure; minor improvements possible.", items: [
        { observation: "Heading and date formatting appears to be generally consistent.", why: "Consistent formatting signals attention to detail.", suggestion: "Review the full document for any inconsistencies in font weight, bullet style or spacing.", priority: "Low" },
      ]},
    ],
  };
}

/* ─────────────────────────────────────────
   Constants / data
───────────────────────────────────────── */
const RESUME_SECTIONS = [
  {
    title: "Structure & Formatting",
    icon: "📄",
    summary: "Clear structure with some inconsistencies to address.",
    items: [
      {
        observation: "Section headings are not consistently formatted throughout the document.",
        why: "Consistent formatting signals attention to detail, which is valued in Australian professional contexts.",
        suggestion: "Apply a uniform style — same font weight, size and spacing — to all section headings.",
      },
      {
        observation: "The document uses multiple font sizes without a clear hierarchy.",
        why: "Visual clarity helps recruiters scan quickly, especially in high-volume hiring contexts.",
        suggestion: "Limit to two or three font sizes and apply them consistently across the document.",
      },
    ],
  },
  {
    title: "Professional Summary",
    icon: "👤",
    summary: "Summary is present but could be better tailored to the Australian context.",
    items: [
      {
        observation: "The professional summary describes your background but does not connect it to the target role.",
        why: "Tailoring your summary to the specific role demonstrates focus and genuine interest to employers.",
        suggestion: "Revise the summary to mention the target role or industry, and highlight one or two relevant strengths.",
      },
    ],
  },
  {
    title: "Skills & Experience",
    icon: "💼",
    summary: "Strong experience section; some descriptions focus on duties rather than outcomes.",
    items: [
      {
        observation: "Experience descriptions focus mainly on responsibilities rather than outcomes.",
        why: "Australian employers often look for evidence of impact and achievement, not just task completion.",
        suggestion: "Where accurate, describe measurable outcomes or specific contributions alongside your responsibilities.",
      },
      {
        observation: "Technical skills are listed without context or proficiency level.",
        why: "Context helps employers understand the depth of your experience with each skill.",
        suggestion: "Consider grouping skills by category and noting where you have applied them professionally or academically.",
      },
    ],
  },
  {
    title: "Clarity & Language",
    icon: "✏️",
    summary: "Language is clear; a few phrases could be more concise.",
    items: [
      {
        observation: "Some bullet points begin with passive constructions rather than action verbs.",
        why: "Active, outcome-focused language reads more confidently in Australian resumes.",
        suggestion: "Begin each bullet point with a strong action verb such as 'Led', 'Developed', 'Coordinated', or 'Delivered'.",
      },
    ],
  },
  {
    title: "Relevance to Target Role",
    icon: "🎯",
    summary: "Good foundational alignment; a few adjustments would strengthen the match.",
    items: [
      {
        observation: "Several experiences listed may not be immediately relevant to the target role.",
        why: "Recruiters spend limited time on each resume; prioritising relevant experience helps make a strong first impression.",
        suggestion: "Reorder experiences so the most relevant roles and projects appear earlier within each section.",
      },
    ],
  },
  {
    title: "Suggested Improvements",
    icon: "💡",
    summary: "Three key changes would meaningfully strengthen this resume.",
    items: [
      {
        observation: "A LinkedIn or professional profile link is not included.",
        why: "Many Australian employers expect a LinkedIn profile as part of a graduate application.",
        suggestion: "Add a professional LinkedIn profile link in your contact section, ensuring your profile is complete and up to date.",
      },
      {
        observation: "The resume does not include a referees section or 'referees available on request'.",
        why: "Australian employers often expect referees to be acknowledged in the resume.",
        suggestion: "Add a brief referees section at the end of your resume.",
      },
    ],
  },
];

/* ─────────────────────────────────────────
   Interview question bank
───────────────────────────────────────── */
interface IQ {
  q: string;
  guidance: string;
  type: "Behavioural" | "General Graduate" | "Role-Specific";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  sampleAnswer: string;
}

const BEHAVIOURAL: IQ[] = [
  {
    q: "Tell me about a time you worked effectively as part of a team.",
    guidance: "Use the STAR structure: describe the Situation, your Task, the Actions you took, and the Result.",
    type: "Behavioural", difficulty: "Beginner",
    sampleAnswer: "During a university software development project, I worked in a team of four students to build a web application. I was responsible for the database component and coordinating it with the frontend. When we experienced integration problems, I organised a short meeting, identified the conflicting data requirements and worked with the frontend developer to resolve them. We completed the project on time and successfully demonstrated the application. The experience strengthened my communication and teamwork skills.",
  },
  {
    q: "Describe a time you had to learn a new skill or tool quickly.",
    guidance: "Be specific about what you learned, how you approached it, and what the outcome was.",
    type: "Behavioural", difficulty: "Beginner",
    sampleAnswer: "During an internship, I was asked to produce a data report using Tableau, which I had not used before. I completed online tutorials over two evenings, practised with the project data, and sought feedback from a colleague. Within the week I produced the report to the required standard. The experience showed me that I can learn new technical tools efficiently under time pressure.",
  },
  {
    q: "Tell me about a time you made a mistake. What happened and what did you learn?",
    guidance: "Choose a genuine example. Focus on what you did to address it and what you took from the experience.",
    type: "Behavioural", difficulty: "Beginner",
    sampleAnswer: "During a group assignment, I misread the submission deadline and submitted our work a day late, which cost the team marks. I immediately informed the group, apologised, and spoke with our tutor. I then set up a shared calendar for all future deadlines. Since then I have not missed a submission. The experience taught me to verify deadlines and communicate promptly when problems arise.",
  },
  {
    q: "Describe a situation where you had to manage competing priorities under pressure.",
    guidance: "Explain what the competing demands were, how you decided what to prioritise, and what the outcome was.",
    type: "Behavioural", difficulty: "Intermediate",
    sampleAnswer: "In my final semester I was managing a major capstone project, two assessments and a part-time job simultaneously. I listed all deadlines, identified which tasks were most time-sensitive and highest-stakes, and blocked time in my calendar for each. I communicated with my project team when I needed to adjust meeting times and asked my employer to reduce my hours for two weeks. I met every deadline, and the capstone project received a distinction.",
  },
  {
    q: "Tell me about a time you had a disagreement with a colleague or team member. How did you handle it?",
    guidance: "Focus on how you addressed the disagreement constructively. Avoid speaking negatively about the other person.",
    type: "Behavioural", difficulty: "Intermediate",
    sampleAnswer: "During a group project, a team member and I disagreed on the technical approach to use. Rather than debating in the group chat, I suggested we discuss it one-on-one. I listened to their reasoning, shared mine, and we identified that both approaches had merit for different parts of the project. We presented two options to the group and agreed on a combined solution. The final project was stronger for it, and our working relationship remained positive.",
  },
  {
    q: "Give an example of a time you had to adapt to a significant change. How did you manage it?",
    guidance: "Describe the change, your initial reaction, and the specific steps you took to adapt successfully.",
    type: "Behavioural", difficulty: "Intermediate",
    sampleAnswer: "Partway through my placement, our clinical team changed to a new electronic medical records system with two days' notice. I attended the briefing, completed the available training module that evening and asked experienced colleagues for tips during quiet moments on the ward. Within three days I was using the system confidently and was able to help a colleague who was finding it difficult. I found that approaching change as a learning opportunity rather than a disruption made the transition much easier.",
  },
  {
    q: "Describe a situation where you identified a problem others had not noticed and took initiative to resolve it.",
    guidance: "Focus on how you identified the problem, what you did without being asked, and what the outcome was.",
    type: "Behavioural", difficulty: "Advanced",
    sampleAnswer: "While reviewing monthly sales data for my team, I noticed a pattern of returns that had not been flagged. I investigated further, identified that a product category was being miscategorised at point of sale, and raised it with my supervisor with supporting evidence. I proposed a short-term fix and a longer-term process change. The fix was implemented that week, reducing the misclassification rate by over 80 percent. My manager credited the catch to me in a team meeting.",
  },
  {
    q: "Tell me about a time you had to influence someone without formal authority to achieve an outcome.",
    guidance: "Describe the stakeholder, the goal, and the approach you used to build agreement without relying on authority.",
    type: "Behavioural", difficulty: "Advanced",
    sampleAnswer: "As a student project leader, I needed a team member to take on additional work after another member became unavailable. Rather than simply allocating the tasks, I met with them, acknowledged their existing workload, explained the impact on the project, and asked for their input on how we could share the burden fairly. They agreed and suggested splitting the tasks with another member. By involving them in the solution, I secured their commitment and the project was completed on time.",
  },
  {
    q: "Describe the most complex project or challenge you have managed. What was your approach?",
    guidance: "Choose an example that demonstrates planning, stakeholder communication, and resilience. Explain your specific role.",
    type: "Behavioural", difficulty: "Advanced",
    sampleAnswer: "My university capstone project required a team of five to design and build a full-stack application for a simulated client over one semester. I coordinated weekly sprints, managed the backlog, facilitated communication between the frontend and backend subteams, and presented progress to our supervisor fortnightly. When we encountered a major technical blocker in week eight, I reorganised priorities, brought the team together to problem-solve, and we completed a reduced but fully functional scope on time. The project received a high distinction and was selected for a faculty showcase.",
  },
];

const GRADUATE: IQ[] = [
  {
    q: "Why are you interested in this graduate role, and what strengths would you bring to the organisation?",
    guidance: "Connect your studies and skills to the role. Show you understand what the organisation does and why it appeals to you.",
    type: "General Graduate", difficulty: "Beginner",
    sampleAnswer: "I am interested in this graduate role because it would allow me to apply the technical knowledge I developed through my IT studies while continuing to learn in a professional environment. Through university projects, I have developed skills in programming, databases, teamwork and problem-solving. I am keen to contribute these skills while gaining practical industry experience and growing within the organisation.",
  },
  {
    q: "What are your key strengths, and how have you demonstrated them during your studies?",
    guidance: "Choose two or three genuine strengths and support each with a brief, specific example.",
    type: "General Graduate", difficulty: "Beginner",
    sampleAnswer: "One of my key strengths is analytical thinking. During my studies I consistently approached assessments by breaking complex problems into components and evaluating evidence before drawing conclusions. A second strength is communication — I have presented research findings to mixed audiences including academics and peers, and I received positive feedback on clarity and structure. I also consider myself reliable: group members have regularly asked me to take a coordinating role because of my follow-through.",
  },
  {
    q: "Where do you see yourself professionally in three to five years?",
    guidance: "Show genuine ambition that is realistic and connected to the role. Avoid vague statements.",
    type: "General Graduate", difficulty: "Beginner",
    sampleAnswer: "Over the next three to five years, I would like to develop strong technical and professional foundations in this role and take on increasing responsibility as I build my skills. I am particularly interested in developing expertise in data analysis and growing into a position where I can contribute to strategic decisions. I see this organisation as a place where I can develop those capabilities with strong mentorship and exposure to meaningful work.",
  },
  {
    q: "How do you approach learning a new skill or entering an unfamiliar work environment?",
    guidance: "Describe a specific method or example. Show self-direction, openness to feedback and resilience.",
    type: "General Graduate", difficulty: "Intermediate",
    sampleAnswer: "When I encounter a new skill or environment, I start by seeking out structured resources — tutorials, documentation or training — to build a foundation. I then practise with real tasks as quickly as possible, since I learn most effectively by doing. I also proactively ask colleagues or supervisors for feedback so I can correct my approach early. During my placement, I used this approach when learning a new clinical system and was able to use it independently within three days.",
  },
  {
    q: "What qualities do you think Australian employers most value in graduate employees?",
    guidance: "Show awareness of the Australian workplace context. Back up your answer with evidence from your own experience or research.",
    type: "General Graduate", difficulty: "Intermediate",
    sampleAnswer: "From my research and experience, Australian employers consistently value communication, teamwork, initiative and the ability to learn quickly. Employers often emphasise cultural fit and a positive attitude alongside technical capability, particularly at the graduate level when domain expertise is still developing. I have deliberately developed these qualities through group projects, part-time work and volunteering, and I understand that as an international student I may need to invest additional effort in understanding Australian workplace norms and professional expectations.",
  },
  {
    q: "Describe a time you received critical feedback. How did you respond?",
    guidance: "Focus on how you received the feedback, what you did with it, and what you learned.",
    type: "General Graduate", difficulty: "Intermediate",
    sampleAnswer: "During my second year, a lecturer gave me detailed written feedback indicating that my essay arguments were too general and lacked supporting evidence. My initial reaction was disappointment, but I reflected on the comments carefully, revisited the marking criteria and rewrote a substantial section before the final submission was due. I also attended a writing workshop offered by the university. My mark improved significantly in the following assessment. I now treat critical feedback as one of the most useful tools for improvement.",
  },
  {
    q: "What do you consider the most significant challenges facing graduates entering your industry in Australia right now?",
    guidance: "Demonstrate industry awareness. Show you have thought carefully about the environment you are entering.",
    type: "General Graduate", difficulty: "Advanced",
    sampleAnswer: "From my research, graduates entering the technology sector in Australia face a competitive market in which employers increasingly expect practical skills alongside academic qualifications. There is also a growing emphasis on AI literacy, which requires graduates to continuously upskill. For international graduates specifically, building professional networks and demonstrating Australian workplace readiness can be additional challenges. I have been proactive about addressing this by completing industry certifications, attending professional events, and seeking out Australian internship and placement opportunities.",
  },
  {
    q: "How would you demonstrate value during your first three months in a graduate role?",
    guidance: "Be specific. Describe actions you would take, not just intentions.",
    type: "General Graduate", difficulty: "Advanced",
    sampleAnswer: "In the first three months, I would focus on three things. First, listening and learning — I would take detailed notes, ask considered questions and seek to understand the team's processes and priorities before suggesting changes. Second, I would identify a small, tangible contribution I could make and deliver it reliably and on time to demonstrate I can follow through. Third, I would actively build relationships with colleagues and ask for feedback regularly so I can adjust my approach quickly. I would treat the first three months as an extended induction rather than a performance period.",
  },
  {
    q: "Tell me about a time you showed leadership potential, even without a formal leadership role.",
    guidance: "Leadership is about influence, not authority. Focus on initiative, communication and impact.",
    type: "General Graduate", difficulty: "Advanced",
    sampleAnswer: "During a group capstone project, our team was struggling with direction after a key member became unavailable mid-project. Without being formally assigned the leadership role, I called a team meeting, helped restructure our approach, reallocated tasks, and established a weekly check-in to maintain momentum. I also acted as the primary contact with our supervisor. The project was completed to a high standard. Several team members said the reorganisation made a significant difference to the outcome.",
  },
];

const ROLE_SPECIFIC_BANKS: Record<string, IQ[]> = {
  software: [
    {
      q: "How would you approach debugging an application that is producing unexpected results?",
      guidance: "Describe a systematic process. Show that you think methodically rather than guessing.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "I would first try to reproduce the issue consistently and note the exact conditions under which it occurs. I would then review relevant logs, inputs and any recent code changes that might have introduced the problem. I would isolate individual components to narrow down the cause, add logging or use a debugger to inspect state at key points, and once I identified the problem, implement and test the fix carefully to ensure it did not introduce new issues elsewhere.",
    },
    {
      q: "What version control practices have you used in your university projects?",
      guidance: "Be specific about the tools and workflows you have used. Mention branching, pull requests or any team conventions.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "In my university projects I have used Git and GitHub for version control. I worked with feature branches to isolate changes, wrote descriptive commit messages, and used pull requests for team code review before merging to the main branch. I also learned to resolve merge conflicts and to use git log to trace the history of changes. I understand the importance of version control for maintaining code quality and team coordination in a professional environment.",
    },
    {
      q: "Explain the difference between a compiled and an interpreted programming language with an example of each.",
      guidance: "Keep the explanation clear and accurate. You do not need to go into low-level detail.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "A compiled language converts source code into machine code before execution. The compiler processes the entire program and produces an executable file, as in Java or C++. An interpreted language executes source code line by line at runtime, as Python does. Compiled languages tend to run faster because the translation has already occurred, while interpreted languages are often more flexible and easier to test interactively. Many modern languages combine elements of both approaches.",
    },
    {
      q: "How would you design a simple REST API for a task management application?",
      guidance: "Walk through your reasoning. Consider endpoints, HTTP methods, and data formats.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "I would start by identifying the core resources: tasks, users and potentially projects. For tasks I would design standard CRUD endpoints — GET /tasks to list all tasks, GET /tasks/{id} to retrieve a specific task, POST /tasks to create one, PUT /tasks/{id} to update it, and DELETE /tasks/{id} to remove it. I would use JSON for request and response bodies, include appropriate HTTP status codes, and think about authentication using a token-based approach. I would also consider filtering and pagination for the list endpoint if the data volume is significant.",
    },
    {
      q: "Describe how you would approach reviewing a pull request from a colleague.",
      guidance: "Show that code review is about quality and collaboration, not criticism. Mention what you look for.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "I would start by understanding the purpose of the change from the PR description and any linked issue. I would then read through the code to check that the logic is correct and handles edge cases, the code is readable and follows team conventions, tests are included and meaningful, and there are no obvious security or performance concerns. I would write comments that are specific, constructive and respectful — asking questions where I am unsure rather than assuming error. I would approve changes I am confident in and request changes where genuine issues exist.",
    },
    {
      q: "What steps would you take to improve the performance of a slow-running web application?",
      guidance: "Demonstrate that you measure before optimising. Walk through a structured approach.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "I would begin by measuring — using browser developer tools, APM tools or server-side profiling to identify where the bottleneck actually is, rather than guessing. Common areas to investigate include slow database queries, unnecessary network requests, large unoptimised assets and blocking JavaScript. Once I identified the primary cause, I would implement a targeted change, measure again to confirm improvement, and repeat. I would avoid premature optimisation and focus on changes with the greatest measurable impact first.",
    },
    {
      q: "How would you architect a system that needs to scale to handle significantly increased user load?",
      guidance: "Demonstrate awareness of scalability principles. You do not need to design a production system — focus on reasoning.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "I would start by understanding the expected load patterns — whether scaling needs are predictable or variable — and identify the bottlenecks in the current architecture. For horizontal scaling, I would consider load balancing across multiple application instances and stateless design so any instance can handle any request. I would evaluate caching strategies to reduce database load, consider database read replicas or sharding if the data layer is the constraint, and use asynchronous processing for non-time-critical tasks. I would also design for observability from the beginning so that performance issues can be detected quickly in production.",
    },
    {
      q: "How would you introduce automated testing to a codebase that currently has none?",
      guidance: "A pragmatic approach is valued here. Show that you understand tradeoffs and would prioritise effectively.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "I would avoid attempting to test everything immediately, as that is not sustainable. Instead I would start by writing tests for the highest-risk, most frequently changed parts of the codebase — core business logic, critical data transformations and key API endpoints. I would introduce a testing framework and establish a pattern the team can follow consistently. I would add tests incrementally alongside new features and bug fixes, using a principle of 'leave it better than you found it'. I would also advocate for integrating tests into the CI pipeline so they run automatically on every commit.",
    },
    {
      q: "How would you balance technical debt against new feature development in an Agile team?",
      guidance: "Show that you understand both business and technical perspectives. There is no single right answer — reasoning matters.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "Technical debt and new feature delivery are both legitimate priorities, and managing the balance requires transparency. I would advocate for making technical debt visible in the backlog rather than treating it as invisible background work, so the team and product owner can make informed prioritisation decisions. A common approach is to allocate a consistent portion of each sprint — often around 20 percent — to technical debt reduction. I would also argue that addressing debt that directly affects delivery speed should be treated as enabling future feature work, not competing with it.",
    },
  ],
  data: [
    {
      q: "How would you approach cleaning a dataset that contains missing values?",
      guidance: "Show a methodical approach. Consider why values might be missing and what the appropriate response is.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "I would first explore the data to understand the extent and pattern of missing values — whether they are missing at random or whether there is a systematic reason. Depending on the context, I would consider removing rows where the missing values are few and the dataset is large enough, imputing values using an appropriate method such as the mean, median or mode, or flagging the missing values as a category in their own right. I would document every decision I make and validate that my approach does not introduce bias into the analysis.",
    },
    {
      q: "Describe how you have used data visualisation to communicate findings.",
      guidance: "Be specific about the tool, the audience and the choices you made.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "During my university capstone, I used Tableau to visualise seasonal sales trends from a retail dataset. The audience included academic staff and a simulated business client, so I chose clear bar and line charts rather than more complex visualisations. I used colour deliberately to highlight the key finding — a consistent dip in sales during March — and built a dashboard that allowed the audience to filter by product category. The presentation received positive feedback for its clarity.",
    },
    {
      q: "What is the difference between a mean and a median, and when would you use each?",
      guidance: "Keep the explanation practical and provide a real-world example.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "The mean is the arithmetic average of a dataset, while the median is the middle value when the data is sorted. The mean is sensitive to outliers — if a dataset of household incomes includes a very high earner, the mean will be pulled upward and may not represent the typical household. The median is more robust in that situation. I would use the mean for roughly symmetric distributions without extreme outliers and the median when the data is skewed or contains outliers that would distort the average.",
    },
    {
      q: "How would you identify and handle outliers in a dataset?",
      guidance: "Show awareness of different detection methods and explain that outlier handling depends on context.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "I would first visualise the data using box plots or scatter plots to get an initial sense of the distribution. I would then use statistical methods such as the interquartile range or z-scores to identify values that fall significantly outside the expected range. Before deciding how to handle them, I would investigate why they exist — a genuine extreme value, a data entry error or a sensor fault all require different responses. I would document my decision and, if removing or adjusting outliers, test whether it materially changes the analysis conclusion.",
    },
    {
      q: "Walk me through a SQL query you have written for a meaningful analysis task.",
      guidance: "Be specific. Describe the data, the question you were answering, and the query structure.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "In my university project I analysed a retail sales database. To identify the top-performing product categories by total revenue for each quarter, I wrote a query that joined the sales and product tables on product ID, used a GROUP BY on category and quarter, and aggregated total sales using SUM. I then used ORDER BY and LIMIT to surface the top results. I also used a WHERE clause to filter out cancelled transactions. The result was a clean summary table I imported into Tableau for visualisation.",
    },
    {
      q: "Describe your approach to validating an analysis before presenting results to stakeholders.",
      guidance: "Validation is about accuracy and trustworthiness. Show a structured approach.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "Before presenting, I cross-check my results against known reference points — for example, verifying that total figures match source records. I review my code or query logic for errors, check that filters are applied correctly and that aggregations make sense. I also sense-check results intuitively — if a metric seems unexpectedly high or low, I investigate before proceeding. Where possible I have a colleague review the analysis. I also ensure that the scope of my conclusions matches the data I actually have and avoid overstating certainty.",
    },
    {
      q: "How would you design a dashboard to help a non-technical stakeholder make a business decision?",
      guidance: "Audience awareness and clarity are central. Show that you think about communication, not just visualisation.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "I would start by having a conversation with the stakeholder to understand the specific decision they need to make and what information is most critical. I would then select two or three key metrics that directly inform that decision, rather than showing everything available. I would use simple, familiar chart types, clear labels, and consistent colour use. I would avoid jargon and technical formatting. The dashboard would include a brief written summary of the key finding and a recommended action, because not every stakeholder will interpret a chart the same way. I would review the draft with the stakeholder before finalising.",
    },
    {
      q: "How would you approach a situation where you suspect the data you have been given is incomplete or biased?",
      guidance: "Show ethical awareness and a practical response. Raising concerns clearly is important.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "I would document my concerns clearly and raise them with my supervisor or the data owner before proceeding. I would describe the specific indicators that suggest incompleteness or bias — for example, a demographic group that appears underrepresented, or a time period with suspiciously low volume. I would ask for additional context about how the data was collected. If the issue cannot be resolved but the analysis must proceed, I would explicitly state the limitation in my findings and qualify any conclusions accordingly. Presenting misleading analysis because the underlying data is flawed causes more harm than acknowledging the limitation.",
    },
    {
      q: "How would you approach a situation where a data analysis leads to a finding that contradicts a stakeholder's expectations?",
      guidance: "Focus on how you would handle the communication professionally and credibly.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "First, I would validate my analysis thoroughly to make sure the finding is correct and I have not made an error. Once confident, I would present the finding transparently, clearly explaining the data, the methodology and the limitations. I would acknowledge the stakeholder's expectation, explore whether there is a reason for the discrepancy, and invite them to raise any concerns about the methodology. I would not adjust the finding to match the expectation, but I would be open to re-examining the analysis if specific, substantive concerns were raised. Credibility as an analyst depends on presenting findings accurately.",
    },
  ],
  nursing: [
    {
      q: "Why did you choose nursing, and what qualities do you bring to patient care?",
      guidance: "Be genuine. Connect your personal motivation to the practical qualities you have developed.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "I chose nursing because I wanted a career that combines scientific knowledge with direct, meaningful impact on people's lives. During my placements I found genuine satisfaction in supporting patients through difficult periods and in the teamwork of the clinical environment. I bring compassion, attention to detail and a calm, professional manner under pressure. I have also developed strong clinical observation skills through my placements, and I take documentation and handover accuracy seriously.",
    },
    {
      q: "Describe your clinical placement experience and the most significant thing you learned from it.",
      guidance: "Be specific about the setting and the learning. Show that you reflected on your experience.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "My primary placement was at a metropolitan medical-surgical ward. The most significant thing I learned was the importance of clear clinical handover. Early in the placement I observed an instance where an incomplete handover led to a brief delay in patient care. From that point I was extremely deliberate about the completeness and accuracy of my own handovers, using a structured format every time. I also learned how to prioritise effectively across multiple patients, which is a skill I continue to develop.",
    },
    {
      q: "How do you prioritise tasks when caring for multiple patients simultaneously?",
      guidance: "Show clinical reasoning and structured thinking. Describe a specific approach rather than a general statement.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "At the start of each shift I review all patient notes and identify anyone with time-sensitive clinical needs — vital signs monitoring, medication administration windows, or recent changes in condition. I then work through observations and interventions in order of clinical priority, keeping time-sensitive tasks at the top of my list. I use brief mental checks throughout the shift to make sure nothing has been missed as patient conditions change. I also communicate with my RN supervisor when I am uncertain about priority or need to escalate a concern.",
    },
    {
      q: "Tell me about a situation during placement where you had to escalate a concern about a patient's condition.",
      guidance: "Describe the specific signs you noticed, how you communicated the concern, and what happened.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "During my acute care placement, I observed a patient who had become increasingly restless and whose oxygen saturation had dropped from their baseline over about 30 minutes. The change was subtle but I was concerned. I alerted my supervising RN immediately, clearly describing the observations and the timeframe. The RN assessed the patient, contacted the medical officer, and supplemental oxygen was commenced. The patient's condition stabilised. The experience reinforced for me that acting on clinical instinct and escalating promptly is part of safe nursing practice.",
    },
    {
      q: "How do you approach communicating with patients who are anxious or distressed?",
      guidance: "Show therapeutic communication skills and person-centred care. Be specific about techniques.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "I start by acknowledging the person's feelings rather than immediately trying to reassure them or move to a task. I introduce myself clearly, use a calm and unhurried tone, and give the person time to express what is concerning them. I use plain language rather than clinical terminology, check for understanding, and involve them in decisions about their care wherever possible. I also pay attention to non-verbal cues — if someone appears tense, I adjust my approach. On placement I found that simple acknowledgment — 'I can hear that you are worried' — often reduced distress more effectively than explanations.",
    },
    {
      q: "Describe how you ensure accuracy in clinical documentation.",
      guidance: "Describe specific habits and practices. Mention why accuracy in documentation matters.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "I document observations and interventions as promptly as possible rather than relying on memory, because recall accuracy decreases over a shift. I use objective, specific language rather than vague terms — for example, 'Patient reports pain at 7 out of 10 on movement' rather than 'patient in pain'. I cross-check medication administration against the medication chart immediately before and after administration. I also review my documentation at the end of the shift to identify any gaps before handing over. I understand that the medical record is a legal document and a critical communication tool, and I treat it accordingly.",
    },
    {
      q: "How would you manage a situation where a patient or family member refuses recommended treatment?",
      guidance: "Show understanding of informed consent, patient rights and professional obligations.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "I would first ensure the patient and family have clear, accurate information about the recommended treatment, its purpose and the potential consequences of refusal, using plain language. I would listen carefully to their concerns without being dismissive. If the patient has capacity to make the decision, I would respect their right to refuse — my role is to ensure the decision is fully informed, not to override it. I would document the conversation and the outcome accurately, inform my supervising nurse and the treating team, and ensure the patient continues to receive all care they do accept. I would also ask whether there is anything we could do differently to address their concerns.",
    },
    {
      q: "How would you respond if you observed a colleague making what appeared to be a clinical error?",
      guidance: "This tests professional responsibility and communication. Focus on patient safety and respectful escalation.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "My primary responsibility is patient safety. If I observed a potential error, I would intervene calmly and immediately if it was safe to do so — for example, clarifying a medication dose before it was administered. I would avoid public confrontation and speak with my colleague privately and respectfully, describing what I observed and giving them the opportunity to explain. If the error had already occurred or if I was uncertain, I would escalate to my supervising nurse promptly and document my observations accurately. I would not ignore a concern because the colleague was more senior — patient safety takes precedence.",
    },
    {
      q: "How do you maintain professional boundaries while providing compassionate, person-centred care?",
      guidance: "Show understanding of the therapeutic relationship and why boundaries protect both patient and nurse.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "Professional boundaries allow me to provide genuine care while maintaining the objectivity and reliability that patients need. In practice, this means being warm and present with patients without becoming personally over-invested, maintaining consistent behaviour regardless of whether I like or relate to a patient, and being careful about the type of personal information I share. If a patient or family member attempts to shift the relationship outside professional limits, I would respond with warmth but redirect clearly. I would seek supervision or debrief support from my nurse manager if I found a particular therapeutic relationship difficult to manage. Maintaining boundaries is not about being cold — it is about being consistently trustworthy.",
    },
  ],
  marketing: [
    {
      q: "Which digital marketing channels have you worked with, and what have you learned from them?",
      guidance: "Be specific about platforms and what you observed about their different audiences or dynamics.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "During my studies and volunteer work, I have worked primarily with Instagram, LinkedIn and Facebook. I found that Instagram drives strong visual engagement and suits short-form creative content, while LinkedIn is more effective for professional audiences and thought-leadership content. Facebook has a broader demographic but requires consistent posting and community management to maintain engagement. I managed the Instagram account for my university student association and grew the following from approximately 400 to 1,100 over twelve months through consistent posting and audience-targeted content.",
    },
    {
      q: "Describe a marketing project or campaign you worked on during your studies.",
      guidance: "Be specific about your role, the audience, the approach and the outcome.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "My capstone project involved developing a comprehensive digital marketing strategy for a fictional retail brand. I conducted a target audience analysis, developed a channel strategy prioritising Instagram and email marketing, created a content calendar and outlined projected ROI. I presented the strategy to a panel of industry professionals and received feedback that the audience segmentation was particularly strong. The project received a distinction and I found the process of connecting consumer insight to channel decisions the most valuable aspect of the learning.",
    },
    {
      q: "How would you measure the success of a social media campaign?",
      guidance: "Show that you know the difference between vanity metrics and meaningful performance indicators.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "It depends on the campaign objective. For a brand awareness campaign I would focus on reach, impressions and share of voice. For engagement campaigns I would track likes, comments, shares and saves as a proportion of reach. For conversion-focused campaigns I would measure click-through rates, website traffic from the channel and ultimately conversions or sales attributed to the campaign. I would define the primary KPI before the campaign launches and compare results against a benchmark — either historical performance or an industry standard. Follower count alone is rarely a meaningful success metric.",
    },
    {
      q: "How would you develop a content strategy for a brand targeting young Australian consumers?",
      guidance: "Show audience insight, platform selection rationale and content planning thinking.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "I would start with audience research — understanding what content this demographic consumes, on which platforms, and what values or interests they respond to. For young Australians, platforms such as Instagram, TikTok and YouTube are typically most relevant. I would define a consistent brand voice and content pillars — for example, entertainment, education and community — and create a content calendar that balances these. I would plan for a mix of owned content, user-generated content and collaborations with relevant creators. I would also build in a regular review cycle to assess what content performs and adjust the strategy accordingly.",
    },
    {
      q: "What metrics would you use to evaluate an email marketing campaign?",
      guidance: "Show knowledge of email-specific metrics and their meaning.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "The primary metrics I would track are open rate, click-through rate, conversion rate, unsubscribe rate and bounce rate. Open rate indicates whether the subject line and send time are effective. Click-through rate shows whether the email content and call-to-action are compelling. Conversion rate measures whether recipients completed the desired action. A rising unsubscribe rate would signal a problem with content relevance or frequency. I would benchmark these against industry averages and our own historical performance to determine whether the campaign was successful.",
    },
    {
      q: "Describe how you would analyse competitor marketing activity to inform your own planning.",
      guidance: "Show analytical thinking and awareness of ethical competitive intelligence approaches.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "I would start by auditing competitor social media channels, websites and email communications to understand their messaging, tone, content themes and posting frequency. I would use tools such as Meta Ad Library to review any paid social campaigns they are running. I would also note the customer reviews and comments they receive to understand audience sentiment. From this analysis I would identify gaps — topics or audiences they are not addressing — as well as approaches that appear to resonate with their audience. The goal is not to imitate but to inform our own positioning and identify opportunities.",
    },
    {
      q: "How would you approach launching a new product in a competitive Australian market with a limited budget?",
      guidance: "Show strategic prioritisation, creativity and understanding of the Australian market.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "With a limited budget I would prioritise precision over reach. I would start by defining a very specific target audience and understanding where they spend their time and what influences their decisions. I would focus resources on one or two channels rather than spreading thinly across many. I would lean into earned media — PR, community partnerships and user-generated content — rather than paid advertising. I would consider a phased launch starting in one geographic market to test messaging before scaling. I would also establish a referral or word-of-mouth mechanism from day one, since peer recommendation is particularly influential among Australian consumers.",
    },
    {
      q: "Describe how you would use customer data ethically to personalise a marketing campaign.",
      guidance: "Show understanding of privacy obligations, the Australian Privacy Principles, and responsible data use.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "Ethical personalisation starts with ensuring that data collection is transparent and consented to. Under the Australian Privacy Principles, individuals must be informed about how their data is collected and used, and that information must only be used for the purpose it was collected. In practice, I would use behavioural data — such as browsing history or past purchases — to tailor content and offers without using sensitive personal attributes in ways the customer would not expect or find intrusive. I would ensure the personalisation adds value to the customer rather than feeling surveillance-like, and I would provide clear options to manage or opt out of personalised communications.",
    },
    {
      q: "How would you manage a campaign that is significantly underperforming against its targets?",
      guidance: "Show analytical thinking, communication skills and decision-making under pressure.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "My first step would be to diagnose the cause rather than immediately changing tactics. I would review performance data at each stage of the funnel to identify where the drop-off is occurring — whether it is a reach problem, an engagement problem or a conversion problem — since each requires a different response. I would check whether external factors such as a competitor activity or a news cycle might be affecting performance. Once I understood the cause, I would develop and prioritise a set of specific changes, implement the most impactful first, and measure the effect. I would also communicate transparently with the stakeholder, explaining what the data shows and what actions I am taking.",
    },
  ],
  general: [
    {
      q: "What does this role involve, and why do you believe you are a suitable candidate?",
      guidance: "Demonstrate role understanding. Link your skills and experience directly to the requirements.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "From the role description, this position involves coordinating cross-functional activities, managing stakeholder communication and contributing to project planning and delivery. I believe I am a suitable candidate because my studies have developed strong analytical and organisational skills, and I have demonstrated these through managing complex group projects and working in fast-paced part-time roles. I am also a clear communicator, which I understand is central to this type of role.",
    },
    {
      q: "Describe your approach to planning and organising a complex task or project.",
      guidance: "Walk through a specific approach or example. Show structure, adaptability and follow-through.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "I start by clarifying the goal and identifying all the key milestones and dependencies. I then break the work into specific tasks, estimate the time required for each and assign or schedule them. I use a tool — whether a shared document, a project board or a calendar — to track progress and flag when something is falling behind. I build in buffer time for unexpected issues and check in regularly rather than waiting until a deadline is close. During my studies I used this approach for all major group assessments and it consistently helped the team stay on track.",
    },
    {
      q: "How do you typically handle workplace conflict or disagreement?",
      guidance: "Show that you approach conflict constructively. Focus on communication and resolution.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "I try to address disagreements directly and calmly rather than allowing them to continue unresolved. My first step is to understand the other person's perspective fully before explaining my own. I find that most disagreements stem from a difference in priorities or assumptions rather than a genuine conflict of interest, and once those are visible, a workable solution is usually possible. If a disagreement involves a group, I would suggest a brief structured conversation to surface the different views and agree on a way forward. I would escalate to a supervisor only if direct discussion had not resolved the issue.",
    },
    {
      q: "Describe a situation where you worked with people from different professional backgrounds to achieve a shared goal.",
      guidance: "Show awareness of collaboration across disciplines. Focus on communication and mutual understanding.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "During a university interdisciplinary project, my team included students from business, information technology and design. Our challenge was that each group used different terminology and had different assumptions about the project scope. I took the initiative to schedule a shared session at the start where we defined our goals and agreed on how decisions would be made. I also acted as an informal translator between the technical and business-focused members throughout the project. The final outcome was well-integrated, and all team members felt their perspective had been respected.",
    },
    {
      q: "How do you stay current with developments in your chosen industry?",
      guidance: "Show genuine professional curiosity. Be specific about what you read, follow or attend.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "I follow several industry publications and newsletters relevant to my field, and I attend professional events and webinars when they are available. I am a member of a student professional association and have used that network to learn about industry trends from practitioners. I also look for opportunities to apply current industry knowledge in my university projects rather than treating academic and professional learning as separate. I am aware that staying current is an ongoing professional responsibility, not something that ends at graduation.",
    },
    {
      q: "What strategies do you use to manage workload when facing tight deadlines?",
      guidance: "Show practical strategies, not just general statements about staying calm.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "I start by listing every outstanding task and the deadline for each, then identify which are fixed and which have some flexibility. I prioritise ruthlessly — focusing first on tasks that are both high-impact and time-critical — and I communicate with stakeholders early if something is at risk of being delayed rather than waiting until it is too late to adjust. I batch similar tasks to reduce context-switching and protect focused work time. If I am genuinely overwhelmed, I ask for support or renegotiate scope rather than letting quality suffer silently.",
    },
    {
      q: "How would you approach identifying and mitigating risks in a project or initiative you are responsible for?",
      guidance: "Show structured thinking. Demonstrate that you consider both likelihood and impact.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "I would begin by bringing the key stakeholders and team members together to identify risks systematically — covering dependencies, resourcing, technical assumptions and external factors. For each risk I would assess the likelihood and the potential impact if it occurred, and prioritise accordingly. For high-priority risks I would define specific mitigation actions and assign ownership. I would document the risk register and review it at regular intervals throughout the project, updating it as conditions change. I would also distinguish between risks I can mitigate proactively and uncertainties I need to monitor and respond to.",
    },
    {
      q: "Describe a time you had to make a decision with incomplete information. How did you approach it?",
      guidance: "Show that you can move forward under uncertainty without being reckless.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "During a university project, our team had to choose a technical architecture without being able to fully scope the requirements, because the client was still defining their needs. I identified the two or three assumptions that most affected the decision, assessed the cost of getting them wrong, and chose the architecture that was most reversible if our assumptions proved incorrect. I documented the assumptions and the reasoning explicitly so the team could revisit them if conditions changed. The approach meant we could move forward productively while staying adaptive.",
    },
    {
      q: "How would you build effective working relationships with senior stakeholders you are meeting for the first time?",
      guidance: "Show professional maturity, listening skills and awareness of stakeholder management.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "I would prepare thoroughly before the first meeting — understanding their role, priorities and what they care about in the context of the work we share. In the meeting itself I would listen more than I speak, ask considered questions and avoid overselling my own capabilities. I would focus on understanding what success looks like from their perspective and how I can contribute to it. I would follow through on any commitment I made in that first conversation quickly and reliably, since trust is built through consistent follow-through more than initial impression. I would also remain mindful that senior stakeholders have limited time and calibrate my communications accordingly.",
    },
  ],
};

const BEHAVIOURAL_FEEDBACK = [
  {
    strength: "A strong behavioural answer usually gives clear context and explains your individual role in the situation.",
    improvement: "Make sure the outcome of your actions is clearly explained rather than focusing only on what happened.",
    suggestion: "Use one or two sentences to explain the result, what was achieved, and what you specifically contributed.",
    structure: "Use the STAR structure: Situation, Task, Action and Result. Give particular attention to your Action and Result.",
    clarity: "Keep your example specific and concise, and focus on details that are relevant to the question.",
  },
  {
    strength: "Effective behavioural answers clearly distinguish your own actions from the work of the wider team.",
    improvement: "Include a specific outcome or lesson learned so the example demonstrates the impact of your actions.",
    suggestion: "Where appropriate, include a concrete result, such as an improvement, completed task, positive outcome or lesson learned.",
    structure: "Check that your response contains all four STAR elements, especially a clear Result.",
    clarity: "Use a professional tone and specific examples rather than broad or general statements.",
  },
  {
    strength: "A strong answer can demonstrate self-awareness by explaining both what happened and what you learned from the experience.",
    improvement: "Clearly separate the situation from the specific task or responsibility you personally had.",
    suggestion: "After introducing the situation, briefly state your responsibility before explaining the actions you took.",
    structure: "Keep the Situation concise, identify the Task clearly, then focus most of the response on your Action and Result.",
    clarity: "Use clear, direct language and finish with a concise explanation of the outcome or learning.",
  },
];

const GRADUATE_FEEDBACK = [
  {
    strength: "A strong graduate interview answer usually communicates genuine motivation for the role while maintaining a professional tone.",
    improvement: "Make an explicit connection between your relevant skills and the requirements of the role.",
    suggestion: "Identify one or two capabilities, support them with a brief example, and explain how they relate to the role.",
    structure: "For motivation questions, consider explaining why the role interests you, what relevant strengths you bring, and how you could contribute.",
    clarity: "Use clear and confident language. Avoid repeatedly beginning statements with phrases such as 'I think' or 'I believe'.",
  },
  {
    strength: "Effective graduate answers demonstrate awareness of your current capabilities, development and career direction.",
    improvement: "Support statements about your strengths or goals with specific evidence from your studies, projects, work or other relevant experience.",
    suggestion: "For each important strength or career goal, include a brief concrete example that demonstrates why it is credible.",
    structure: "Organise the answer so that your current capabilities connect logically with your future goals and the opportunity you are discussing.",
    clarity: "Keep statements specific and relevant. Concrete examples are generally more persuasive than broad claims.",
  },
  {
    strength: "A strong graduate answer can demonstrate professional curiosity and awareness of the workplace or industry.",
    improvement: "Clearly explain how your studies, projects or experience are relevant to the specific role.",
    suggestion: "After describing an experience, explicitly connect it to a skill, responsibility or capability that would be useful in the role.",
    structure: "A useful structure is: why the role interests you, what relevant capabilities you bring, and how you could contribute.",
    clarity: "Use direct professional language and minimise filler expressions such as 'basically' or 'kind of'.",
  },
];

const ROLE_SPECIFIC_FEEDBACK = [
  {
    strength: "A strong role-specific answer demonstrates structured thinking and explains a clear approach to the problem or task.",
    improvement: "Where possible, connect your approach to a real example from your studies, projects, work or other relevant experience.",
    suggestion: "Use a specific project or situation to demonstrate how you applied the approach in practice.",
    structure: "Explain your approach clearly, then support it with a practical example and the outcome where relevant.",
    clarity: "Use appropriate technical language, but make sure your explanation can also be understood by non-technical interviewers.",
  },
  {
    strength: "Effective role-specific answers demonstrate methodical thinking and awareness of relevant options or trade-offs.",
    improvement: "Include the outcome or impact of applying your approach rather than describing only the process.",
    suggestion: "Describe a situation where you used the approach, the actions you took, and what resulted from those actions.",
    structure: "Explain the method first, then connect it to an outcome to demonstrate its practical value.",
    clarity: "Keep the explanation professional and structured, and briefly explain specialised technical terms when appropriate.",
  },
  {
    strength: "A strong technical or role-specific answer communicates your reasoning clearly and demonstrates a logical problem-solving process.",
    improvement: "Demonstrate technical knowledge with specific evidence rather than relying only on an abstract explanation.",
    suggestion: "Where relevant, mention a specific tool, technique, technology or decision from a real project or experience.",
    structure: "Consider stating the key principle or approach first, then explain the steps and provide supporting evidence.",
    clarity: "Keep the answer concrete and relevant. Practical examples can make technical reasoning easier for an interviewer to understand.",
  },
];


function detectRoleForInterview(role: string, industry: string): string {
  const r = (role + " " + industry).toLowerCase();
  if (r.includes("nurs") || r.includes("midwi") || r.includes("clinical") || r.includes("healthcare") || r.includes("allied health")) return "nursing";
  if (r.includes("market") || r.includes("brand") || r.includes("digital") || r.includes("communications") || r.includes("content")) return "marketing";
  if (r.includes("data analyst") || r.includes("data science") || r.includes("business intelligence") || r.includes("analytics")) return "data";
  if (r.includes("software") || r.includes("developer") || r.includes("engineer") || r.includes("full stack") || r.includes("backend") || r.includes("frontend") || r.includes("devops") || r.includes("programmer")) return "software";
  return "general";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickN<T>(arr: T[], difficulty: string, n: number): T[] {
  const filtered = (arr as IQ[]).filter((q) => q.difficulty === difficulty);
  const pool = filtered.length >= n ? filtered : arr as IQ[];
  const shuffled = shuffle(pool);
  const result: T[] = [];
  for (let i = 0; i < n; i++) result.push(shuffled[i % shuffled.length] as T);
  return result;
}

function buildSessionQuestions(type: string, role: string, industry: string, difficulty: string, count: number): IQ[] {
  const roleKey = detectRoleForInterview(role, industry);
  const roleBank = ROLE_SPECIFIC_BANKS[roleKey] ?? ROLE_SPECIFIC_BANKS.general;

  if (type === "Behavioural") return pickN(BEHAVIOURAL, difficulty, count);
  if (type === "General graduate interview") return pickN(GRADUATE, difficulty, count);
  if (type === "Role-specific") return pickN(roleBank, difficulty, count);

  // Mixed practice — interleave evenly across all three types
  const perType = Math.ceil(count / 3);
  const b = pickN(BEHAVIOURAL, difficulty, perType);
  const g = pickN(GRADUATE, difficulty, perType);
  const r = pickN(roleBank, difficulty, perType);
  const combined: IQ[] = [];
  for (let i = 0; i < Math.max(b.length, g.length, r.length); i++) {
    if (b[i]) combined.push(b[i]);
    if (g[i]) combined.push(g[i]);
    if (r[i]) combined.push(r[i]);
  }
  return combined.slice(0, count);
}

function getFeedbackForQuestion(q: IQ, idx: number) {
  if (q.type === "Behavioural") return BEHAVIOURAL_FEEDBACK[idx % BEHAVIOURAL_FEEDBACK.length];
  if (q.type === "General Graduate") return GRADUATE_FEEDBACK[idx % GRADUATE_FEEDBACK.length];
  return ROLE_SPECIFIC_FEEDBACK[idx % ROLE_SPECIFIC_FEEDBACK.length];
}

/* ─────────────────────────────────────────
   Shared UI primitives
───────────────────────────────────────── */
const IC = "indigo";
const ACCENT = "#4f46e5";
const ACCENT_LIGHT = "#eef2ff";
const ACCENT_MED = "#6366f1";

function Btn({
  children, onClick, variant = "primary", size = "md", disabled = false, full = false,
}: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg"; disabled?: boolean; full?: boolean;
}) {
  const base = `inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${full ? "w-full" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`;
  const sz = { sm: "text-xs px-3 py-1.5", md: "text-sm px-4 py-2.5", lg: "text-sm px-6 py-3" }[size];
  const var_ = {
    primary: `bg-[${ACCENT}] text-white hover:bg-[${ACCENT_MED}] focus:ring-[${ACCENT}]`,
    secondary: "bg-white text-[#0f172a] border border-[#e2e8f0] hover:bg-[#f8fafc] focus:ring-[#94a3b8]",
    ghost: "text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc] focus:ring-[#94a3b8]",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  }[variant];
  return (
    <button className={`${base} ${sz} ${var_}`} onClick={disabled ? undefined : onClick}>
      {children}
    </button>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white border border-[#e2e8f0] rounded-xl ${className}`}>{children}</div>;
}

function AIDisclaimer({ text = "AI-generated feedback may contain inaccuracies. Review recommendations before making changes and seek professional career advice when appropriate." }: { text?: string }) {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
      <span className="text-amber-600 flex-shrink-0 mt-0.5">⚠</span>
      <p className="text-xs text-amber-800 leading-relaxed">{text}</p>
    </div>
  );
}

function PrivacyNotice({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 bg-[#f0f9ff] border border-[#bae6fd] rounded-lg">
      <span className="text-[#0ea5e9] flex-shrink-0 mt-0.5">🔒</span>
      <p className="text-xs text-[#0369a1] leading-relaxed">{text}</p>
    </div>
  );
}

function Progress({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-[#64748b]">{label}</span>
        <span className="text-xs font-medium text-[#0f172a]">{value}%</span>
      </div>
      <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-[#4f46e5] transition-all duration-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={`size-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${done ? "bg-[#4f46e5] border-[#4f46e5] text-white" : active ? "border-[#4f46e5] text-[#4f46e5] bg-white" : "border-[#e2e8f0] text-[#94a3b8] bg-white"}`}>
      {done ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : n}
    </div>
  );
}

/* ─────────────────────────────────────────
   Sidebar navigation
───────────────────────────────────────── */
/* SVG nav icons — inline so no dependency needed */
function IconDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function IconResume({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8l-5-4H7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 4v4h4" />
    </svg>
  );
}
function IconInterview({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.847L3 20l1.167-3.5A7.742 7.742 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
function IconProgress({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
    </svg>
  );
}
function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function IconClose({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function IconBriefcase({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="7" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v.01M2 12h20" />
    </svg>
  );
}

const NAV_ITEMS: { id: NavItem; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard",      label: "Dashboard",                Icon: IconDashboard },
  { id: "resume",         label: "Resume Feedback",          Icon: IconResume },
  { id: "interview",      label: "Interview Preparation",    Icon: IconInterview },
  { id: "job-matching",   label: "Job Matching",             Icon: IconBriefcase },
  { id: "progress",       label: "My Progress",              Icon: IconProgress },
  { id: "responsible-ai", label: "Responsible AI & Privacy", Icon: IconShield },
];
function SidebarContents({ active, onNav, userId, userName, userEmail, onLogout, onUpdateUser, onClose }: {
  active: NavItem;
  userId: number;
  onNav: (n: NavItem) => void;
  userName: string;
  userEmail: string;
  onLogout: () => void;
  onUpdateUser: (name: string, email: string) => void;
  onClose?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* Profile edit state */
  const [editName, setEditName] = useState(userName);
  const [editEmail, setEditEmail] = useState(userEmail);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  /* Password change state */
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  const closeMenu = () => setMenuOpen(false);
  const handleLogoutClick = () => { closeMenu(); setShowConfirm(true); };
  const handleConfirmLogout = () => { setShowConfirm(false); onLogout(); };

  const openProfile = () => {
    setEditName(userName); setEditEmail(userEmail);
    setProfileSaved(false); setProfileError("");
    closeMenu(); setShowProfile(true);
  };
  const saveProfile = async () => {
  setProfileError("");
  setProfileSaved(false);

  if (!editName.trim()) {
    setProfileError("Name cannot be empty.");
    return;
  }

  if (!editEmail.trim() || !editEmail.includes("@")) {
    setProfileError("Please enter a valid email address.");
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:8000/api/update-profile.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          preferred_name: editName.trim(),
          email: editEmail.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setProfileError(data.message || "Unable to update profile.");
      return;
    }

    onUpdateUser(
      data.user.preferred_name,
      data.user.email
    );

    setEditName(data.user.preferred_name);
    setEditEmail(data.user.email);
    setProfileSaved(true);

  } catch (error) {
    console.error("Profile update failed:", error);
    setProfileError("Unable to update profile. Please try again.");
  }
};

  const openPassword = () => {
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setPwSaved(false); setPwError("");
    setShowCurrent(false); setShowNew(false);
    closeMenu(); setShowPassword(true);
  };
  const savePassword = async () => {
  setPwError("");
  setPwSaved(false);

  if (!currentPw) {
    setPwError("Please enter your current password.");
    return;
  }

  if (newPw.length < 8) {
    setPwError("New password must be at least 8 characters.");
    return;
  }

  if (newPw !== confirmPw) {
    setPwError("New passwords do not match.");
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:8000/api/change-password.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          current_password: currentPw,
          new_password: newPw,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setPwError(data.message || "Unable to change password.");
      return;
    }

    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setPwSaved(true);
  } catch (error) {
    console.error("Password change failed:", error);
    setPwError("Unable to change password. Please try again.");
  }
};

  const handleNav = (id: NavItem) => {
    onNav(id);
    onClose?.();
  };

  return (
    <>
      {/* Logo / brand */}
      <div className="px-5 py-5 border-b border-[#f1f5f9] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-[#4f46e5] flex items-center justify-center text-white text-xs font-bold tracking-wide flex-shrink-0">AI</div>
          <div>
            <p className="text-sm font-bold text-[#0f172a] leading-snug">Career Readiness</p>
            <p className="text-[11px] text-[#94a3b8] leading-none mt-0.5">AI Assistant</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-4 pb-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => handleNav(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors group
                ${isActive
                  ? "bg-[#eef2ff] text-[#4f46e5]"
                  : "text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]"
                }`}
            >
              <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? "text-[#4f46e5]" : "text-[#94a3b8] group-hover:text-[#64748b]"}`} />
              <span className={`text-[13px] font-medium leading-none ${isActive ? "text-[#4f46e5]" : ""}`}>{label}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#4f46e5] flex-shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="px-3 pb-4 pt-2 border-t border-[#f1f5f9] flex-shrink-0 relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left ${menuOpen ? "bg-[#eef2ff]" : "hover:bg-[#f8fafc]"}`}
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          {/* Avatar */}
          <div className="size-8 rounded-full bg-[#eef2ff] border-2 border-[#c7d2fe] text-[#4f46e5] flex items-center justify-center text-sm font-bold flex-shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[#0f172a] truncate leading-snug">{userName}</p>
            <p className="text-[11px] text-[#94a3b8] leading-none mt-0.5">International student</p>
          </div>
          <svg
            className={`w-4 h-4 text-[#94a3b8] flex-shrink-0 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown — opens upward */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={closeMenu} />
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-[#e2e8f0] rounded-2xl shadow-xl overflow-hidden z-50">
              {/* Account header */}
              <div className="px-4 py-3 border-b border-[#f1f5f9] bg-[#f8fafc]">
                <p className="text-xs font-semibold text-[#0f172a]">{userName}</p>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">{userEmail}</p>
              </div>

              <div className="py-1.5">
                <button
                  onClick={openProfile}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a] transition-colors text-left"
                >
                  <IconUser className="w-4 h-4 flex-shrink-0" />
                  Profile
                </button>
                <button
                  onClick={openPassword}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a] transition-colors text-left"
                >
                  <IconSettings className="w-4 h-4 flex-shrink-0" />
                  Change Password
                </button>
              </div>

              <div className="border-t border-[#f1f5f9]" />

              <div className="py-1.5">
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#64748b] hover:bg-red-50 hover:text-red-600 transition-colors text-left"
                >
                  <IconLogout className="w-4 h-4 flex-shrink-0" />
                  Log out
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Profile modal */}
      {showProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setShowProfile(false)} />
          <div className="relative bg-white rounded-2xl border border-[#e2e8f0] shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-[#eef2ff] border-2 border-[#c7d2fe] text-[#4f46e5] flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {editName.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#0f172a]">Edit Profile</h2>
                  <p className="text-[11px] text-[#94a3b8]">International student</p>
                </div>
              </div>
              <button onClick={() => setShowProfile(false)} className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#0f172a] hover:bg-[#f8fafc] transition-colors">
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mb-5">
              <label className="block">
                <span className="text-xs font-medium text-[#0f172a] block mb-1.5">Full name</span>
                <input
                  value={editName}
                  onChange={(e) => { setEditName(e.target.value); setProfileSaved(false); setProfileError(""); }}
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
                  placeholder="Your name"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-[#0f172a] block mb-1.5">Email address</span>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => { setEditEmail(e.target.value); setProfileSaved(false); setProfileError(""); }}
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
                  placeholder="your@email.com"
                />
              </label>
            </div>

            {profileError && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg mb-4">
                <span className="text-red-500 text-xs flex-shrink-0 mt-0.5">✕</span>
                <p className="text-xs text-red-700">{profileError}</p>
              </div>
            )}
            {profileSaved && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg mb-4">
                <span className="text-emerald-600 text-xs flex-shrink-0 mt-0.5">✓</span>
                <p className="text-xs text-emerald-800">Profile updated successfully.</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowProfile(false)} className="flex-1 border border-[#e2e8f0] text-[#0f172a] font-medium py-2.5 rounded-xl hover:bg-[#f8fafc] transition-colors text-sm">
                {profileSaved ? "Close" : "Cancel"}
              </button>
              {!profileSaved && (
                <button onClick={saveProfile} className="flex-1 bg-[#4f46e5] text-white font-medium py-2.5 rounded-xl hover:bg-[#4338ca] transition-colors text-sm">
                  Save changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change Password modal */}
      {showPassword && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setShowPassword(false)} />
          <div className="relative bg-white rounded-2xl border border-[#e2e8f0] shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#0f172a]">Change Password</h2>
              <button onClick={() => setShowPassword(false)} className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#0f172a] hover:bg-[#f8fafc] transition-colors">
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mb-5">
              <label className="block">
                <span className="text-xs font-medium text-[#0f172a] block mb-1.5">Current password</span>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPw}
                    onChange={(e) => { setCurrentPw(e.target.value); setPwSaved(false); setPwError(""); }}
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent pr-10"
                    placeholder="Enter current password"
                  />
                  <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] text-xs">
                    {showCurrent ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-[#0f172a] block mb-1.5">New password</span>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => { setNewPw(e.target.value); setPwSaved(false); setPwError(""); }}
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent pr-10"
                    placeholder="Minimum 8 characters"
                  />
                  <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] text-xs">
                    {showNew ? "Hide" : "Show"}
                  </button>
                </div>
                {newPw.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${newPw.length >= i * 2 + 4 ? (newPw.length >= 12 ? "bg-emerald-400" : "bg-amber-400") : "bg-[#e2e8f0]"}`} />
                    ))}
                    <span className="text-[10px] text-[#94a3b8] ml-1">{newPw.length < 8 ? "Weak" : newPw.length < 10 ? "Fair" : newPw.length < 12 ? "Good" : "Strong"}</span>
                  </div>
                )}
              </label>
              <label className="block">
                <span className="text-xs font-medium text-[#0f172a] block mb-1.5">Confirm new password</span>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => { setConfirmPw(e.target.value); setPwSaved(false); setPwError(""); }}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent ${confirmPw && confirmPw !== newPw ? "border-red-300" : confirmPw && confirmPw === newPw ? "border-emerald-400" : "border-[#e2e8f0]"}`}
                  placeholder="Re-enter new password"
                />
                {confirmPw && confirmPw !== newPw && <p className="text-[10px] text-red-500 mt-1">Passwords do not match</p>}
                {confirmPw && confirmPw === newPw && <p className="text-[10px] text-emerald-600 mt-1">✓ Passwords match</p>}
              </label>
            </div>

            {pwError && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg mb-4">
                <span className="text-red-500 text-xs flex-shrink-0 mt-0.5">✕</span>
                <p className="text-xs text-red-700">{pwError}</p>
              </div>
            )}
            {pwSaved && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg mb-4">
                <span className="text-emerald-600 text-xs flex-shrink-0 mt-0.5">✓</span>
                <p className="text-xs text-emerald-800">Password changed successfully.</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowPassword(false)} className="flex-1 border border-[#e2e8f0] text-[#0f172a] font-medium py-2.5 rounded-xl hover:bg-[#f8fafc] transition-colors text-sm">
                {pwSaved ? "Close" : "Cancel"}
              </button>
              {!pwSaved && (
                <button onClick={savePassword} className="flex-1 bg-[#4f46e5] text-white font-medium py-2.5 rounded-xl hover:bg-[#4338ca] transition-colors text-sm">
                  Update password
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-2xl border border-[#e2e8f0] shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-full bg-[#f1f5f9] flex items-center justify-center flex-shrink-0">
                <IconLogout className="w-5 h-5 text-[#64748b]" />
              </div>
              <h2 className="text-base font-semibold text-[#0f172a]">Log out?</h2>
            </div>
            <p className="text-sm text-[#64748b] leading-relaxed mb-6">
              Are you sure you want to log out of your account? Your progress will be saved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 border border-[#e2e8f0] text-[#0f172a] font-medium py-2.5 rounded-xl hover:bg-[#f8fafc] transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 bg-[#0f172a] text-white font-medium py-2.5 rounded-xl hover:bg-[#1e293b] transition-colors text-sm flex items-center justify-center gap-2"
              >
                <IconLogout className="w-4 h-4" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Sidebar({ active, onNav, userId, userName, userEmail, onLogout, onUpdateUser }: {
  active: NavItem;
  userId: number;
  onNav: (n: NavItem) => void;
  userName: string;
  userEmail: string;
  onLogout: () => void;
  onUpdateUser: (name: string, email: string) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Desktop sidebar — fixed left, full height ── */}
      <aside className="hidden md:flex w-[248px] flex-shrink-0 flex-col fixed inset-y-0 left-0 border-r border-[#e2e8f0] bg-white z-30">
<SidebarContents active={active} onNav={onNav} userId={userId} userName={userName} userEmail={userEmail} onLogout={onLogout} onUpdateUser={onUpdateUser} />
      </aside>

      {/* ── Desktop spacer so main content doesn't sit under the fixed sidebar ── */}
      <div className="hidden md:block w-[248px] flex-shrink-0" />

      {/* ── Mobile: top bar with hamburger ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#e2e8f0] flex items-center px-4 h-14">
        <div className="flex items-center gap-2.5 flex-1">
          <div className="size-7 rounded-lg bg-[#4f46e5] flex items-center justify-center text-white text-[10px] font-bold">AI</div>
          <p className="text-sm font-bold text-[#0f172a]">Career Readiness</p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc] transition-colors"
          aria-label="Open navigation"
        >
          <IconMenu className="w-5 h-5" />
        </button>
      </div>

      {/* ── Mobile: top-bar spacer ── */}
      <div className="md:hidden h-14 flex-shrink-0 w-full" />

      {/* ── Mobile: slide-in drawer ── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col shadow-2xl md:hidden">
            {/* Close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#94a3b8] hover:text-[#0f172a] hover:bg-[#f8fafc] transition-colors"
              aria-label="Close navigation"
            >
              <IconClose className="w-4 h-4" />
            </button>
            <SidebarContents
              active={active}
              onNav={onNav}
              userId={userId!}
              userName={userName}
              userEmail={userEmail}
              onLogout={onLogout}
              onUpdateUser={onUpdateUser}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </>
      )}
    </>
  );
}

/* ─────────────────────────────────────────
   SCREEN AUTH — Sign in / Sign up
───────────────────────────────────────── */

function AuthScreen({ onSuccess }: { onSuccess: (userId: number, name: string, email: string, isNew: boolean) => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  /* Sign-in state */
  const [siEmail, setSiEmail]       = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siError, setSiError]       = useState("");
  const [siLoading, setSiLoading]   = useState(false);
  const [showSiPass, setShowSiPass] = useState(false);

  /* Sign-up state */
  const [suName, setSuName]           = useState("");
  const [suEmail, setSuEmail]         = useState("");
  const [suPassword, setSuPassword]   = useState("");
  const [suConfirm, setSuConfirm]     = useState("");
  const [suUni, setSuUni]             = useState("");
  const [suAgree, setSuAgree]         = useState(false);
  const [suError, setSuError]         = useState("");
  const [suLoading, setSuLoading]     = useState(false);
  const [showSuPass, setShowSuPass]   = useState(false);

  const UNIS = ["University of Sydney", "University of Melbourne", "UNSW Sydney", "Monash University", "University of Queensland", "University of Adelaide", "Macquarie University", "Other"];

  const handleSignIn = async () => {
    setSiError("");

    if (!siEmail || !siPassword) {
      setSiError("Please enter your email and password.");
      return;
    }

    setSiLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: siEmail.trim(),
          password: siPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSiError(data.message || "Email or password is incorrect.");
        return;
      }
const displayName =
  data.user.preferred_name?.trim() ||
  data.user.email.split("@")[0].split(".")[0];

onSuccess(
  data.user.user_id,
  displayName,
  data.user.email,
  false
);

    } catch (error) {
      setSiError("Unable to connect to the server. Please try again.");
    } finally {
      setSiLoading(false);
    }
  };

  const handleSignUp = async () => {
    setSuError("");

    if (!suName.trim()) {
      setSuError("Please enter your preferred name.");
      return;
    }

    if (!suEmail.includes("@")) {
      setSuError("Please enter a valid email address.");
      return;
    }

    if (suPassword.length < 8) {
      setSuError("Password must be at least 8 characters.");
      return;
    }

    if (suPassword !== suConfirm) {
      setSuError("Passwords do not match.");
      return;
    }

    if (!suAgree) {
      setSuError("Please accept the privacy notice to continue.");
      return;
    }

    setSuLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/register.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  preferred_name: suName.trim(),
  email: suEmail.trim(),
  password: suPassword,
}),
      });

      const data = await response.json();

      if (!response.ok) {
        setSuError(data.message || "Unable to create account.");
        return;
      }

      onSuccess(
  data.user.user_id,
  data.user.preferred_name,
  data.user.email,
  true
);
    } catch (error) {
      setSuError("Unable to connect to the server. Please try again.");
    } finally {
      setSuLoading(false);
    }
  };

  const Logo = () => (
    <div className="flex items-center justify-center gap-2.5 mb-8">
      <div className="size-9 rounded-xl bg-[#4f46e5] flex items-center justify-center text-white text-sm font-bold shadow-sm">AI</div>
      <div>
        <p className="text-sm font-bold text-[#0f172a] leading-tight">Career Readiness Assistant</p>
        <p className="text-[10px] text-[#94a3b8]">For international students in Australia</p>
      </div>
    </div>
  );

  const inputCls = "w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent bg-white placeholder:text-[#94a3b8]";

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Logo />

        {/* Tab toggle */}
        <div className="flex bg-white border border-[#e2e8f0] rounded-xl p-1 mb-6 shadow-sm">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setSiError(""); setSuError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === m ? "bg-[#4f46e5] text-white shadow-sm" : "text-[#64748b] hover:text-[#0f172a]"}`}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden">
          {/* ── SIGN IN ── */}
          {mode === "signin" && (
            <div className="p-7">
              <h2 className="text-lg font-semibold text-[#0f172a] mb-1">Welcome back</h2>
              <p className="text-xs text-[#64748b] mb-6">Sign in to continue your career preparation.</p>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-medium text-[#0f172a] block mb-1.5">Email address</span>
                  <input
                    type="email"
                    placeholder="you@university.edu.au"
                    value={siEmail}
                    onChange={(e) => setSiEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                    className={inputCls}
                  />
                </label>

                <label className="block">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs font-medium text-[#0f172a]">Password</span>
                    <button
  type="button"
  onClick={() =>
    alert(
      "Password recovery is not available in this MVP. Please contact the system administrator if you need assistance accessing your account."
    )
  }
  className="text-xs text-[#4f46e5] hover:underline"
>
  Forgot password?
</button>
                  </div>
                  <div className="relative">
                    <input
                      type={showSiPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={siPassword}
                      onChange={(e) => setSiPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                      className={`${inputCls} pr-10`}
                    />
                    <button
                      onClick={() => setShowSiPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] text-xs"
                    >
                      {showSiPass ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>
              </div>

              {siError && (
                <div className="mt-4 flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-red-500 flex-shrink-0 text-xs mt-0.5">✕</span>
                  <p className="text-xs text-red-700">{siError}</p>
                </div>
              )}

              <button
                onClick={handleSignIn}
                disabled={siLoading}
                className="w-full mt-5 bg-[#4f46e5] text-white font-medium py-2.5 rounded-lg hover:bg-[#4338ca] transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {siLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Signing in…
                  </>
                ) : "Sign in"}
              </button>
              <p className="text-xs text-center text-[#64748b] mt-4">
                Don't have an account?{" "}
                <button onClick={() => setMode("signup")} className="text-[#4f46e5] font-medium hover:underline">Create one</button>
              </p>
            </div>
          )}

          {/* ── SIGN UP ── */}
          {mode === "signup" && (
            <div className="p-7">
              <h2 className="text-lg font-semibold text-[#0f172a] mb-1">Create your account</h2>
              <p className="text-xs text-[#64748b] mb-6">Set up your career readiness profile.</p>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-medium text-[#0f172a] block mb-1.5">Preferred name</span>
                  <input
                    type="text"
                    placeholder="e.g. Mei"
                    value={suName}
                    onChange={(e) => setSuName(e.target.value)}
                    className={inputCls}
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-[#0f172a] block mb-1.5">University email address</span>
                  <input
                    type="email"
                    placeholder="you@university.edu.au"
                    value={suEmail}
                    onChange={(e) => setSuEmail(e.target.value)}
                    className={inputCls}
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-[#0f172a] block mb-1.5">University</span>
                  <select
                    value={suUni}
                    onChange={(e) => setSuUni(e.target.value)}
                    className={`${inputCls} text-[${suUni ? "#0f172a" : "#94a3b8"}]`}
                  >
                    <option value="" disabled>Select your university</option>
                    {UNIS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-[#0f172a] block mb-1.5">Password</span>
                  <div className="relative">
                    <input
                      type={showSuPass ? "text" : "password"}
                      placeholder="Minimum 8 characters"
                      value={suPassword}
                      onChange={(e) => setSuPassword(e.target.value)}
                      className={`${inputCls} pr-10`}
                    />
                    <button onClick={() => setShowSuPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] text-xs">
                      {showSuPass ? "Hide" : "Show"}
                    </button>
                  </div>
                  {suPassword.length > 0 && (
                    <div className="flex gap-1 mt-1.5">
                      {[4, 6, 8, 10].map((n) => (
                        <div key={n} className={`flex-1 h-1 rounded-full transition-colors ${suPassword.length >= n ? (suPassword.length >= 10 ? "bg-emerald-500" : suPassword.length >= 8 ? "bg-[#4f46e5]" : "bg-amber-400") : "bg-[#e2e8f0]"}`} />
                      ))}
                      <span className="text-[10px] text-[#94a3b8] ml-1">{suPassword.length < 6 ? "Weak" : suPassword.length < 8 ? "Fair" : suPassword.length < 10 ? "Good" : "Strong"}</span>
                    </div>
                  )}
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-[#0f172a] block mb-1.5">Confirm password</span>
                  <input
                    type="password"
                    placeholder="Re-enter your password"
                    value={suConfirm}
                    onChange={(e) => setSuConfirm(e.target.value)}
                    className={`${inputCls} ${suConfirm && suConfirm !== suPassword ? "border-red-300 focus:ring-red-400" : suConfirm && suConfirm === suPassword ? "border-emerald-400" : ""}`}
                  />
                  {suConfirm && suConfirm !== suPassword && <p className="text-[10px] text-red-500 mt-1">Passwords do not match</p>}
                  {suConfirm && suConfirm === suPassword && <p className="text-[10px] text-emerald-600 mt-1">✓ Passwords match</p>}
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <div
                    onClick={() => setSuAgree(!suAgree)}
                    className={`mt-0.5 size-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${suAgree ? "bg-[#4f46e5] border-[#4f46e5]" : "border-[#cbd5e1] hover:border-[#4f46e5]"}`}
                  >
                    {suAgree && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="text-xs text-[#64748b] leading-relaxed">
                    I understand that this platform collects limited personal information to provide career preparation support, and that AI-generated feedback should be reviewed critically.{" "}
                    <button className="text-[#4f46e5] hover:underline">Privacy notice →</button>
                  </span>
                </label>
              </div>

              {suError && (
                <div className="mt-4 flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-red-500 flex-shrink-0 text-xs mt-0.5">✕</span>
                  <p className="text-xs text-red-700">{suError}</p>
                </div>
              )}

              <button
                onClick={handleSignUp}
                disabled={suLoading}
                className="w-full mt-5 bg-[#4f46e5] text-white font-medium py-2.5 rounded-lg hover:bg-[#4338ca] transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {suLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Creating account…
                  </>
                ) : "Create account →"}
              </button>

              <p className="text-xs text-center text-[#64748b] mt-4">
                Already have an account?{" "}
                <button onClick={() => setMode("signin")} className="text-[#4f46e5] font-medium hover:underline">Sign in</button>
              </p>
            </div>
          )}
        </div>

        <p className="text-[10px] text-[#94a3b8] text-center mt-5 leading-relaxed px-4">
          This platform provides career preparation support only. It does not guarantee employment outcomes and does not replace professional career advice.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 1 — Landing
───────────────────────────────────────── */
function LandingScreen({ onStart, onLearn }: { onStart: () => void; onLearn: () => void }) {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Top nav */}
      <header className="border-b border-[#e2e8f0] sticky top-0 bg-white/95 backdrop-blur z-40">
        <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-md bg-[#4f46e5] flex items-center justify-center text-white text-xs font-bold">AI</div>
            <span className="font-semibold text-[#0f172a] text-sm">Career Readiness Assistant</span>
          </div>
          <nav className="flex items-center gap-5 text-sm">
            <button onClick={() => scrollTo("how")} className="text-[#64748b] hover:text-[#0f172a] transition-colors">How it works</button>
            <button onClick={() => scrollTo("responsible")} className="text-[#64748b] hover:text-[#0f172a] transition-colors">Responsible AI</button>
            <Btn onClick={onStart} size="sm">Get Started</Btn>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-8 pt-20 pb-16">
        <div className="max-w-2xl">
          <span className="inline-block text-xs font-semibold text-[#4f46e5] bg-[#eef2ff] px-3 py-1 rounded-full mb-5">For international students in Australia</span>
          <h1 className="text-5xl font-semibold text-[#0f172a] leading-tight tracking-tight mb-5">
            AI Career<br />Readiness Assistant
          </h1>
          <p className="text-lg text-[#64748b] leading-relaxed mb-8 max-w-lg">
            Personalised AI-powered resume feedback and interview preparation for international students seeking graduate employment in Australia.
          </p>
          <div className="flex items-center gap-3">
            <Btn onClick={onStart} size="lg">Get Started</Btn>
            <Btn onClick={() => scrollTo("how")} variant="secondary" size="lg">Learn How It Works</Btn>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="bg-[#f8fafc] border-y border-[#e2e8f0] py-16" id="how">
        <div className="max-w-6xl mx-auto px-8">
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-widest mb-10 text-center">Core capabilities</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: "📄", title: "Resume Feedback",
                desc: "Receive personalised feedback to improve your resume for the Australian employment context. Understand what employers look for and how to present your experience clearly.",
                cta: "Review My Resume", action: onStart,
              },
              {
                icon: "🎙", title: "Interview Preparation",
                desc: "Practise interview questions and receive constructive AI-assisted feedback. Build confidence with behavioural, general graduate, and role-specific question practice.",
                cta: "Start Interview Practice", action: onStart,
              },
            ].map((f) => (
              <Card key={f.title} className="p-8 hover:shadow-sm transition-shadow">
                <span className="text-3xl block mb-4">{f.icon}</span>
                <h3 className="text-base font-semibold text-[#0f172a] mb-2">{f.title}</h3>
                <p className="text-sm text-[#64748b] leading-relaxed mb-5">{f.desc}</p>
                <Btn onClick={f.action} variant="secondary" size="sm">{f.cta}</Btn>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Responsible AI trust */}
      <section id="responsible" className="max-w-6xl mx-auto px-8 py-16">
        <p className="text-xs font-semibold text-[#64748b] uppercase tracking-widest mb-8 text-center">Responsible AI principles</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "⚖️", label: "Fairness", desc: "Feedback focuses on career preparation, not personal characteristics." },
            { icon: "🔍", label: "Transparency", desc: "AI-generated content is clearly identified throughout the platform." },
            { icon: "🔒", label: "Privacy", desc: "Only information necessary for career preparation support is collected." },
            { icon: "👤", label: "Human Oversight", desc: "AI feedback supports preparation and does not replace professional advisers." },
          ].map((p) => (
            <div key={p.label} className="border border-[#e2e8f0] rounded-xl p-5 text-center">
              <span className="text-2xl block mb-2">{p.icon}</span>
              <p className="text-xs font-semibold text-[#0f172a] mb-1">{p.label}</p>
              <p className="text-xs text-[#64748b] leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-[#0f172a] py-14">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">Start building your career readiness today.</h2>
          <p className="text-[#94a3b8] text-sm mb-8 leading-relaxed max-w-xl mx-auto">
            This platform provides career preparation support for international students. It does not guarantee employment outcomes and does not replace professional career advice.
          </p>
          <Btn onClick={onStart} size="lg">Get Started</Btn>
          <p className="text-[#475569] text-xs mt-6">AI-generated recommendations should be reviewed critically and used alongside professional career advice.</p>
        </div>
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 2 — Onboarding
───────────────────────────────────────── */
function OnboardingScreen({ onDone }: { onDone: (name: string) => void }) {
  const [step, setStep] = useState(1);
  const [showWhy, setShowWhy] = useState(false);
  const [form, setForm] = useState({
    name: "Mei", field: "Information Technology", qualification: "Master of IT", role: "Software Developer", industry: "Technology", stage: "Preparing for graduate employment",
  });

  const STAGES = ["Preparing for graduate employment", "Currently applying for roles", "Preparing for upcoming interviews"];

  const next = () => { if (step < 2) setStep(2); else onDone(form.name || "Student"); };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col">
      <header className="border-b border-[#e2e8f0] bg-white">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-[#4f46e5] text-white text-xs font-bold flex items-center justify-center">AI</div>
            <span className="font-semibold text-[#0f172a] text-sm">Career Readiness Assistant</span>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-10 flex-1 w-full">
        {/* Step indicator */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <StepDot n={1} active={step === 1} done={step > 1} />
          <div className={`h-0.5 w-12 transition-colors ${step > 1 ? "bg-[#4f46e5]" : "bg-[#e2e8f0]"}`} />
          <StepDot n={2} active={step === 2} done={false} />
        </div>

        {step === 1 && (
          <>
            <h1 className="text-2xl font-semibold text-[#0f172a] tracking-tight mb-1">Welcome to Career Readiness Assistant</h1>
            <p className="text-sm text-[#64748b] mb-7">Tell us a little about yourself so we can personalise your experience.</p>

            <div className="flex items-center justify-between mb-5">
              <p className="text-xs text-[#64748b]">Step 1 of 2 — About you</p>
              <button onClick={() => setShowWhy(!showWhy)} className="text-xs text-[#4f46e5] hover:underline">Why we ask this ▾</button>
            </div>

            {showWhy && (
              <div className="mb-5 p-4 bg-[#eef2ff] border border-[#c7d2fe] rounded-xl text-xs text-[#3730a3] leading-relaxed">
                This information is used to contextualise the feedback you receive. For example, knowing your target role helps the AI generate more relevant interview questions and resume suggestions. We do not collect sensitive personal information such as visa status, ethnicity or health details.
              </div>
            )}

            <Card className="p-6 space-y-4">
              {[
                { label: "Preferred name", key: "name" as const, type: "text", placeholder: "e.g. Mei" },
                { label: "Field of study", key: "field" as const, type: "text", placeholder: "e.g. Information Technology" },
                { label: "Current qualification", key: "qualification" as const, type: "text", placeholder: "e.g. Master of IT" },
                { label: "Target job or role", key: "role" as const, type: "text", placeholder: "e.g. Software Developer" },
                { label: "Industry of interest", key: "industry" as const, type: "text", placeholder: "e.g. Technology, Finance, Healthcare" },
              ].map((f) => (
                <label key={f.key} className="block">
                  <span className="text-xs font-medium text-[#0f172a] block mb-1.5">{f.label}</span>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent bg-white"
                  />
                </label>
              ))}
            </Card>

            <PrivacyNotice text="We only ask for information necessary to personalise career preparation support. We do not request visa status, ethnicity, health information or other sensitive attributes." />
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-semibold text-[#0f172a] tracking-tight mb-1">Career stage</h1>
            <p className="text-sm text-[#64748b] mb-7">Let us know where you are in your career journey.</p>
            <p className="text-xs text-[#64748b] mb-5">Step 2 of 2 — Career stage</p>

            <Card className="p-4 mb-4 space-y-2">
              {STAGES.map((s) => (
                <button key={s} onClick={() => setForm({ ...form, stage: s })}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium text-left transition-colors ${form.stage === s ? "bg-[#eef2ff] border-[#a5b4fc] text-[#4f46e5]" : "bg-white border-[#e2e8f0] text-[#475569] hover:border-[#94a3b8]"}`}>
                  <div className={`size-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${form.stage === s ? "border-[#4f46e5]" : "border-[#cbd5e1]"}`}>
                    {form.stage === s && <div className="size-2 rounded-full bg-[#4f46e5]" />}
                  </div>
                  {s}
                </button>
              ))}
            </Card>
          </>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button onClick={() => onDone(form.name || "Student")} className="text-xs text-[#94a3b8] hover:text-[#64748b] transition-colors">
            Skip optional information →
          </button>
          <Btn onClick={next}>{step === 1 ? "Continue →" : "Get started →"}</Btn>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 3 — Dashboard
───────────────────────────────────────── */
function DashboardScreen({ userName, activity, onResume, onInterview, onJobMatch }: {
  userName: string; activity: ActivityState; onResume: () => void; onInterview: () => void; onJobMatch: () => void;
}) {
  const resumeProgress = activity.resumeReviews.length > 0 ? 100 : 0;
  const answeredInterviewQuestions = activity.interviewSessions.reduce(
  (total, session) => total + session.questionsAnswered,
  0
);

const totalInterviewQuestions = activity.interviewSessions.reduce(
  (total, session) => total + session.total,
  0
);

const interviewProgress =
  totalInterviewQuestions > 0
    ? Math.round(
        (answeredInterviewQuestions / totalInterviewQuestions) * 100
      )
    : 0;

  return (
    <div className="py-8 px-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#0f172a] tracking-tight mb-1">Welcome, {userName}</h1>
        <p className="text-sm text-[#64748b]">Continue building your career readiness for the Australian job market.</p>
      </div>

      {/* Primary feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
        {[
          {
            icon: "📄", title: "Resume Feedback", badge: "Ready",
            desc: "Upload your resume and receive personalised, contextualised feedback for Australian graduate applications.",
            cta: "Review My Resume", action: onResume, accent: true,
          },
          {
            icon: "🎙", title: "Interview Preparation", badge: "Ready",
            desc: "Practise interview questions and receive constructive, structured feedback to build your confidence.",
            cta: "Start Interview Practice", action: onInterview, accent: false,
          },
        ].map((c) => (
          <Card key={c.title} className={`p-6 ${c.accent ? "border-[#a5b4fc]" : ""}`}>
            <div className="flex items-start justify-between mb-4">
              <span className="text-3xl">{c.icon}</span>
              <span className="text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">{c.badge}</span>
            </div>
            <h3 className="text-base font-semibold text-[#0f172a] mb-2">{c.title}</h3>
            <p className="text-xs text-[#64748b] leading-relaxed mb-5">{c.desc}</p>
            <Btn onClick={c.action} variant={c.accent ? "primary" : "secondary"} size="sm" full>{c.cta}</Btn>
          </Card>
        ))}
      </div>

      {/* Job Matching card — full width, distinguishable */}
      <Card className="p-6 mb-8 border-[#c7d2fe] bg-gradient-to-r from-[#f5f3ff] to-white">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <span className="text-3xl flex-shrink-0">🎯</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-[#0f172a]">Job Advertisement Matching</h3>
                <span className="text-xs font-medium bg-[#eef2ff] text-[#4f46e5] border border-[#c7d2fe] px-2 py-0.5 rounded-full flex-shrink-0">New</span>
              </div>
              <p className="text-xs text-[#64748b] leading-relaxed">Compare your resume with an Australian job advertisement and identify matching skills, missing requirements and areas for improvement.</p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <Btn onClick={onJobMatch} variant="primary" size="sm">Analyse Job Match</Btn>
          </div>
        </div>
      </Card>

      {/* Progress */}
      <Card className="p-6 mb-5">
        <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Your progress</h3>
        <div className="space-y-5">
          <div>
            <Progress value={resumeProgress} label="Resume Review" />
            {resumeProgress === 0 && (
              <p className="text-xs text-[#94a3b8] mt-1.5">Upload your resume to begin your first review.</p>
            )}
          </div>
          <div>
            <Progress value={interviewProgress} label="Interview Practice" />
            {interviewProgress === 0 && (
              <p className="text-xs text-[#94a3b8] mt-1.5">Start an interview practice session to begin tracking your progress.</p>
            )}
          </div>
        </div>
        <p className="text-xs text-[#94a3b8] mt-5">
  Progress reflects your recorded activity within this platform. It does not measure actual job readiness or predict employment outcomes.
</p>
      </Card>

      <AIDisclaimer text="AI-generated feedback should be reviewed critically and used alongside professional career advice. This platform supports career preparation and does not guarantee employment outcomes." />
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 4 — Resume upload
───────────────────────────────────────── */
function ResumeUploadScreen({ onAnalyse }: { onAnalyse: (content: string, role: string, fileName: string) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [role, setRole] = useState("Software Developer");
  const [resumeText, setResumeText] = useState("");
  const [error, setError] = useState("");
  const [inputMode, setInputMode] = useState<"upload" | "paste">("upload");

 const handleDrop = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  setDragOver(false);

  const droppedFile = e.dataTransfer.files[0];
  if (!droppedFile) return;

  if (
    ![
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(droppedFile.type)
  ) {
    setError("Unsupported file type. Please upload a PDF or DOCX file.");
    setSelectedFile(null);
    return;
  }

  setError("");
  setFile(droppedFile.name);
  setSelectedFile(droppedFile);
  setResumeText("");
}, []);

const fileInputRef = useRef<HTMLInputElement>(null);

const handleFileSelect = () => {
  fileInputRef.current?.click();
};

 const canAnalyse =
  inputMode === "paste"
    ? resumeText.trim().length >= 50
    : selectedFile !== null;
  return (
    <div className="py-8 px-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-[#0f172a] tracking-tight mb-1">Resume Feedback</h1>
      <p className="text-sm text-[#64748b] mb-6">Upload your resume or use a demo resume to receive personalised feedback for the Australian employment context.</p>

      

      {/* Input mode toggle */}
      <div className="flex gap-1 mb-4 bg-[#f8fafc] p-1 rounded-lg w-fit">
        {(["upload", "paste"] as const).map((m) => (
          <button key={m} onClick={() => setInputMode(m)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${inputMode === m ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b] hover:text-[#0f172a]"}`}>
            {m === "upload" ? "Upload file" : "Paste resume text"}
          </button>
        ))}
      </div>

      {inputMode === "upload" ? (
        <Card className="mb-5 overflow-hidden">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`m-4 border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${dragOver ? "border-[#4f46e5] bg-[#eef2ff]" : file ? "border-emerald-400 bg-emerald-50" : "border-[#e2e8f0] hover:border-[#a5b4fc] hover:bg-[#eef2ff]/30"}`}
            onClick={handleFileSelect}
>
  <input
    ref={fileInputRef}
    type="file"
    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    className="hidden"
    onClick={(e) => e.stopPropagation()}
    onChange={(e) => {
  const chosenFile = e.target.files?.[0];
  if (!chosenFile) return;

  if (
    ![
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(chosenFile.type)
  ) {
    setError("Unsupported file type. Please upload a PDF or DOCX file.");
    setSelectedFile(null);
    e.target.value = "";
    return;
  }

  setError("");
  setFile(chosenFile.name);
  setSelectedFile(chosenFile);
  setResumeText("");
}}
  />

  {file ? (
              <>
                <span className="text-4xl block mb-3">📄</span>
                <p className="text-sm font-medium text-emerald-700 mb-1">{file}</p>
<p className="text-xs text-[#64748b]">File selected</p>
                <button
  onClick={(e) => {
    e.stopPropagation();
    setFile(null);
    setSelectedFile(null);
    setResumeText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }}
  className="text-xs text-red-500 hover:underline mt-2"
>
  Remove
</button>
              </>
            ) : (
              <>
                <span className="text-4xl block mb-3">⬆</span>
                <p className="text-sm font-medium text-[#0f172a] mb-1">Drag and drop your resume here</p>
                <p className="text-xs text-[#64748b] mb-3">or click to select a file</p>
<span className="text-xs bg-[#f1f5f9] px-3 py-1 rounded-full text-[#64748b]">DOCX supported · PDF coming soon</span>
              </>
            )}
          </div>
          {error && (
            <div className="mx-4 mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-500 text-sm">✕</span>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
          <div className="px-4 pb-4">
<p className="text-xs text-[#94a3b8]">DOCX files are processed automatically. For PDF resumes, please use the "Paste resume text" option in the current MVP.</p>
          </div>
        </Card>
      ) : (
        <Card className="mb-5 p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-[#0f172a]">Paste your resume text</label>
            {file && <span className="text-xs text-emerald-700 font-medium">📄 {file}</span>}
          </div>

<textarea
  rows={10}
  value={resumeText}
  onChange={(e) => {
  setResumeText(e.target.value);
  setFile(null);
  setSelectedFile(null);
  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
}}
           placeholder="Paste the full text of your resume here. Include your name, education, work experience, skills and any other sections…"
            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-xs text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent resize-none leading-relaxed font-mono" />
          <p className="text-xs text-[#94a3b8] mt-2">{resumeText.length > 0 ? `${resumeText.trim().split(/\s+/).length} words detected` : "Minimum 50 words required for analysis"}</p>
        </Card>
      )}

      <Card className="p-5 mb-5">
        <label className="block">
          <span className="text-xs font-medium text-[#0f172a] block mb-1.5">Target role or job title</span>
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Software Developer"
            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent" />
        </label>
      </Card>

      <PrivacyNotice text="Your resume may contain personal information. Only upload information you are comfortable using for this assessment." />
      <div className="mt-4">

<Btn
  onClick={async () => {
    setError("");

    if (inputMode === "paste") {
      onAnalyse(
        resumeText,
        role || "the target role",
        "Pasted resume text"
      );
      return;
    }

    if (!selectedFile) {
      setError("Please select a resume file.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("resume", selectedFile);

      const response = await fetch(
        "http://localhost:8000/api/resume-upload.php",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to read the resume file.");
        return;
      }

      if (!data.resume_text?.trim()) {
        setError("No readable resume text was found in the uploaded file.");
        return;
      }

      setResumeText(data.resume_text);

      onAnalyse(
        data.resume_text,
        role || "the target role",
        data.file_name || selectedFile.name
      );
    } catch (error) {
      console.error("Resume file upload failed:", error);
      setError("Unable to process the resume file. Please try again.");
    }
  }}
  size="lg"
  full
  disabled={!canAnalyse}
>
  {canAnalyse
    ? "Analyse Resume →"
    : "Upload or paste your resume to continue"}
</Btn>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Shared — AI Error Screen
───────────────────────────────────────── */
function AIErrorScreen({
  context = "AI-generated",
  onRetry,
  onBack,
}: {
  context?: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div className="py-8 px-8 max-w-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-56px)] text-center">
      {/* Icon */}
      <div className="size-16 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center mb-6">
        <svg className="w-7 h-7 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>

      <h1 className="text-xl font-semibold text-[#0f172a] mb-3 tracking-tight">
        We couldn't generate your results
      </h1>
      <p className="text-sm text-[#64748b] leading-relaxed mb-2 max-w-sm">
        The AI service is temporarily unavailable or the request could not be completed. Your results have not been generated. Please try again.
      </p>
      <p className="text-xs text-[#94a3b8] mb-8 max-w-xs leading-relaxed">
        {context} features may occasionally be unavailable due to technical or service issues.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Btn onClick={onRetry} size="md" full>Retry</Btn>
        <Btn onClick={onBack} variant="secondary" size="md" full>Go Back</Btn>
      </div>

      <p className="text-xs text-[#94a3b8] mt-6 max-w-xs leading-relaxed">
        Retrying does not guarantee success if the service remains unavailable.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 4b — Resume analysing
───────────────────────────────────────── */
function ResumeAnalysingScreen() {
  const [progress, setProgress] = useState(12);

  const STEPS = [
    "Reading resume…",
    "Identifying skills and experience…",
    "Comparing resume with target role…",
    "Generating personalised recommendations…",
  ];

  const [step, setStep] = useState(0);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((current) => {
        if (current >= 90) {
          return current;
        }

        return Math.min(current + 4, 90);
      });
    }, 700);

    const stepTimer = setInterval(() => {
      setStep((current) =>
        Math.min(current + 1, STEPS.length - 1)
      );
    }, 1800);

    return () => {
      clearInterval(progressTimer);
      clearInterval(stepTimer);
    };
  }, []);

  return (
    <div className="py-8 px-8 max-w-md mx-auto text-center flex flex-col items-center justify-center min-h-[calc(100vh-56px)]">
      <div className="size-20 rounded-2xl bg-[#eef2ff] flex items-center justify-center text-4xl mb-8">
        📄
      </div>

      <h1 className="text-xl font-semibold text-[#0f172a] mb-3 tracking-tight">
        Analysing your resume…
      </h1>

      <p className="text-sm text-[#64748b] mb-10 leading-relaxed max-w-xs">
        Please wait while AI analyses your resume in the context of Australian graduate employment.
      </p>

      <div className="w-full bg-[#f1f5f9] rounded-full h-2 mb-4 overflow-hidden">
        <div
          className="h-2 rounded-full bg-[#4f46e5] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-xs text-[#64748b] h-4">
        {STEPS[step]}
      </p>

      <p className="text-xs text-[#94a3b8] mt-1">
        {progress}%
      </p>

      <AIDisclaimer text="AI analysis is in progress. Generated feedback should be reviewed critically before making changes to your resume." />
    </div>
  );
}
      

/* ─────────────────────────────────────────
   SCREEN 5 — Resume feedback results
───────────────────────────────────────── */
const PRIORITY_STYLES: Record<string, string> = {
  High: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-slate-50 text-slate-600 border-slate-200",
};

function ResumeResultsScreen({ onBack, onUploadNew, feedback }: { onBack: () => void; onUploadNew: () => void; feedback: ResumeFeedback }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "sections">("overview");

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  const allItems = feedback.sections.flatMap((s) => s.items);
  const highCount = allItems.filter((i) => i.priority === "High").length;

  return (
    <div className="py-8 px-8 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs text-[#64748b] mb-1">Resume Feedback · {feedback.resumeLabel}</p>
          <h1 className="text-2xl font-semibold text-[#0f172a] tracking-tight">Your Resume Feedback</h1>
        </div>
        <Btn onClick={onUploadNew} variant="secondary" size="sm">Analyse another resume</Btn>
      </div>
      <p className="text-xs text-[#94a3b8] mb-6">Target role: <span className="text-[#64748b] font-medium">{feedback.targetRole}</span></p>

      {/* Tab nav */}
      <div className="flex gap-1 mb-6 bg-[#f8fafc] p-1 rounded-lg w-fit">
        {([["overview", "Overview"], ["sections", "Detailed Feedback"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === key ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b] hover:text-[#0f172a]"}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          {/* AI Overview */}
          <Card className="p-5 mb-5 border-[#a5b4fc]">
            <div className="flex items-start gap-3">
              <span className="text-[#4f46e5] mt-0.5 text-lg">✦</span>
              <div>
                <p className="text-xs font-semibold text-[#4f46e5] uppercase tracking-widest mb-2">AI Overview</p>
                <p className="text-sm text-[#0f172a] leading-relaxed">{feedback.overview}</p>
              </div>
            </div>
          </Card>

          {/* Role Relevance */}
          <Card className="p-5 mb-5">
            <h2 className="text-sm font-semibold text-[#0f172a] mb-4">Role Relevance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-semibold mb-2 text-emerald-700">Strong match</p>
                <ul className="space-y-1.5">
                  {feedback.roleRelevance.strong.map((item, i) => (
                    <li key={i} className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 leading-relaxed">{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2 text-amber-700">Partial match</p>
                <ul className="space-y-1.5">
                  {feedback.roleRelevance.partial.map((item, i) => (
                    <li key={i} className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2 text-red-700">Not evidenced</p>
                <ul className="space-y-1.5">
                  {feedback.roleRelevance.missing.map((item, i) => (
                    <li key={i} className="text-xs text-red-800 bg-red-50 border border-red-100 rounded-lg px-3 py-2 leading-relaxed">{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* Key Strengths */}
          <Card className="p-5 mb-5">
            <h2 className="text-sm font-semibold text-[#0f172a] mb-3">Key Strengths</h2>
            <ul className="space-y-2">
              {feedback.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#475569] leading-relaxed">
                  <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </Card>

          {/* Priority Improvements summary */}
          <Card className="p-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#0f172a]">Priority Improvements</h2>
              {highCount > 0 && <span className="text-xs font-medium bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">{highCount} high priority</span>}
            </div>
            <div className="space-y-2">
              {allItems.filter((i) => i.priority === "High").map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-[#f8fafc] rounded-lg border border-[#f1f5f9]">
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded border shrink-0 ${PRIORITY_STYLES[item.priority]}`}>{item.priority}</span>
                  <p className="text-xs text-[#475569] leading-relaxed">{item.suggestion}</p>
                </div>
              ))}
              {allItems.filter((i) => i.priority !== "High").slice(0, 3).map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-[#f8fafc] rounded-lg border border-[#f1f5f9]">
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded border shrink-0 ${PRIORITY_STYLES[item.priority]}`}>{item.priority}</span>
                  <p className="text-xs text-[#475569] leading-relaxed">{item.suggestion}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveTab("sections")} className="text-xs text-[#4f46e5] hover:underline mt-3 block">View detailed feedback →</button>
          </Card>

          <AIDisclaimer />
        </>
      )}

      {activeTab === "sections" && (
        <>
          <AIDisclaimer />

          {/* Section tabs */}
          <div className="flex gap-1 flex-wrap mt-5 mb-4">
            {feedback.sections.map((s, i) => (
              <button key={i} onClick={() => setActiveSection(i)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${activeSection === i ? "bg-[#eef2ff] text-[#4f46e5]" : "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]"}`}>
                {s.icon} {s.title}
              </button>
            ))}
          </div>

          {feedback.sections.map((section, si) =>
            si !== activeSection ? null : (
              <div key={si}>
                <Card className="p-5 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{section.icon}</span>
                    <h2 className="text-sm font-semibold text-[#0f172a]">{section.title}</h2>
                  </div>
                  <p className="text-xs text-[#64748b] mb-4">{section.summary}</p>

                  <div className="space-y-4">
                    {section.items.map((item, ii) => (
                      <div key={ii} className="border border-[#f1f5f9] rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[item.priority]}`}>{item.priority} priority</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {[
                            { label: "Observation", icon: "👁", text: item.observation },
                            { label: "Why it matters", icon: "💡", text: item.why },
                            { label: "Suggested improvement", icon: "✏️", text: item.suggestion },
                          ].map((col) => (
                            <div key={col.label}>
                              <p className="text-xs font-semibold text-[#94a3b8] mb-1.5">{col.icon} {col.label}</p>
                              <p className="text-xs text-[#475569] leading-relaxed">{col.text}</p>
                              {col.label === "Suggested improvement" && (
                                <button onClick={() => copy(col.text, `${si}-${ii}`)} className="text-xs text-[#4f46e5] hover:underline mt-2">
                                  {copied === `${si}-${ii}` ? "✓ Copied" : "Copy suggestion"}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="flex gap-3">
                  {si > 0 && <Btn onClick={() => setActiveSection(si - 1)} variant="secondary" size="sm">← Previous</Btn>}
                  {si < feedback.sections.length - 1 && <Btn onClick={() => setActiveSection(si + 1)} variant="secondary" size="sm">Next section →</Btn>}
                  <div className="flex-1" />
                  <Btn onClick={onUploadNew} variant="secondary" size="sm">Analyse another resume</Btn>
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 5b — Interview generating (questions)
───────────────────────────────────────── */
function InterviewGeneratingScreen({ onDone, onError }: { onDone: () => void; onError: () => void }) {
  useEffect(() => {
  const t = setTimeout(() => {
    onDone();
  }, 900);

  return () => clearTimeout(t);
}, [onDone]);
  return (
    <div className="py-8 px-8 max-w-md mx-auto text-center flex flex-col items-center justify-center min-h-[calc(100vh-56px)]">
      <div className="size-20 rounded-2xl bg-[#eef2ff] flex items-center justify-center mb-8">
        <svg className="w-8 h-8 text-[#4f46e5] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-[#0f172a] mb-3 tracking-tight">Preparing your interview questions…</h1>
      <p className="text-sm text-[#64748b] mb-8 leading-relaxed max-w-xs">Preparing interview questions based on your selected role, interview type and difficulty.</p>
      <div className="flex gap-1.5 justify-center">
        {[0, 1, 2].map((i) => (
          <div key={i} className="size-2 rounded-full bg-[#4f46e5] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
     <AIDisclaimer text="Questions in the current MVP are selected from predefined interview question sets. Live AI-generated questions will be enabled when the external AI service is configured." />
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 7b — Interview feedback generating
───────────────────────────────────────── */
function InterviewFeedbackGeneratingScreen({ onDone, onError }: { onDone: () => void; onError: () => void }) {
  useEffect(() => {
    const willFail = Math.random() < 0.25;
    const delay = 800 + Math.random() * 700;
    const t = setTimeout(() => { willFail ? onError() : onDone(); }, delay);
    return () => clearTimeout(t);
  }, [onDone, onError]);

  return (
    <div className="py-8 px-8 max-w-md mx-auto text-center flex flex-col items-center justify-center min-h-[calc(100vh-56px)]">
      <div className="size-20 rounded-2xl bg-[#eef2ff] flex items-center justify-center mb-8">
        <svg className="w-8 h-8 text-[#4f46e5] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-[#0f172a] mb-3 tracking-tight">Generating your feedback…</h1>
      <p className="text-sm text-[#64748b] mb-8 leading-relaxed max-w-xs">Analysing your response and preparing constructive feedback.</p>
      <div className="flex gap-1.5 justify-center">
        {[0, 1, 2].map((i) => (
          <div key={i} className="size-2 rounded-full bg-[#4f46e5] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <AIDisclaimer text="AI is generating feedback on your response. This may take a moment." />
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 6 — Interview setup
───────────────────────────────────────── */
 function InterviewSetupScreen({ onStart, userName }: { onStart: (config: { role: string; industry: string; type: string; difficulty: string; count: number; useProfile: boolean }) => void; userName: string }) {
  const [role, setRole] = useState("Software Developer");
  const [industry, setIndustry] = useState("Technology");
  const [type, setType] = useState("Behavioural");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [count, setCount] = useState(5);
  const [useProfile, setUseProfile] = useState(false);

  const TYPES = ["Behavioural", "General graduate interview", "Role-specific", "Mixed practice"];
  const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
  const COUNTS = [3, 5, 10];

  return (
    <div className="py-8 px-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-[#0f172a] tracking-tight mb-1">Interview Preparation</h1>
      <p className="text-sm text-[#64748b] mb-7">Practise interview questions relevant to your target role and receive constructive feedback.</p>

      <Card className="p-5 mb-5 space-y-5">
        <label className="block">
          <span className="text-xs font-medium text-[#0f172a] block mb-1.5">Target role</span>
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Software Developer"
            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-[#0f172a] block mb-1.5">Industry</span>
          <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Technology"
            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent" />
        </label>
        <div>
          <span className="text-xs font-medium text-[#0f172a] block mb-2">Interview type</span>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((t) => (
              <button key={t} onClick={() => setType(t)}
                className={`px-3 py-2.5 rounded-lg border text-xs font-medium text-left transition-colors ${type === t ? "bg-[#eef2ff] border-[#a5b4fc] text-[#4f46e5]" : "border-[#e2e8f0] text-[#64748b] hover:border-[#94a3b8]"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-xs font-medium text-[#0f172a] block mb-2">Difficulty</span>
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${difficulty === d ? "bg-[#eef2ff] border-[#a5b4fc] text-[#4f46e5]" : "border-[#e2e8f0] text-[#64748b] hover:border-[#94a3b8]"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-xs font-medium text-[#0f172a] block mb-2">Number of questions</span>
          <div className="flex gap-2">
            {COUNTS.map((c) => (
              <button key={c} onClick={() => setCount(c)}
                className={`size-12 rounded-lg border text-sm font-semibold transition-colors ${count === c ? "bg-[#eef2ff] border-[#a5b4fc] text-[#4f46e5]" : "border-[#e2e8f0] text-[#64748b] hover:border-[#94a3b8]"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setUseProfile(!useProfile)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm transition-colors ${useProfile ? "bg-[#eef2ff] border-[#a5b4fc] text-[#4f46e5]" : "border-[#e2e8f0] text-[#64748b] hover:border-[#94a3b8]"}`}>
          <div className={`size-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${useProfile ? "bg-[#4f46e5] border-[#4f46e5]" : "border-[#cbd5e1]"}`}>
            {useProfile && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
          </div>
          <span className="text-xs">Use my career profile ({userName}, Software Developer)</span>
        </button>
      </Card>

      <p className="text-xs text-[#94a3b8] mb-5">This session does not include video, audio, facial or emotion analysis.</p>

      <Btn
  onClick={() =>
    onStart({ role, industry, type, difficulty, count, useProfile })
  }
  size="lg"
  full
>
  Start Practice →
</Btn>
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 7 — Interview question
───────────────────────────────────────── */
function InterviewQuestionScreen({ qIndex, total, answeredCount, question, onSubmit, onSkip, onEnd }: {
  qIndex: number; total: number; answeredCount: number; question: IQ; onSubmit: (answer: string) => void; onSkip: () => void; onEnd: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [showGuidance, setShowGuidance] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const pct = Math.round((qIndex / total) * 100);

  // Reset collapsibles when question changes
  const q = question;

  return (
    <div className="py-8 px-8 max-w-3xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-[#64748b]">Question {qIndex + 1} of {total}</p>
          <span className="text-xs font-medium text-[#4f46e5]">{pct}% complete</span>
        </div>
        <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
          <div className="h-full bg-[#4f46e5] rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <Card className="p-6 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            q.type === "Behavioural" ? "bg-[#eef2ff] text-[#4f46e5]" :
            q.type === "General Graduate" ? "bg-emerald-50 text-emerald-700" :
            "bg-amber-50 text-amber-700"
          }`}>{q.type}</span>
          <span className="text-[11px] text-[#94a3b8]">{q.difficulty}</span>
        </div>
        <h2 className="text-lg font-semibold text-[#0f172a] leading-relaxed mb-6">"{q.q}"</h2>

        <label className="block mb-4">
          <span className="text-xs font-medium text-[#64748b] block mb-2">Your response</span>
          <textarea
            rows={7}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your response here…"
            className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent resize-none"
          />
        </label>

        {/* Guidance toggle */}
        <button onClick={() => setShowGuidance((v) => !v)} className="text-xs text-[#4f46e5] hover:underline mb-2 block">
          {showGuidance ? "Hide guidance ▲" : "Show guidance ▼"}
        </button>
        {showGuidance && (
          <div className="px-4 py-3 bg-[#eef2ff] rounded-lg text-xs text-[#3730a3] leading-relaxed mb-3">
            💡 {q.guidance}
          </div>
        )}

        {/* Sample answer toggle */}
        <button onClick={() => setShowSample((v) => !v)} className="text-xs text-[#64748b] hover:text-[#0f172a] hover:underline mb-2 block">
          {showSample ? "Hide sample answer ▲" : "View sample answer ▼"}
        </button>
        {showSample && (
          <div className="border border-emerald-200 bg-emerald-50 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-emerald-800 mb-2">Sample answer</p>
            <p className="text-xs text-emerald-900 leading-relaxed">{q.sampleAnswer}</p>
            <p className="text-[11px] text-emerald-700 mt-3 italic">Example only — adapt your answer to reflect your own experience, skills and circumstances.</p>
          </div>
        )}
      </Card>

      <div className="flex items-center gap-3">
        <Btn onClick={() => { if (answer.trim()) { onSubmit(answer); setAnswer(""); } }} disabled={!answer.trim()} size="md">
          Submit Response →
        </Btn>
        <Btn onClick={() => { onSkip(); setAnswer(""); }} variant="secondary" size="md">Skip</Btn>
        <div className="flex-1" />
        <Btn onClick={() => setShowEndModal(true)} variant="ghost" size="sm">End practice</Btn>
      </div>

      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowEndModal(false)} />
          <Card className="relative p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-semibold text-[#0f172a] mb-2">End practice session?</h3>
            <p className="text-sm text-[#64748b] mb-5">
  You have progressed through {qIndex} of {total} questions and submitted {answeredCount} {answeredCount === 1 ? "response" : "responses"}. A session summary will be shown.
</p>
            <div className="flex gap-3">
              <Btn onClick={() => setShowEndModal(false)} variant="secondary" size="sm" full>Continue</Btn>
              <Btn onClick={onEnd} size="sm" full>End session</Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 8 — Interview feedback
───────────────────────────────────────── */
function InterviewFeedbackScreen({ qIndex, total, question, answer, onNext, onRetry, onEnd }: {
  qIndex: number; total: number; question: IQ; answer: string; onNext: () => void; onRetry: () => void; onEnd: () => void;
}) {
  const q = question;
  const fb = getFeedbackForQuestion(q, qIndex);
  const isLast = qIndex === total - 1;

  return (
    <div className="py-8 px-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-xs text-[#64748b] mb-1">Question {qIndex + 1} of {total} — Feedback</p>
<h1 className="text-xl font-semibold text-[#0f172a] tracking-tight">Answer guidance</h1>
<p className="text-xs text-[#64748b] mt-2">
  General practice guidance is shown in the current MVP. Your response has not been analysed by AI.
</p>
      </div>

      {/* Question recap */}
      <Card className="p-4 mb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-xs text-[#94a3b8]">Your question</p>
          <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
            q.type === "Behavioural" ? "bg-[#eef2ff] text-[#4f46e5]" :
            q.type === "General Graduate" ? "bg-emerald-50 text-emerald-700" :
            "bg-amber-50 text-amber-700"
          }`}>{q.type}</span>
        </div>
        <p className="text-sm text-[#475569] italic">"{q.q}"</p>
      </Card>

      {/* Your response */}
      <Card className="p-4 mb-5">
        <p className="text-xs text-[#94a3b8] mb-1">Your response</p>
        <p className="text-sm text-[#475569] leading-relaxed">{answer || "No response provided."}</p>
      </Card>

     {/* General practice guidance */}
      <div className="space-y-4 mb-6">
        {[
          { icon: "✓", label: "What worked well", color: "emerald", text: fb.strength },
          { icon: "△", label: "What could be improved", color: "amber", text: fb.improvement },
          { icon: "✏", label: "Suggested approach", color: "indigo", text: fb.suggestion },
          { icon: "⊞", label: "Response structure", color: "slate", text: fb.structure },
          { icon: "◉", label: "Clarity and relevance", color: "slate", text: fb.clarity },
        ].map((item) => {
          const bg = item.color === "emerald" ? "bg-emerald-50 border-emerald-200" : item.color === "amber" ? "bg-amber-50 border-amber-200" : item.color === "indigo" ? "bg-[#eef2ff] border-[#a5b4fc]" : "bg-[#f8fafc] border-[#e2e8f0]";
          const txt = item.color === "emerald" ? "text-emerald-800" : item.color === "amber" ? "text-amber-800" : item.color === "indigo" ? "text-[#3730a3]" : "text-[#475569]";
          const lbl = item.color === "emerald" ? "text-emerald-700" : item.color === "amber" ? "text-amber-700" : item.color === "indigo" ? "text-[#4f46e5]" : "text-[#64748b]";
          return (
            <Card key={item.label} className={`p-4 ${bg}`}>
              <p className={`text-xs font-semibold uppercase tracking-widest mb-1.5 ${lbl}`}>{item.icon} {item.label}</p>
              <p className={`text-sm leading-relaxed ${txt}`}>{item.text}</p>
            </Card>
          );
        })}
      </div>

<AIDisclaimer text="This is general practice guidance from predefined examples and does not analyse your submitted response. It does not assess personality, accent, ethnicity or predict interview success." />

      <div className="flex items-center gap-3 mt-5">
        {isLast
          ? <Btn onClick={onEnd} size="md">View session summary →</Btn>
          : <Btn onClick={onNext} size="md">Next question →</Btn>
        }
        <Btn onClick={onRetry} variant="secondary" size="md">Try again</Btn>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 9 — Interview summary
───────────────────────────────────────── */
function InterviewSummaryScreen({ total, completed, onPracticeAgain, onDashboard }: {
  total: number; completed: number; onPracticeAgain: () => void; onDashboard: () => void;
}) {
  return (
    <div className="py-8 px-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="size-16 rounded-2xl bg-[#eef2ff] flex items-center justify-center text-3xl mx-auto mb-5">🎙</div>
        <p className="text-xs font-semibold text-[#4f46e5] uppercase tracking-widest mb-2">Practice Complete</p>
        <h1 className="text-2xl font-semibold text-[#0f172a] tracking-tight mb-2">Session complete</h1>
        <p className="text-sm text-[#64748b]">You answered {completed} of {total} questions in this session.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-7">
        {[["Questions", completed.toString()], ["Session", "Complete"], ["Progress", `${Math.round((completed/total)*100)}%`]].map(([l, v]) => (
          <Card key={l} className="p-4 text-center">
            <p className="text-xl font-bold text-[#4f46e5] mb-0.5">{v}</p>
            <p className="text-xs text-[#64748b]">{l}</p>
          </Card>
        ))}
      </div>

      {completed > 0 && (
      <Card className="p-5 mb-4">
<h3 className="text-sm font-semibold text-[#0f172a] mb-3">Practice strengths to develop</h3>
        <ul className="space-y-2">
          {["Providing context and background for your examples", "Professional and clear communication style", "Demonstrating genuine understanding of the role"].map((s) => (
            <li key={s} className="flex items-start gap-2 text-xs text-[#475569]">
              <span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>
              {s}
            </li>
          ))}
        </ul>
      </Card>
      )}

      {completed > 0 && (
      <Card className="p-5 mb-4">
<h3 className="text-sm font-semibold text-[#0f172a] mb-3">Areas to focus on</h3>
        <ul className="space-y-2">
          {["Describing outcomes and results more explicitly", "Using 'I' to highlight your individual contribution", "Keeping responses concise and well-structured"].map((a) => (
            <li key={a} className="flex items-start gap-2 text-xs text-[#475569]">
              <span className="text-amber-400 flex-shrink-0 mt-0.5">△</span>
              {a}
            </li>
          ))}
        </ul>
      </Card>
      )}

      {completed === 0 && (
        <Card className="p-5 mb-5 border-[#e2e8f0]">
<p className="text-sm text-[#64748b] leading-relaxed">
  No responses were submitted in this session. Complete at least one question to receive personalised feedback when the AI feedback service is available.
</p>
        </Card>
      )}

      {completed > 0 && (
      <Card className="p-5 mb-5">
        <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Suggested next steps</h3>
        <ul className="space-y-2">
          {["Review the practice guidance and identify areas you want to improve", "Practise your STAR technique with different examples", "Upload your resume to align feedback with your application materials", "Consult your university career service for personalised support"].map((s) => (
            <li key={s} className="flex items-start gap-2 text-xs text-[#475569]">
              <span className="text-[#a5b4fc] flex-shrink-0 mt-0.5">→</span>
              {s}
            </li>
          ))}
        </ul>
      </Card>
      )}
<AIDisclaimer
  text={
    completed === 0
      ? "No personalised AI feedback was generated because no responses were submitted. Complete at least one interview question to receive feedback when the AI service is available."
      : "The current MVP displays general interview practice guidance. Personalised AI analysis of your responses will be provided when the external AI service is configured. This platform does not predict interview success or guarantee employment outcomes."
  }
/>
   

      <div className="flex gap-3 mt-5">
        <Btn onClick={onPracticeAgain} size="md">Practice again</Btn>
        <Btn onClick={onDashboard} variant="secondary" size="md">Return to Dashboard</Btn>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 10 — Progress
───────────────────────────────────────── */
function ProgressScreen({ userId }: { userId: number }) {
  const [tab, setTab] = useState<"resume" | "interview">("resume");
  const [activity, setActivity] = useState<ActivityState>(EMPTY_ACTIVITY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProgress = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:8000/api/user-progress.php?user_id=${userId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to retrieve progress information."
          );
        }

        setActivity({
          resumeReviews: data.resumeReviews ?? [],
          interviewSessions: data.interviewSessions ?? [],
          currentInterviewAnswered: 0,
          currentInterviewTotal: 0,
        });
      } catch (err) {
        console.error("Unable to load progress:", err);
        setError("Unable to load your progress. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [userId]);

  const resumeProgress = activity.resumeReviews.length > 0 ? 100 : 0;

  const answeredInterviewQuestions = activity.interviewSessions.reduce(
    (total, session) => total + session.questionsAnswered,
    0
  );

  const totalInterviewQuestions = activity.interviewSessions.reduce(
    (total, session) => total + session.total,
    0
  );

  const interviewProgress =
    totalInterviewQuestions > 0
      ? Math.round(
          (answeredInterviewQuestions / totalInterviewQuestions) * 100
        )
      : 0;

  return (
    <div className="py-8 px-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-[#0f172a] tracking-tight mb-1">My Progress</h1>
      <p className="text-sm text-[#64748b] mb-7">A summary of your career preparation activity.</p>
{loading && (
  <Card className="p-4 mb-5">
    <p className="text-sm text-[#64748b]">
      Loading your progress...
    </p>
  </Card>
)}

{error && (
  <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
    <p className="text-sm text-red-700">
      {error}
    </p>
  </div>
)}
      <div className="flex gap-2 mb-5">
        {(["resume", "interview"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? "bg-[#4f46e5] text-white" : "bg-white border border-[#e2e8f0] text-[#64748b] hover:border-[#94a3b8]"}`}>
            {t === "resume" ? "Resume Activity" : "Interview Practice"}
          </button>
        ))}
      </div>

      {tab === "resume" && (
        <div>
          <Card className="overflow-hidden mb-4">
            <div className="px-5 py-3 border-b border-[#f8fafc] bg-[#f8fafc]">
              <div className="grid grid-cols-4 gap-4 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                <span>Date</span><span>Target role</span><span>Input</span><span>Status</span>
              </div>
            </div>
            {activity.resumeReviews.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-sm text-[#94a3b8]">No resume reviews yet.</p>
              </div>
            ) : activity.resumeReviews.map((r, i) => (
              <div key={i} className="px-5 py-3.5 border-b border-[#f8fafc] last:border-0">
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <span className="text-[#64748b] text-xs">{r.date}</span>
                  <span className="text-[#0f172a] text-xs font-medium">{r.role}</span>
                  <span className="text-[#64748b] text-xs">{r.file}</span>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full w-fit">Submitted</span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === "interview" && (
        <div>
          <Card className="overflow-hidden mb-4">
            <div className="px-5 py-3 border-b border-[#f8fafc] bg-[#f8fafc]">
              <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                <span>Date</span><span>Role</span><span>Questions answered</span>
              </div>
            </div>
            {activity.interviewSessions.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-sm text-[#94a3b8]">No interview sessions yet.</p>
              </div>
            ) : activity.interviewSessions.map((r, i) => (
              <div key={i} className="px-5 py-3.5 border-b border-[#f8fafc] last:border-0">
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-[#64748b] text-xs">{r.date}</span>
                  <span className="text-[#0f172a] text-xs font-medium">{r.role}</span>
                  <span className="text-[#64748b] text-xs">{r.questionsAnswered} of {r.total}</span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      <Card className="p-5">
    <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Platform activity</h3>
        <div className="space-y-3">
          <Progress value={resumeProgress} label="Resume submission activity" />
<Progress value={interviewProgress} label="Interview question completion" />
        </div>
        <p className="text-xs text-[#94a3b8] mt-4">Progress indicators reflect activity within this platform only. They do not measure actual job readiness or predict employment outcomes.</p>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────
   Job Match Analysis Engine
───────────────────────────────────────── */
interface JobMatchResult {
  targetRole: string;
  company: string;
  matchPercent: number;
  strengths: string[];
  missing: string[];
  keywords: string[];
  improvements: string[];
}

/* ─────────────────────────────────────────
   SCREEN 11a — Job Match Input
───────────────────────────────────────── */
interface StoredResume {
  resume_id: number;
  input_method: string;
  file_name: string | null;
  target_role: string;
  uploaded_at: string;
}

function JobMatchInputScreen({
  userId,
  onAnalyse,
}: {
  userId: number;
  onAnalyse: (jobText: string, jobUrl: string, resumeId: number) => void;
}) {
  const [inputMode, setInputMode] = useState<"paste" | "url">("paste");
  const [jobText, setJobText] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [resumes, setResumes] = useState<StoredResume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadResumes = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/user-resumes.php?user_id=${userId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to retrieve resumes.");
        }

        setResumes(data.resumes ?? []);
      } catch (err) {
        console.error("Unable to load resumes:", err);
        setError("Unable to load your saved resumes. Please try again.");
      } finally {
        setLoadingResumes(false);
      }
    };

    loadResumes();
  }, [userId]);

 const hasJobText = jobText.trim().length > 20;
const hasResume = selectedResumeId !== null;
const canAnalyse = hasJobText && hasResume;

const handleAnalyse = () => {
  setError("");

  if (!hasJobText) {
    setError(
      "Please paste the full job advertisement text before starting the analysis."
    );
    return;
  }

  if (!selectedResumeId) {
    setError("Please select one of your saved resumes to compare.");
    return;
  }

  onAnalyse(
    jobText.trim(),
    jobUrl.trim(),
    selectedResumeId
  );
};

  

  return (
    <div className="py-8 px-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-[#0f172a] tracking-tight mb-1">Match Your Resume to a Job</h1>
      <p className="text-sm text-[#64748b] mb-7">Add a job advertisement to compare its requirements with your resume.</p>

      {/* Step 1 — Job advertisement */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="size-5 rounded-full bg-[#4f46e5] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
          <p className="text-sm font-semibold text-[#0f172a]">Job Advertisement</p>
        </div>

        {/* Input mode toggle */}
        <div className="flex gap-1 mb-4 bg-[#f8fafc] p-1 rounded-lg w-fit">
          {(["paste", "url"] as const).map((m) => (
            <button key={m} onClick={() => setInputMode(m)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${inputMode === m ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b] hover:text-[#0f172a]"}`}>
              {m === "paste" ? "Paste Job Advertisement" : "Job Advertisement Link"}
            </button>
          ))}
        </div>

        {inputMode === "paste" ? (
          <Card className="p-4 mb-3">
            <textarea
              rows={9}
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Paste the job title, responsibilities and requirements here..."
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-xs text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent resize-none leading-relaxed"
            />
            <p className="text-xs text-[#94a3b8] mt-2">
              {jobText.trim().length > 0 ? `${jobText.trim().split(/\s+/).length} words` : "Paste the full job advertisement for best results"}
            </p>
          </Card>
        ) : (
          <Card className="p-4 mb-3">
            <label className="block mb-3">
              <span className="text-xs font-medium text-[#0f172a] block mb-1.5">Job advertisement URL</span>
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="Paste a job advertisement link here..."
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </label>
            <div className="flex items-start gap-2 px-3 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
              <span className="text-[#94a3b8] text-xs mt-0.5 flex-shrink-0">ℹ</span>
              <p className="text-xs text-[#64748b] leading-relaxed">
                This platform does not automatically retrieve job advertisement content. Paste the URL for your reference, then switch to "Paste Job Advertisement" to add the full advertisement text for the most accurate analysis.
              </p>
            </div>
          </Card>
        )}

        {/* Find jobs on SEEK */}
        <a
          href="https://www.seek.com.au"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#4f46e5] hover:text-[#4338ca] hover:underline transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Find Jobs on SEEK (external website)
        </a>
      </div>

      {/* Step 2 — Resume selection */}
<div className="mb-6">
  <div className="flex items-center gap-2 mb-3">
    <span className="size-5 rounded-full bg-[#4f46e5] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
      2
    </span>
    <p className="text-sm font-semibold text-[#0f172a]">
      Select Your Resume
    </p>
  </div>

  {loadingResumes ? (
    <Card className="p-4">
      <p className="text-sm text-[#64748b]">
        Loading your saved resumes...
      </p>
    </Card>
  ) : resumes.length === 0 ? (
    <Card className="p-4">
      <p className="text-sm font-medium text-[#0f172a] mb-1">
        No saved resumes found
      </p>
      <p className="text-xs text-[#64748b]">
        Submit a resume through Resume Feedback before using Job Advertisement Matching.
      </p>
    </Card>
  ) : (
    <div className="space-y-2">
      {resumes.map((resume) => (
        <button
          key={resume.resume_id}
          type="button"
          onClick={() => setSelectedResumeId(resume.resume_id)}
          className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
            selectedResumeId === resume.resume_id
              ? "bg-[#eef2ff] border-[#a5b4fc]"
              : "bg-white border-[#e2e8f0] hover:border-[#94a3b8]"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[#0f172a]">
                {resume.target_role}
              </p>
              <p className="text-xs text-[#64748b] mt-1">
                {resume.file_name ?? "Pasted resume"}
              </p>
            </div>

            {selectedResumeId === resume.resume_id && (
              <span className="text-xs font-semibold text-[#4f46e5]">
                ✓ Selected
              </span>
            )}
          </div>

          <p className="text-xs text-[#94a3b8] mt-2">
            Added {new Date(resume.uploaded_at.replace(" ", "T")).toLocaleDateString("en-AU")}
          </p>
        </button>
      ))}
    </div>
  )}
</div>

      {error && (
        <div className="mt-4 flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-red-500 flex-shrink-0 text-xs mt-0.5">✕</span>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <div className="mt-5">
        <Btn onClick={handleAnalyse} size="lg" full disabled={!canAnalyse}>
          {canAnalyse ? "Analyse Job Match →" : "Add a job advertisement and select a resume to continue"}
        </Btn>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 11b — Job Match Analysing
───────────────────────────────────────── */
function JobMatchAnalysingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const STEPS = ["Reading job advertisement…", "Identifying role requirements…", "Comparing with your resume…", "Calculating skill alignment…", "Generating recommendations…", "Analysis complete"];
  const [step, setStep] = useState(0);
  useEffect(() => {
  const iv = setInterval(() => {
    setProgress((p) => {
      const next = p + 2;

      if (next >= 100) {
        clearInterval(iv);
        setTimeout(onDone, 300);
        return 100;
      }

      return next;
    });
  }, 60);

  const sv = setInterval(() => {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, 650);

  return () => {
    clearInterval(iv);
    clearInterval(sv);
  };
}, [onDone]);

  return (
    <div className="py-8 px-8 max-w-md mx-auto text-center flex flex-col items-center justify-center min-h-[calc(100vh-56px)]">
      <div className="size-20 rounded-2xl bg-[#eef2ff] flex items-center justify-center text-4xl mb-8">🎯</div>
      <h1 className="text-xl font-semibold text-[#0f172a] mb-3 tracking-tight">Analysing your resume against the job requirements…</h1>
      <p className="text-sm text-[#64748b] mb-10 leading-relaxed max-w-xs">Please wait while we compare your resume with the advertised role requirements.</p>
      <div className="w-full bg-[#f1f5f9] rounded-full h-2 mb-4 overflow-hidden">
        <div className="h-2 rounded-full bg-[#4f46e5] transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs text-[#64748b] h-4">{STEPS[step]}</p>
      <p className="text-xs text-[#94a3b8] mt-1">{Math.round(progress)}%</p>
      <AIDisclaimer text="Preparing the job match request. AI-generated results will only be displayed when the external AI service successfully completes the analysis." />
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 11c — Job Match Results
───────────────────────────────────────── */
function JobMatchResultsScreen({
  result, onImproveResume, onPracticeInterview, onAnalyseAnother,
}: {
  result: JobMatchResult;
  onImproveResume: (role: string) => void;
  onPracticeInterview: (role: string) => void;
  onAnalyseAnother: () => void;
}) {
  const pct = result.matchPercent;
  const pctColor = pct >= 70 ? "text-emerald-700" : pct >= 50 ? "text-amber-600" : "text-red-600";
  const pctRingColor = pct >= 70 ? "#059669" : pct >= 50 ? "#d97706" : "#dc2626";
  const circumference = 2 * Math.PI * 36;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="py-8 px-8 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-[#64748b] mb-1">Job Advertisement Matching</p>
          <h1 className="text-2xl font-semibold text-[#0f172a] tracking-tight">Job Match Analysis</h1>
        </div>
        <Btn onClick={onAnalyseAnother} variant="secondary" size="sm">Analyse Another Job</Btn>
      </div>

      {/* Role & Company header */}
      <Card className="p-5 mb-5 border-[#a5b4fc]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-widest">Target Role</p>
            </div>
            <p className="text-lg font-semibold text-[#0f172a]">{result.targetRole}</p>
            <p className="text-sm text-[#64748b] mt-0.5">{result.company}</p>
          </div>
          {/* Match ring */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="relative">
              <svg width="88" height="88" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r="36" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                <circle cx="44" cy="44" r="36" fill="none" stroke={pctRingColor} strokeWidth="8"
                  strokeDasharray={circumference} strokeDashoffset={dashOffset}
                  strokeLinecap="round" transform="rotate(-90 44 44)" style={{ transition: "stroke-dashoffset 1s ease" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-lg font-bold leading-none ${pctColor}`}>{pct}%</span>
                <span className="text-[9px] text-[#94a3b8] leading-none mt-0.5">match</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-[#0f172a] mt-1">Job Match Score</p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 px-3 py-2 bg-[#fffbeb] border border-amber-200 rounded-lg">
          <span className="text-amber-500 flex-shrink-0 text-xs mt-0.5">⚠</span>
          <p className="text-xs text-amber-800 leading-relaxed">
            This is an indicative AI-generated assessment based on keyword and content comparison only. It does not predict recruitment or employment outcomes and does not guarantee interview selection.
          </p>
        </div>
      </Card>

      {/* Strengths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-[#0f172a] mb-3 flex items-center gap-2">
            <span className="text-emerald-500">✓</span> Matching Strengths
          </h2>
          <ul className="space-y-2">
            {result.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#475569] leading-relaxed">
                <span className="text-emerald-400 flex-shrink-0 mt-0.5">•</span>
                {s}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-[#0f172a] mb-3 flex items-center gap-2">
            <span className="text-amber-500">△</span> Missing or Weak Areas
          </h2>
          <ul className="space-y-2">
            {result.missing.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#475569] leading-relaxed">
                <span className="text-amber-400 flex-shrink-0 mt-0.5">•</span>
                {m}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Keywords */}
      <Card className="p-5 mb-5">
        <h2 className="text-sm font-semibold text-[#0f172a] mb-3">Important Keywords</h2>
        <p className="text-xs text-[#64748b] mb-3">Consider including these terms in your resume where your experience genuinely supports them.</p>
        <div className="flex flex-wrap gap-2">
          {result.keywords.map((kw) => (
            <span key={kw} className="text-xs font-medium bg-[#eef2ff] text-[#4f46e5] border border-[#c7d2fe] px-3 py-1 rounded-full">{kw}</span>
          ))}
        </div>
      </Card>

      {/* Improvements */}
      <Card className="p-5 mb-5">
        <h2 className="text-sm font-semibold text-[#0f172a] mb-3 flex items-center gap-2">
          <span className="text-[#4f46e5]">✏</span> Suggested Resume Improvements
        </h2>
        <ul className="space-y-2.5">
          {result.improvements.map((imp, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-[#475569] leading-relaxed">
              <span className="text-[#a5b4fc] flex-shrink-0 mt-0.5">→</span>
              {imp}
            </li>
          ))}
        </ul>
      </Card>

      {/* Responsible AI notice */}
      <div className="flex items-start gap-2.5 px-4 py-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl mb-6">
        <span className="text-[#94a3b8] flex-shrink-0 mt-0.5 text-sm">⚖</span>
        <p className="text-xs text-[#64748b] leading-relaxed">
          <strong className="text-[#0f172a]">Responsible AI Notice:</strong> AI-generated job matching is provided as career preparation guidance only. Match results may be incomplete or inaccurate and do not predict recruitment or employment outcomes. Review the original job advertisement carefully before making application decisions.
        </p>
      </div>

      {/* Bottom CTAs */}
      <Card className="p-5">
        <p className="text-sm font-semibold text-[#0f172a] mb-1">Continue your career preparation</p>
        <p className="text-xs text-[#64748b] mb-4">Use these results to strengthen your resume and practise for the interview.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Btn onClick={() => onImproveResume(result.targetRole)} size="sm" full>
            Improve Resume for This Role →
          </Btn>
          <Btn onClick={() => onPracticeInterview(result.targetRole)} variant="secondary" size="sm" full>
            Practise Interview for This Role →
          </Btn>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 11 — Responsible AI & Privacy
───────────────────────────────────────── */
function ResponsibleAIScreen() {
  const [open, setOpen] = useState<number | null>(null);

  const PRINCIPLES = [
    { icon: "⚖️", title: "Fairness", desc: "Feedback is designed to focus on the content and structure of career preparation materials — not personal characteristics such as name, background, ethnicity, accent or nationality. The platform does not assess personality or predicted employability." },
    { icon: "🔍", title: "Transparency", desc: "AI-generated recommendations are clearly identified throughout the platform. Users are informed when content is AI-generated, and are encouraged to review it critically before acting on it." },
    { icon: "🔒", title: "Privacy", desc: "The platform minimises unnecessary collection of personal information. Only information needed to personalise career preparation support is requested. Sensitive attributes such as visa status, ethnicity, religion and health information are not collected." },
    { icon: "👤", title: "Human Oversight", desc: "AI feedback is a support tool, not a replacement for professional career advice. Users are encouraged to consult their university career service and professional advisers for important decisions." },
  ];

  const FAQS = [
    { q: "How is AI used on this platform?", a: "The MVP is designed to use generative AI for resume feedback, interview preparation and job advertisement comparison. AI-dependent results are only displayed when the AI service successfully returns a result. If the service is unavailable, the platform displays an error rather than fabricating feedback." },
    { q: "What are the limitations of AI-generated feedback?", a: "AI can produce inaccurate, incomplete or inappropriate recommendations. Users should verify important career information independently. The platform does not guarantee employment outcomes." },
    { q: "What information is collected?", a: "The MVP stores account information such as your email address, together with career preparation data you submit, including resume content, target roles, interview session details and responses, and job advertisement text used for comparison. Users should avoid entering unnecessary sensitive personal information." },
    { q: "What frameworks guide this platform?", a: "The platform is informed by the NIST AI Risk Management Framework, the Australian Privacy Principles, and the Australian AI Ethics Principles. These frameworks support trustworthy, fair and accountable AI design." },
  ];

  return (
    <div className="py-8 px-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-[#0f172a] tracking-tight mb-1">Responsible AI & Privacy</h1>
      <p className="text-sm text-[#64748b] mb-8">How this platform uses AI responsibly to support international students.</p>

      {/* Principles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {PRINCIPLES.map((p) => (
          <Card key={p.title} className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{p.icon}</span>
              <h3 className="text-sm font-semibold text-[#0f172a]">{p.title}</h3>
            </div>
            <p className="text-xs text-[#64748b] leading-relaxed">{p.desc}</p>
          </Card>
        ))}
      </div>

      {/* How AI is used */}
      <Card className="p-5 mb-5">
        <h3 className="text-sm font-semibold text-[#0f172a] mb-3">How AI is used</h3>
        <p className="text-xs text-[#64748b] leading-relaxed mb-3">
  The MVP is designed to use generative AI to support the following career preparation functions:
</p>
        <ul className="space-y-2">
{[
  "Analysing resume content against Australian graduate employment expectations",
  "Supporting interview preparation with role-relevant questions and feedback",
  "Comparing submitted resume information with job advertisement content",
  "Providing career preparation guidance rather than recruitment or employment decisions"
].map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs text-[#475569]">
              <span className="text-[#a5b4fc] mt-0.5 flex-shrink-0">→</span>
              {item}
            </li>
          ))}
        </ul>
      </Card>

      {/* Limitations */}
      <Card className="p-5 mb-5 border-amber-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-amber-500">⚠</span>
          <h3 className="text-sm font-semibold text-[#0f172a]">Limitations</h3>
        </div>
        <ul className="space-y-2">
          {[
            "AI can produce inaccurate, incomplete or inappropriate recommendations.",
            "AI-dependent feedback is not generated when the AI service is unavailable; the platform displays an error rather than creating a fabricated result.",
            "Users should verify important career information independently.",
            "The platform does not guarantee employment outcomes.",
            "Users should seek professional career advice from their university career service when appropriate.",
            "AI feedback should not be used as the sole basis for important career decisions.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs text-[#92400e]">
              <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
              {item}
            </li>
          ))}
        </ul>
      </Card>

      {/* FAQ */}
      <Card className="p-5 mb-5">
        <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Frequently asked questions</h3>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="border border-[#f1f5f9] rounded-lg overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#f8fafc] transition-colors">
                <span className="text-xs font-medium text-[#0f172a]">{faq.q}</span>
                <span className={`text-[#94a3b8] transition-transform text-xs ${open === i ? "rotate-180" : ""}`}>▾</span>
              </button>
              {open === i && (
                <div className="px-4 pb-4 pt-0">
                  <p className="text-xs text-[#64748b] leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-5 text-center">
        <p className="text-xs text-[#64748b] leading-relaxed">
          Informed by the <strong className="text-[#0f172a]">NIST AI Risk Management Framework</strong>, <strong className="text-[#0f172a]">Australian Privacy Principles</strong>, and <strong className="text-[#0f172a]">Australian AI Ethics Principles</strong>.
          <br />This platform provides career preparation support and does not guarantee employment outcomes. It does not replace professional career advice.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Activity state types
───────────────────────────────────────── */
interface ResumeHistoryEntry {
  resume_id: number;
  date: string;
  role: string;
  file: string;
  input_method: string;
}

interface InterviewHistoryEntry {
  session_id: number;
  date: string;
  role: string;
  questionsAnswered: number;
  total: number;
  status: string;
  completed_at: string | null;
}
interface ActivityState {
  resumeReviews: ResumeHistoryEntry[];
  interviewSessions: InterviewHistoryEntry[];
  currentInterviewAnswered: number;
  currentInterviewTotal: number;
}
const EMPTY_ACTIVITY: ActivityState = {
  resumeReviews: [],
  interviewSessions: [],
  currentInterviewAnswered: 0,
  currentInterviewTotal: 0,
};

/* ─────────────────────────────────────────
   Root App
───────────────────────────────────────── */
export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [activeNav, setActiveNav] = useState<NavItem>("dashboard");
const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState("Mei");
  const [userEmail, setUserEmail] = useState("mei.zhang@student.edu.au");
  const [interviewConfig, setInterviewConfig] = useState({ role: "Software Developer", industry: "Technology", type: "Behavioural", difficulty: "Intermediate", count: 5 });
  const [sessionQuestions, setSessionQuestions] = useState<IQ[]>([]);
  const [interviewSessionId, setInterviewSessionId] = useState<number | null>(null);
const [questionIds, setQuestionIds] = useState<number[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [completedQs, setCompletedQs] = useState(0);
  const [resumeFeedback, setResumeFeedback] = useState<ResumeFeedback | null>(null);
  const [activity, setActivity] = useState<ActivityState>(EMPTY_ACTIVITY);
  const [jobMatchResult, setJobMatchResult] = useState<JobMatchResult | null>(null);
 const [pendingJobMatch, setPendingJobMatch] = useState<{
  
  jobText: string;
  jobUrl: string;
  resumeId: number;
  jobAdId?: number;
} | null>(null); 
useEffect(() => {
  if (!userId) {
    setActivity(EMPTY_ACTIVITY);
    return;
  }

  const loadPersistedActivity = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/user-progress.php?user_id=${userId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to retrieve progress information."
        );
      }

      setActivity({
        resumeReviews: data.resumeReviews ?? [],
        interviewSessions: data.interviewSessions ?? [],
        currentInterviewAnswered: 0,
        currentInterviewTotal: 0,
      });
    } catch (error) {
      console.error("Unable to load dashboard activity:", error);
    }
  };

  loadPersistedActivity();
}, [userId]);

const resetActivity = () => {
  setActivity(EMPTY_ACTIVITY);
  setResumeFeedback(null);
  setJobMatchResult(null);
  setPendingJobMatch(null);
  setSessionQuestions([]);
  setQIndex(0);
  setCompletedQs(0);
  setCurrentAnswer("");
};

  const go = (s: Screen) => { setScreen(s); window.scrollTo(0, 0); };
const completeInterviewSession = async (
  sessionStatus: "completed" | "ended_early" = "completed"
) => {
  
  if (!interviewSessionId) {
    console.error("No active interview session ID found.");
    go("interview-summary");
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:8000/api/interview-complete.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  session_id: interviewSessionId,
  session_status: sessionStatus,
}),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        data.message || "Unable to complete interview session."
      );

      // The student can still view the local summary.
      go("interview-summary");
      return;
    }

    console.log("Interview session completed:", data.session_id);

    go("interview-summary");
  } catch (error) {
    console.error("Interview completion request failed:", error);

    // Do not block the student from viewing their summary.
    go("interview-summary");
  }
};
  const handleNav = (n: NavItem) => {
    setActiveNav(n);
    if (n === "resume") go("resume-upload");
    else if (n === "interview") go("interview-setup");
    else if (n === "job-matching") go("job-match-input");
    else if (n === "progress") go("progress");
    else if (n === "responsible-ai") go("responsible-ai");
    else go("dashboard");
  };

  const isAppScreen = screen !== "landing" && screen !== "auth" && screen !== "onboarding";

  // Keep nav in sync
  useEffect(() => {
    if (screen === "dashboard") setActiveNav("dashboard");
    else if (["resume-upload", "resume-analysing", "resume-results", "resume-error"].includes(screen)) setActiveNav("resume");
    else if (["interview-setup", "interview-generating", "interview-error", "interview-question", "interview-feedback-generating", "interview-feedback", "interview-feedback-error", "interview-summary"].includes(screen)) setActiveNav("interview");
    else if (["job-match-input", "job-match-analysing", "job-match-results", "job-match-error"].includes(screen)) setActiveNav("job-matching");
    else if (screen === "progress") setActiveNav("progress");
    else if (screen === "responsible-ai") setActiveNav("responsible-ai");
  }, [screen]);

  return (
    <div className="font-sans bg-[#f8fafc] min-h-screen">
      {/* Landing / Auth / Onboarding — no sidebar */}
      {screen === "landing" && <LandingScreen onStart={() => go("auth")} onLearn={() => go("auth")} />}
      {screen === "auth" && (
       <AuthScreen
  onSuccess={(id, name, email, isNew) => {
    resetActivity();
    setUserId(id);
    setUserName(name);
    setUserEmail(email);
    go(isNew ? "onboarding" : "dashboard");
  }}
/>
      )}
      {screen === "onboarding" && <OnboardingScreen onDone={(name) => { setUserName(name); go("dashboard"); }} />}

      {/* App screens with sidebar */}
      {isAppScreen && (
        <div className="flex min-h-screen">
          <Sidebar
            active={activeNav}
            onNav={handleNav}
            userId={userId!}
            userName={userName}
            userEmail={userEmail}
           onLogout={() => {
  resetActivity();
  setUserId(null);
  setUserName("Mei");
  setUserEmail("mei.zhang@student.edu.au");
  go("landing");
}}
            onUpdateUser={(name, email) => { setUserName(name); setUserEmail(email); }}
          />
          <main className="flex-1 overflow-auto">
            {screen === "dashboard" && (
              <DashboardScreen
                userName={userName}
                activity={activity}
                onResume={() => { setActiveNav("resume"); go("resume-upload"); }}
                onInterview={() => { setActiveNav("interview"); go("interview-setup"); }}
                onJobMatch={() => { setActiveNav("job-matching"); go("job-match-input"); }}
              />
            )}
            {screen === "resume-upload" && (
              <ResumeUploadScreen onAnalyse={async (content, role, fileName) => {
  if (!userId) {
  console.error("No logged-in user ID is available.");
  go("resume-error");
  return;
}

// Show the real analysing state immediately while the API request runs.
setResumeFeedback(null);
go("resume-analysing");

try {
    const response = await fetch("http://localhost:8000/api/resume.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
     body: JSON.stringify({
  user_id: userId,
  resume_text: content,
  target_role: role,
  input_method: fileName === "Pasted resume text" ? "paste" : "upload",
  file_name: fileName === "Pasted resume text" ? null : fileName,
}),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data.message || "Unable to submit resume.");
      go("resume-error");
      return;
    }

    console.log("Resume stored successfully:", data.resume_id);

    const feedbackResponse = await fetch("http://localhost:8000/api/resume-feedback.php", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    resume_id: data.resume_id,
  }),
});

const feedbackData = await feedbackResponse.json();

if (!feedbackResponse.ok) {
  console.error(
    feedbackData.code || "AI_FEEDBACK_ERROR",
    feedbackData.message || "Unable to generate resume feedback."
  );
  go("resume-error");
  return;
}

const realFeedback = mapAIResumeFeedback(
  feedbackData,
  fileName
);

setResumeFeedback(realFeedback);

console.log("Real AI resume feedback received:", feedbackData);

const today = new Date().toLocaleDateString("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

setActivity((prev) => ({
  ...prev,
  resumeReviews: [
    {
      resume_id: Number(data.resume_id),
      date: today,
      role: realFeedback.targetRole,
      file: realFeedback.resumeLabel,
      input_method: fileName ? "upload" : "paste",
    },
    ...prev.resumeReviews,
  ],
}));

go("resume-results");

} catch (error) {
  console.error("Resume submission failed:", error);
  go("resume-error");
}
}} />
)}

{screen === "resume-analysing" && (
  <ResumeAnalysingScreen />
)}

{screen === "resume-error" && (
  <AIErrorScreen
    context="AI-generated resume feedback"
    onRetry={() => go("resume-upload")}
    onBack={() => go("resume-upload")}
  />
)}

{screen === "resume-results" && resumeFeedback && (
  <ResumeResultsScreen
    onBack={() => go("dashboard")}
    onUploadNew={() => go("resume-upload")}
    feedback={resumeFeedback}
  />
)}

{screen === "resume-results" && !resumeFeedback && (
  <div className="py-8 px-8 max-w-2xl mx-auto">
    <p className="text-sm text-[#64748b]">
      No resume analysis found.{" "}
      <button
        onClick={() => go("resume-upload")}
        className="text-[#4f46e5] underline"
      >
        Upload a resume
      </button>{" "}
      to get started.
    </p>
  </div>
)}
{screen === "interview-setup" && (
  <InterviewSetupScreen
    userName={userName}
    onStart={async (cfg) => {
      try {
        if (!userId) {
          console.error("No logged-in user ID is available.");
          go("interview-error");
          return;
        }
    // 1. Create the interview session in the database.
    const sessionResponse = await fetch(
      "http://localhost:8000/api/interview-session.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          target_role: cfg.role,
          industry: cfg.industry,
          interview_type: cfg.type,
          difficulty_level: cfg.difficulty,
          question_count: cfg.count,
          use_career_profile: cfg.useProfile,
        }),
      }
    );

    const sessionData = await sessionResponse.json();

    if (!sessionResponse.ok) {
      console.error(
        sessionData.message || "Unable to create interview session."
      );
      go("interview-error");
      return;
    }

    const newSessionId = Number(sessionData.session_id);
    setInterviewSessionId(newSessionId);
// 2. Show the generating screen before starting the real AI request.
go("interview-generating");

// Allow React/browser to paint the generating screen first.
await new Promise<void>((resolve) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => resolve());
  });
});

// 3. Generate interview questions using the backend OpenAI service.
const aiQuestionsResponse = await fetch(
   
  "http://localhost:8000/api/interview-generate.php",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: newSessionId,
    }),
  }
);

const aiQuestionsData = await aiQuestionsResponse.json();

if (!aiQuestionsResponse.ok) {
  console.error(
    aiQuestionsData.code || "AI_GENERATION_FAILED",
    aiQuestionsData.message || "Unable to generate interview questions."
  );
  go("interview-error");
  return;
}

const generatedQuestions: IQ[] = aiQuestionsData.questions;

// 4. Store the validated AI-generated questions against the real database session.
    const questionsResponse = await fetch(
      "http://localhost:8000/api/interview-questions.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: newSessionId,
          questions: generatedQuestions,
        }),
      }
    );

    const questionsData = await questionsResponse.json();

    if (!questionsResponse.ok) {
      console.error(
        questionsData.message || "Unable to store interview questions."
      );
      go("interview-error");
      return;
    }

    const savedQuestionIds = questionsData.questions.map(
      (question: { question_id: number }) => question.question_id
    );

    setQuestionIds(savedQuestionIds);
    setInterviewConfig(cfg);
    setSessionQuestions(generatedQuestions);

    setQIndex(0);
    setCompletedQs(0);
    setCurrentAnswer("");

    setActivity((prev) => ({
      ...prev,
      currentInterviewAnswered: 0,
      currentInterviewTotal: cfg.count,
    }));

    console.log("Interview session created:", newSessionId);
    console.log("Interview question IDs:", savedQuestionIds);

    go("interview-question");
  } catch (error) {
    console.error("Interview setup request failed:", error);
    go("interview-error");
  }
}}
             
              />
            )}
            {screen === "interview-generating" && (
              <InterviewGeneratingScreen
                onDone={() => go("interview-question")}
                onError={() => go("interview-error")}
              />
            )}
            {screen === "interview-error" && (
              <AIErrorScreen
                context="AI-generated interview questions"
                onRetry={() => go("interview-generating")}
                onBack={() => go("interview-setup")}
              />
            )}
            {screen === "interview-question" && sessionQuestions.length > 0 && (
              <InterviewQuestionScreen
  qIndex={qIndex}
  answeredCount={completedQs}
  total={interviewConfig.count}
  question={sessionQuestions[qIndex] ?? sessionQuestions[0]}
               onSubmit={async (ans) => {
  try {
    const questionId = questionIds[qIndex];

    if (!questionId) {
      console.error("No database question ID found for the current question.");
      go("interview-error");
      return;
    }

    const response = await fetch(
      "http://localhost:8000/api/interview-response.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question_id: questionId,
          response_text: ans,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        data.message || "Unable to store interview response."
      );
      go("interview-error");
      return;
    }

    setCurrentAnswer(ans);

    const newCompleted = completedQs + 1;
    setCompletedQs(newCompleted);

    setActivity((prev) => ({
      ...prev,
      currentInterviewAnswered: newCompleted,
    }));

    console.log(
      "Interview response stored:",
      data.response_id,
      "for question:",
      questionId
    );

    const next = qIndex + 1;
if (next >= interviewConfig.count) {
  completeInterviewSession();
}
else {
  setQIndex(next);
  setCurrentAnswer("");
  go("interview-question");
}
  } catch (error) {
    console.error("Interview response request failed:", error);
    go("interview-error");
  }
}}
                onSkip={() => {
  if (qIndex + 1 >= interviewConfig.count) {
    completeInterviewSession();
  } else {
    setQIndex((i) => i + 1);
  }
}}
onEnd={() => completeInterviewSession("ended_early")}
                
              />
            )}
            {screen === "interview-feedback-generating" && (
  <InterviewFeedbackGeneratingScreen
    onDone={() => go("interview-feedback-error")}
    onError={() => go("interview-feedback-error")}
  />
)}
{screen === "interview-feedback-error" && (
  <AIErrorScreen
    context="AI-generated interview feedback"
    onRetry={() => go("interview-feedback-generating")}
    onBack={() => {
      const next = qIndex + 1;

      if (next >= interviewConfig.count) {
        go("interview-summary");
      } else {
        setQIndex(next);
        setCurrentAnswer("");
        go("interview-question");
      }
    }}
  />
)}
            
            {screen === "interview-feedback" && sessionQuestions.length > 0 && (
              <InterviewFeedbackScreen
                qIndex={qIndex}
                total={interviewConfig.count}
                question={sessionQuestions[qIndex] ?? sessionQuestions[0]}
                answer={currentAnswer}
                onNext={() => {
                  const next = qIndex + 1;
                  if (next >= interviewConfig.count) go("interview-summary");
                  else { setQIndex(next); go("interview-question"); }
                }}
                onRetry={() => go("interview-question")}
                onEnd={() => go("interview-summary")}
              />
            )}
            {screen === "interview-summary" && (
              <InterviewSummaryScreen
                total={interviewConfig.count}
                completed={completedQs}
                onPracticeAgain={() => {
                  const today = new Date().toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
                  setActivity((prev) => ({
                    ...prev,
                    interviewSessions: [
                      { date: today, role: interviewConfig.role, questionsAnswered: completedQs, total: interviewConfig.count },
                      ...prev.interviewSessions,
                    ],
                    currentInterviewAnswered: 0,
                    currentInterviewTotal: 0,
                  }));
                  setQIndex(0); setCompletedQs(0); go("interview-setup");
                }}
                onDashboard={() => {
                  const today = new Date().toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
                  setActivity((prev) => ({
                    ...prev,
                    interviewSessions: [
                      { date: today, role: interviewConfig.role, questionsAnswered: completedQs, total: interviewConfig.count },
                      ...prev.interviewSessions,
                    ],
                    currentInterviewAnswered: 0,
                    currentInterviewTotal: 0,
                  }));
                  go("dashboard");
                }}
              />
            )}
            {screen === "job-match-input" && userId && (
  <JobMatchInputScreen
    userId={userId}
    onAnalyse={async (jobText, jobUrl, resumeId) => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/job-advertisement.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: userId,
              job_ad_text: jobText,
              job_url: jobUrl,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(
            "Unable to save job advertisement:",
            data.message
          );
          go("job-match-error");
          return;
        }

        setPendingJobMatch({
          jobText,
          jobUrl,
          resumeId,
          jobAdId: data.job_ad_id,
        });

        setJobMatchResult(null);
        go("job-match-analysing");
      } catch (error) {
        console.error(
          "Unable to connect to job advertisement API:",
          error
        );
        go("job-match-error");
      }
    }}
  />
)}
        {screen === "job-match-analysing" && (
  <JobMatchAnalysingScreen
    onDone={async () => {
      if (
        !userId ||
        !pendingJobMatch?.jobAdId ||
        !pendingJobMatch.resumeId
      ) {
        console.error("Missing job match analysis data.");
        go("job-match-error");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:8000/api/job-match-analysis.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: userId,
              job_ad_id: pendingJobMatch.jobAdId,
              resume_id: pendingJobMatch.resumeId,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(
            "Job match analysis unavailable:",
            data.code,
            data.message
          );

          setJobMatchResult(null);
          go("job-match-error");
          return;
        }

        /*
         * A real JobMatchResult will be assigned here after the
         * live AI analysis service is implemented.
         */
        setJobMatchResult(data.result);
        go("job-match-results");
      } catch (error) {
        console.error(
          "Unable to connect to job match analysis API:",
          error
        );

        setJobMatchResult(null);
        go("job-match-error");
      }
    }}
    onError={() => go("job-match-error")}
  />
)}    
              
            {screen === "job-match-error" && (
              <AIErrorScreen
                context="AI-generated job match analysis"
                onRetry={() => go("job-match-analysing")}
                onBack={() => go("job-match-input")}
              />
            )}
            {screen === "job-match-results" && jobMatchResult && (
              <JobMatchResultsScreen
                result={jobMatchResult}
                onImproveResume={(role) => {
                  setActiveNav("resume");
                  go("resume-upload");
                }}
                onPracticeInterview={(role) => {
                  setInterviewConfig((prev) => ({ ...prev, role }));
                  setActiveNav("interview");
                  go("interview-setup");
                }}
                onAnalyseAnother={() => go("job-match-input")}
              />
            )}
            {screen === "job-match-results" && !jobMatchResult && (
              <div className="py-8 px-8 max-w-2xl mx-auto">
                <p className="text-sm text-[#64748b]">No job match analysis found. <button onClick={() => go("job-match-input")} className="text-[#4f46e5] underline">Start a new analysis</button>.</p>
              </div>
            )}
        {screen === "progress" && userId && (
  <ProgressScreen userId={userId} />
)}
            {screen === "responsible-ai" && <ResponsibleAIScreen />}
          </main>
        </div>
      )}
    </div>
  );
}
